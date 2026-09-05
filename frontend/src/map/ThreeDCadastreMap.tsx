/**
 * VERTI-CAD — High-Performance 3D Cadastral Map Engine
 *
 * Features:
 *  - LiDAR-style Point Cloud rendering (THREE.Points, 35,000 particles)
 *  - Dynamic Three.js Clipping Planes (floor-by-floor slicer)
 *  - 3 Camera Modes: Surface | Underground | Aerial
 *  - Color-coded volumetric property units with AABB raycasting
 *  - Conflict zone pulsing animation
 *  - Compass, scale bar, map legend
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Parcel, Building, Floor, PropertyUnit, TopologyConflict } from '../types';
import {
  Plus,
  Minus,
  RotateCcw,
  Compass,
  Maximize2,
  Minimize2,
  Box,
  Layers,
  Eye,
  EyeOff,
  AlertTriangle,
  Globe,
  ArrowDown,
  Plane,
} from 'lucide-react';

// ─── Camera Mode ──────────────────────────────────────────────
export type CameraMode = 'surface' | 'underground' | 'aerial';

// ─── Component Props ──────────────────────────────────────────
interface ThreeDCadastreMapProps {
  parcels: Parcel[];
  building: Building | null;
  floors: Floor[];
  properties: PropertyUnit[];
  conflict: TopologyConflict | null;
  selectedFloor: Floor | null;
  selectedProperty: PropertyUnit | null;
  isConflictIsolated: boolean;
  isolatedFloorId: number | null;
  showUnderground: boolean;
  activeLayers: Record<string, boolean>;
  cameraMode: CameraMode;
  clipFloorY: number | null;
  showPointCloud: boolean;
  onSelectFloor: (floor: Floor | null) => void;
  onSelectProperty: (property: PropertyUnit | null) => void;
  onResetView: () => void;
  onCameraMode?: (mode: CameraMode) => void;
}

// ─────────────────────────────────────────────────────────────
// LiDAR Point Cloud Generator
// Simulates terrestrial LiDAR scanner output: 35,000 points
// Color-coded by elevation (Yellow=low → Cyan=mid → Indigo=high)
// ─────────────────────────────────────────────────────────────
function buildPointCloud(building: Building | null): THREE.Points {
  const NUM_POINTS = 35_000;
  const positions = new Float32Array(NUM_POINTS * 3);
  const colors = new Float32Array(NUM_POINTS * 3);

  const bldgH = building ? building.height : 24;
  const colorLow = new THREE.Color(0xfbbf24);    // Amber  — ground/road
  const colorMid = new THREE.Color(0x22d3ee);    // Cyan   — building mid
  const colorHigh = new THREE.Color(0x818cf8);   // Indigo — rooftop/sky

  for (let i = 0; i < NUM_POINTS; i++) {
    const t = Math.random();
    let x: number, y: number, z: number;

    if (i < NUM_POINTS * 0.35) {
      // Ground scatter — wide area
      x = (Math.random() - 0.5) * 160;
      y = Math.random() * 0.6;
      z = (Math.random() - 0.5) * 160;
    } else if (i < NUM_POINTS * 0.7) {
      // Building surface scatter
      const face = Math.floor(Math.random() * 4);
      const bh = Math.random() * bldgH;
      if (face === 0) { x = -15 + Math.random() * 0.4; z = (Math.random() - 0.5) * 20; }
      else if (face === 1) { x = 15 - Math.random() * 0.4; z = (Math.random() - 0.5) * 20; }
      else if (face === 2) { x = (Math.random() - 0.5) * 30; z = -10 + Math.random() * 0.4; }
      else { x = (Math.random() - 0.5) * 30; z = 10 - Math.random() * 0.4; }
      y = bh + (Math.random() - 0.5) * 0.3;
    } else if (i < NUM_POINTS * 0.85) {
      // Roof scatter
      x = (Math.random() - 0.5) * 30;
      y = bldgH + Math.random() * 1.5;
      z = (Math.random() - 0.5) * 20;
    } else {
      // Road / pavement dense points
      x = (Math.random() - 0.5) * 200;
      y = Math.random() * 0.1;
      z = 38 + (Math.random() - 0.5) * 12; // Road band
    }

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    // Color by elevation
    const normY = Math.min(Math.max(y / (bldgH + 2), 0), 1);
    let col: THREE.Color;
    if (normY < 0.5) {
      col = colorLow.clone().lerp(colorMid, normY * 2);
    } else {
      col = colorMid.clone().lerp(colorHigh, (normY - 0.5) * 2);
    }
    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.12,
    vertexColors: true,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.72,
  });

  const cloud = new THREE.Points(geo, mat);
  cloud.name = 'lidar_point_cloud';
  return cloud;
}

// ─────────────────────────────────────────────────────────────
// DEM Terrain Mesh (procedural vertex displacement)
// ─────────────────────────────────────────────────────────────
function buildTerrainMesh(): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(300, 300, 60, 60);
  const posAttr = geo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getY(i);
    // Gentle rolling terrain (Perlin-like via sin/cos)
    const noise =
      Math.sin(x * 0.04) * Math.cos(z * 0.04) * 0.6 +
      Math.sin(x * 0.09 + 1.2) * Math.cos(z * 0.09) * 0.3;
    posAttr.setZ(i, noise);
  }
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    color: 0xdde8cc,
    roughness: 0.95,
    metalness: 0.0,
    transparent: true,
    opacity: 0.75,
  });

  const terrain = new THREE.Mesh(geo, mat);
  terrain.rotation.x = -Math.PI / 2;
  terrain.position.y = -0.05;
  terrain.receiveShadow = true;
  terrain.name = 'dem_terrain';
  return terrain;
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
export const ThreeDCadastreMap: React.FC<ThreeDCadastreMapProps> = ({
  parcels,
  building,
  floors,
  properties,
  conflict,
  selectedFloor,
  selectedProperty,
  isConflictIsolated,
  isolatedFloorId,
  showUnderground,
  activeLayers,
  cameraMode,
  clipFloorY,
  showPointCloud,
  onSelectFloor,
  onSelectProperty,
  onResetView,
  onCameraMode,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());

  // Mesh registries for Raycasting & material updates
  const unitMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const floorMeshesRef = useRef<Map<number, THREE.Group>>(new Map());
  const conflictMeshRef = useRef<THREE.Mesh | null>(null);
  const pointCloudRef = useRef<THREE.Points | null>(null);
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);

  // Camera tween targets
  const cameraTargetPos = useRef<THREE.Vector3 | null>(null);
  const cameraTargetLookAt = useRef<THREE.Vector3 | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [compassHeading, setCompassHeading] = useState<number>(0);
  const [showDEM, setShowDEM] = useState(true);

  // ── 1. Scene Initialization ───────────────────────────────
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || (window.innerHeight - 60);

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f4f8);
    scene.fog = new THREE.FogExp2(0xf0f4f8, 0.0025);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 1500);
    camera.position.set(50, 40, 55);
    cameraRef.current = camera;

    // Renderer with clipping enabled
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.localClippingEnabled = true; // ← Enable clipping planes
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    controls.minDistance = 5;
    controls.maxDistance = 500;
    controls.target.set(0, 8, 0);
    controlsRef.current = controls;

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));

    const sun = new THREE.DirectionalLight(0xfff8e7, 0.9);
    sun.position.set(60, 100, 45);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 10;
    sun.shadow.camera.far = 300;
    const d = 60;
    sun.shadow.camera.left = -d;
    sun.shadow.camera.right = d;
    sun.shadow.camera.top = d;
    sun.shadow.camera.bottom = -d;
    scene.add(sun);

    scene.add(new THREE.DirectionalLight(0x93c5fd, 0.3).translateX(-40).translateY(30).translateZ(-30));

    // Hemisphere light (sky/ground gradient)
    scene.add(new THREE.HemisphereLight(0xe0f2fe, 0xd4e6b5, 0.4));

    // Raycasting
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerDown = (event: MouseEvent) => {
      if ((event.target as HTMLElement).tagName !== 'CANVAS') return;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(
        Array.from(unitMeshesRef.current.values()),
        false
      );
      if (hits.length > 0) {
        const unitData = (hits[0].object as THREE.Mesh).userData.propertyUnit as PropertyUnit;
        if (unitData) {
          onSelectProperty(unitData);
          const floorObj = floors.find((f) => f.floor_number === unitData.floor_number);
          if (floorObj) onSelectFloor(floorObj);
        }
      }
    };
    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    // Resize handler
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);

      // Smooth camera tween
      if (cameraTargetPos.current && cameraRef.current && controlsRef.current) {
        cameraRef.current.position.lerp(cameraTargetPos.current, 0.055);
        if (cameraTargetLookAt.current) {
          controlsRef.current.target.lerp(cameraTargetLookAt.current, 0.055);
        }
        if (cameraRef.current.position.distanceTo(cameraTargetPos.current) < 0.15) {
          cameraTargetPos.current = null;
          cameraTargetLookAt.current = null;
        }
      }

      controls.update();

      // Conflict zone pulse animation
      if (conflictMeshRef.current) {
        const t = clockRef.current.getElapsedTime();
        const pulse = 0.7 + Math.sin(t * 4.5) * 0.3;
        (conflictMeshRef.current.material as THREE.MeshBasicMaterial).opacity = 0.6 * pulse;
      }

      // Point cloud gentle rotation
      if (pointCloudRef.current && showPointCloud) {
        pointCloudRef.current.rotation.y += 0.00015;
      }

      // Compass sync
      if (cameraRef.current) {
        const dir = new THREE.Vector3();
        cameraRef.current.getWorldDirection(dir);
        setCompassHeading(Math.round(Math.atan2(dir.x, dir.z) * (180 / Math.PI)));
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 2. Clipping Plane (Floor Slicer) ─────────────────────
  useEffect(() => {
    if (!rendererRef.current) return;
    if (clipFloorY !== null && clipFloorY >= 0) {
      // Clip everything ABOVE clipFloorY — shows only up to that floor level
      rendererRef.current.clippingPlanes = [
        new THREE.Plane(new THREE.Vector3(0, -1, 0), clipFloorY),
      ];
    } else {
      rendererRef.current.clippingPlanes = [];
    }
  }, [clipFloorY]);

  // ── 3. Camera Mode Transitions ───────────────────────────
  useEffect(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    switch (cameraMode) {
      case 'surface':
        cameraTargetPos.current = new THREE.Vector3(50, 40, 55);
        cameraTargetLookAt.current = new THREE.Vector3(0, 10, 0);
        controlsRef.current.maxPolarAngle = Math.PI / 2 - 0.02;
        controlsRef.current.minPolarAngle = 0;
        break;
      case 'underground':
        cameraTargetPos.current = new THREE.Vector3(18, -10, 28);
        cameraTargetLookAt.current = new THREE.Vector3(0, -4, 0);
        controlsRef.current.maxPolarAngle = Math.PI - 0.05;
        controlsRef.current.minPolarAngle = 0;
        break;
      case 'aerial':
        cameraTargetPos.current = new THREE.Vector3(0.5, 130, 1.5);
        cameraTargetLookAt.current = new THREE.Vector3(0, 0, 0);
        controlsRef.current.maxPolarAngle = Math.PI / 2;
        controlsRef.current.minPolarAngle = 0;
        break;
    }
  }, [cameraMode]);

  // ── 4. Underground mode polar angle ─────────────────────
  useEffect(() => {
    if (!controlsRef.current) return;
    if (showUnderground) {
      controlsRef.current.maxPolarAngle = Math.PI - 0.05;
    } else if (cameraMode === 'surface') {
      controlsRef.current.maxPolarAngle = Math.PI / 2 - 0.02;
    }
  }, [showUnderground, cameraMode]);

  // ── 5. Point Cloud toggle ────────────────────────────────
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (showPointCloud && !pointCloudRef.current) {
      const cloud = buildPointCloud(building);
      scene.add(cloud);
      pointCloudRef.current = cloud;
    } else if (!showPointCloud && pointCloudRef.current) {
      scene.remove(pointCloudRef.current);
      pointCloudRef.current.geometry.dispose();
      (pointCloudRef.current.material as THREE.PointsMaterial).dispose();
      pointCloudRef.current = null;
    }
  }, [showPointCloud, building]);

  // ── 6. DEM Terrain toggle ────────────────────────────────
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (showDEM && !terrainMeshRef.current) {
      const terrain = buildTerrainMesh();
      scene.add(terrain);
      terrainMeshRef.current = terrain;
    } else if (!showDEM && terrainMeshRef.current) {
      scene.remove(terrainMeshRef.current);
      terrainMeshRef.current = null;
    }
  }, [showDEM]);

  // ── 7. Cadastral Environment (re-build on data change) ───
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clear previous environment
    const toRemove: THREE.Object3D[] = [];
    scene.children.forEach((c) => {
      if (c.name === 'cadastral_environment') toRemove.push(c);
    });
    toRemove.forEach((obj) => scene.remove(obj));
    unitMeshesRef.current.clear();
    floorMeshesRef.current.clear();
    conflictMeshRef.current = null;

    const root = new THREE.Group();
    root.name = 'cadastral_environment';
    scene.add(root);

    const bldgW = 30;
    const bldgD = 20;

    // ── Parcels & Ground ─────────────────────────────────
    if (activeLayers.parcels !== false) {
      // Ground plane
      const gndGeo = new THREE.PlaneGeometry(280, 280);
      const gndMat = new THREE.MeshStandardMaterial({
        color: 0xecf0f1,
        roughness: 0.88,
        transparent: showUnderground,
        opacity: showUnderground ? 0.4 : 1,
      });
      const gnd = new THREE.Mesh(gndGeo, gndMat);
      gnd.rotation.x = -Math.PI / 2;
      gnd.receiveShadow = true;
      root.add(gnd);

      // Coordinate grid
      root.add(new THREE.GridHelper(220, 44, 0x94a3b8, 0xe2e8f0));

      // Primary parcel boundary — P-001245 (60×60m)
      const addParcelBorder = (
        w: number, h: number, posX: number, posZ: number,
        color: number, lineW: number
      ) => {
        const geo = new THREE.BoxGeometry(w, 0.2, h);
        const line = new THREE.LineSegments(
          new THREE.EdgesGeometry(geo),
          new THREE.LineBasicMaterial({ color, linewidth: lineW })
        );
        line.position.set(posX, 0.1, posZ);
        root.add(line);

        // Semi-transparent fill
        const fill = new THREE.Mesh(
          new THREE.PlaneGeometry(w, h),
          new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.04, side: THREE.DoubleSide })
        );
        fill.rotation.x = -Math.PI / 2;
        fill.position.set(posX, 0.05, posZ);
        root.add(fill);
      };

      addParcelBorder(60, 60, 0, 0, 0x0284c7, 3);      // P-001245 (primary, blue)
      addParcelBorder(50, 60, -60, 0, 0x94a3b8, 1.5);  // P-001244 (west)
      addParcelBorder(55, 60, 62, 0, 0x94a3b8, 1.5);   // P-001246 (east)

      // Parcel labels (axis-aligned billboards using line markers)
      const drawLabel = (posX: number, posZ: number) => {
        const marker = new THREE.Mesh(
          new THREE.SphereGeometry(0.5, 8, 8),
          new THREE.MeshStandardMaterial({ color: 0x0284c7 })
        );
        marker.position.set(posX, 0.5, posZ);
        root.add(marker);
      };
      drawLabel(-30, -30); drawLabel(30, -30);
      drawLabel(-30, 30); drawLabel(30, 30);
    }

    // ── Roads ────────────────────────────────────────────
    if (activeLayers.roads !== false) {
      // Front road
      const roadMat = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.8 });
      const road = new THREE.Mesh(new THREE.PlaneGeometry(240, 14), roadMat);
      road.rotation.x = -Math.PI / 2;
      road.position.set(0, 0.02, 38);
      root.add(road);

      // Road dashes
      for (let x = -100; x <= 100; x += 12) {
        const dash = new THREE.Mesh(
          new THREE.PlaneGeometry(6, 0.5),
          new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(x, 0.04, 38);
        root.add(dash);
      }

      // Side road (north-south)
      const sideRoad = new THREE.Mesh(new THREE.PlaneGeometry(12, 100), roadMat);
      sideRoad.rotation.x = -Math.PI / 2;
      sideRoad.position.set(-90, 0.02, -10);
      root.add(sideRoad);
    }

    // ── Building B07 — VERTI Tower (floor slabs + columns) ──
    if (activeLayers.buildings !== false) {
      floors.forEach((fl) => {
        const isBasement = fl.floor_number < 0;
        const isSelectedFloor = selectedFloor?.id === fl.id;
        const isIsolated = isolatedFloorId !== null;
        const isHiddenByIsolation = isIsolated && isolatedFloorId !== fl.id;

        if (isConflictIsolated && fl.floor_number !== 5) return;
        if (isHiddenByIsolation) return;

        // Skip basement visual if underground mode off
        if (isBasement && !showUnderground) return;

        const fg = new THREE.Group();
        fg.name = `Floor_${fl.level_code}`;
        root.add(fg);
        floorMeshesRef.current.set(fl.id, fg);

        const slabY = fl.z_min;
        const slabH = 0.22;

        // Floor slab
        const slabMat = new THREE.MeshStandardMaterial({
          color: isSelectedFloor ? 0x0369a1 : isBasement ? 0x475569 : 0xd4dde8,
          roughness: 0.55,
          metalness: 0.08,
          transparent: true,
          opacity: isSelectedFloor ? 0.9 : 0.82,
        });
        const slab = new THREE.Mesh(new THREE.BoxGeometry(bldgW, slabH, bldgD), slabMat);
        slab.position.set(0, slabY, 0);
        slab.receiveShadow = true;
        fg.add(slab);

        // Slab edge wireframe
        const slabEdge = new THREE.LineSegments(
          new THREE.EdgesGeometry(new THREE.BoxGeometry(bldgW, slabH, bldgD)),
          new THREE.LineBasicMaterial({
            color: isSelectedFloor ? 0x0284c7 : 0x94a3b8,
            linewidth: isSelectedFloor ? 2 : 1,
          })
        );
        slabEdge.position.copy(slab.position);
        fg.add(slabEdge);

        // Structural columns (4 corners)
        const colH = fl.floor_height;
        const colMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.6 });
        [
          [-bldgW / 2 + 0.6, -bldgD / 2 + 0.6],
          [bldgW / 2 - 0.6, -bldgD / 2 + 0.6],
          [-bldgW / 2 + 0.6, bldgD / 2 - 0.6],
          [bldgW / 2 - 0.6, bldgD / 2 - 0.6],
        ].forEach(([cx, cz]) => {
          const col = new THREE.Mesh(new THREE.BoxGeometry(0.9, colH, 0.9), colMat);
          col.position.set(cx, slabY + colH / 2, cz);
          col.castShadow = true;
          fg.add(col);
        });

        // Interior cross-beams (structural BIM detail)
        const beamMat = new THREE.MeshStandardMaterial({ color: 0xb0bec5 });
        const beam = new THREE.Mesh(new THREE.BoxGeometry(bldgW, 0.35, 0.4), beamMat);
        beam.position.set(0, slabY + 0.18, 0);
        fg.add(beam);
      });
    }

    // ── Property Unit Volumes ────────────────────────────
    if (activeLayers.properties !== false) {
      properties.forEach((prop) => {
        const isBasement = prop.floor_number < 0;
        if (isBasement && !showUnderground) return;

        const floorObj = floors.find((f) => f.floor_number === prop.floor_number);
        if (isolatedFloorId !== null && floorObj && floorObj.id !== isolatedFloorId) return;
        if (isConflictIsolated && prop.unit_number !== 'U503' && prop.unit_number !== 'U504') return;

        const isSelected = selectedProperty?.id === prop.id;
        const isConflictUnit = prop.status === 'CONFLICT_FLAGGED';

        const uw = (prop.x_max ?? 15) - (prop.x_min ?? -15);
        const ud = (prop.y_max ?? 10) - (prop.y_min ?? -10);
        const uh = prop.z_max - prop.z_min;
        const cx = ((prop.x_min ?? -15) + (prop.x_max ?? 15)) / 2;
        const cz = ((prop.y_min ?? -10) + (prop.y_max ?? 10)) / 2;
        const cy = (prop.z_min + prop.z_max) / 2;

        // Color system (per spec)
        let unitColor = 0x38bdf8; // Residential — Blue
        let opacity = 0.72;

        if (isConflictUnit) {
          unitColor = 0xef4444; opacity = 0.88; // Conflict — Red
        } else if (prop.property_type.toLowerCase().includes('commercial') || prop.property_type.toLowerCase().includes('retail')) {
          unitColor = 0x10b981; // Commercial — Green
        } else if (prop.property_type.toLowerCase().includes('parking')) {
          unitColor = 0x64748b; // Parking — Slate
        } else if (prop.property_type.toLowerCase().includes('utility') || prop.property_type.toLowerCase().includes('storage')) {
          unitColor = 0xd97706; // Utility — Amber
        } else if (prop.property_type.toLowerCase().includes('penthouse')) {
          unitColor = 0x8b5cf6; // Penthouse — Purple
        }

        if (isSelected) {
          unitColor = 0xf59e0b; opacity = 0.97; // Selected — Gold
        }

        const unitGeo = new THREE.BoxGeometry(uw - 0.18, uh - 0.1, ud - 0.18);
        const unitMat = new THREE.MeshStandardMaterial({
          color: unitColor,
          transparent: true,
          opacity,
          roughness: 0.28,
          metalness: 0.12,
        });

        const unitMesh = new THREE.Mesh(unitGeo, unitMat);
        unitMesh.position.set(cx, cy, cz);
        unitMesh.castShadow = true;
        unitMesh.receiveShadow = true;
        unitMesh.userData = { propertyUnit: prop };
        root.add(unitMesh);
        unitMeshesRef.current.set(prop.unit_number, unitMesh);

        // Edge wireframe
        const edgeLine = new THREE.LineSegments(
          new THREE.EdgesGeometry(unitGeo),
          new THREE.LineBasicMaterial({
            color: isSelected ? 0xffffff : isConflictUnit ? 0xff6b6b : 0x0284c7,
            linewidth: isSelected || isConflictUnit ? 2 : 1,
          })
        );
        edgeLine.position.copy(unitMesh.position);
        root.add(edgeLine);

        // Selection halo ring (subtle glow box)
        if (isSelected) {
          const haloGeo = new THREE.BoxGeometry(uw + 0.5, uh + 0.4, ud + 0.5);
          const haloMat = new THREE.MeshBasicMaterial({
            color: 0xf59e0b,
            transparent: true,
            opacity: 0.15,
            side: THREE.BackSide,
          });
          const halo = new THREE.Mesh(haloGeo, haloMat);
          halo.position.set(cx, cy, cz);
          root.add(halo);
        }
      });
    }

    // ── Topology Conflict 3D Volume (U503 ↔ U504) ───────
    if (activeLayers.conflicts !== false && conflict) {
      const ovH = conflict.overlapEnd - conflict.overlapStart;
      const ovY = (conflict.overlapStart + conflict.overlapEnd) / 2;

      const confGeo = new THREE.BoxGeometry(15, ovH, 10);
      const confMat = new THREE.MeshBasicMaterial({
        color: 0xdc2626,
        transparent: true,
        opacity: 0.65,
        side: THREE.DoubleSide,
      });
      const confBox = new THREE.Mesh(confGeo, confMat);
      confBox.position.set(-7.5, ovY, 5);
      root.add(confBox);
      conflictMeshRef.current = confBox;

      // Pulsing red border
      root.add((() => {
        const l = new THREE.LineSegments(
          new THREE.EdgesGeometry(confGeo),
          new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 3 })
        );
        l.position.copy(confBox.position);
        return l;
      })());

      // Conflict zone cross-hatch fill
      for (let z = -7.5; z <= 7.5; z += 2) {
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-7.5, ovY, z),
          new THREE.Vector3(7.5, ovY, z),
        ]);
        root.add(new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0xfca5a5 })));
      }
    }

    // ── Survey Benchmark Markers ─────────────────────────
    if (activeLayers.survey_points !== false) {
      const surveyPts: [number, number, number][] = [
        [-30, 0, -30], [30, 0, -30], [30, 0, 30], [-30, 0, 30], [0, 24, 0],
      ];
      surveyPts.forEach(([sx, sy, sz]) => {
        // Pole
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.25, 0.05, 1.5, 8),
          new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.2 })
        );
        pole.position.set(sx, sy + 0.75, sz);
        root.add(pole);

        // Ball marker
        const ball = new THREE.Mesh(
          new THREE.SphereGeometry(0.45, 12, 12),
          new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.3, roughness: 0.2 })
        );
        ball.position.set(sx, sy + 1.5, sz);
        root.add(ball);

        // Tripod legs
        [0, 1, 2].forEach((i) => {
          const angle = (i / 3) * Math.PI * 2;
          const pts = [
            new THREE.Vector3(sx, sy + 0.5, sz),
            new THREE.Vector3(sx + Math.cos(angle) * 1.2, sy, sz + Math.sin(angle) * 1.2),
          ];
          root.add(new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(pts),
            new THREE.LineBasicMaterial({ color: 0x92400e })
          ));
        });
      });
    }

    // ── Underground Utilities ────────────────────────────
    if (showUnderground) {
      const pipeConfigs: { y: number; color: number; label: string }[] = [
        { y: -3.8, color: 0x3b82f6, label: 'Water Main' },
        { y: -5.5, color: 0x6b7280, label: 'Sewer' },
        { y: -2.2, color: 0xfbbf24, label: 'Power Duct' },
      ];
      pipeConfigs.forEach(({ y, color }) => {
        const pipeMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5 });
        const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 70, 12), pipeMat);
        pipe.rotation.z = Math.PI / 2;
        pipe.position.set(0, y, 0);
        root.add(pipe);
      });
    }

  }, [parcels, building, floors, properties, conflict, selectedFloor, selectedProperty,
      isConflictIsolated, isolatedFloorId, showUnderground, activeLayers]);

  // ── 8. Camera Focus on Selection ────────────────────────
  useEffect(() => {
    if (!cameraRef.current || !controlsRef.current) return;

    if (isConflictIsolated) {
      cameraTargetPos.current = new THREE.Vector3(-20, 25, 22);
      cameraTargetLookAt.current = new THREE.Vector3(-7.5, 17.5, 5);
      return;
    }
    if (selectedProperty) {
      const cy = (selectedProperty.z_min + selectedProperty.z_max) / 2;
      const cx = ((selectedProperty.x_min ?? -15) + (selectedProperty.x_max ?? 15)) / 2;
      const cz = ((selectedProperty.y_min ?? -10) + (selectedProperty.y_max ?? 10)) / 2;
      cameraTargetPos.current = new THREE.Vector3(cx + 20, cy + 12, cz + 22);
      cameraTargetLookAt.current = new THREE.Vector3(cx, cy, cz);
      return;
    }
    if (selectedFloor) {
      const fmy = (selectedFloor.z_min + selectedFloor.z_max) / 2;
      cameraTargetPos.current = new THREE.Vector3(32, fmy + 14, 38);
      cameraTargetLookAt.current = new THREE.Vector3(0, fmy, 0);
    }
  }, [selectedProperty, selectedFloor, isConflictIsolated]);

  // ── Map Control Handlers ─────────────────────────────────
  const handleZoomIn = useCallback(() => {
    if (!cameraRef.current) return;
    const dir = new THREE.Vector3();
    cameraRef.current.getWorldDirection(dir);
    cameraRef.current.position.addScaledVector(dir, 10);
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!cameraRef.current) return;
    const dir = new THREE.Vector3();
    cameraRef.current.getWorldDirection(dir);
    cameraRef.current.position.addScaledVector(dir, -10);
  }, []);

  const handleTopView = useCallback(() => {
    cameraTargetPos.current = new THREE.Vector3(0, 95, 0.5);
    cameraTargetLookAt.current = new THREE.Vector3(0, 10, 0);
  }, []);

  const handle3DView = useCallback(() => {
    cameraTargetPos.current = new THREE.Vector3(50, 40, 55);
    cameraTargetLookAt.current = new THREE.Vector3(0, 10, 0);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      mountRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  // ── Render ────────────────────────────────────────────────
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Three.js Canvas */}
      <div ref={mountRef} style={{ width: '100%', height: '100%', outline: 'none' }} />

      {/* Camera Mode Indicator Badge */}
      <div
        style={{
          position: 'absolute',
          top: '0.75rem',
          right: '3.75rem',
          background: 'rgba(15,23,42,0.82)',
          color: '#38bdf8',
          fontSize: '0.7rem',
          fontWeight: 700,
          padding: '0.3rem 0.65rem',
          borderRadius: '20px',
          letterSpacing: '0.06em',
          border: '1px solid rgba(56,189,248,0.3)',
          backdropFilter: 'blur(4px)',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
        }}
      >
        {cameraMode === 'surface' && <><Globe size={12} /> SURFACE MODE</>}
        {cameraMode === 'underground' && <><ArrowDown size={12} /> UNDERGROUND</>}
        {cameraMode === 'aerial' && <><Plane size={12} /> AERIAL VIEW</>}
      </div>

      {/* Clipping Plane Indicator */}
      {clipFloorY !== null && clipFloorY >= 0 && (
        <div
          style={{
            position: 'absolute',
            top: '0.75rem',
            right: '12rem',
            background: 'rgba(245,158,11,0.15)',
            color: '#d97706',
            fontSize: '0.68rem',
            fontWeight: 700,
            padding: '0.28rem 0.6rem',
            borderRadius: '20px',
            border: '1px solid rgba(245,158,11,0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 20,
          }}
        >
          ✂ CLIPPING @ {clipFloorY.toFixed(0)}m
        </div>
      )}

      {/* Point Cloud Indicator */}
      {showPointCloud && (
        <div
          style={{
            position: 'absolute',
            top: '0.75rem',
            right: '21rem',
            background: 'rgba(99,102,241,0.15)',
            color: '#818cf8',
            fontSize: '0.68rem',
            fontWeight: 700,
            padding: '0.28rem 0.6rem',
            borderRadius: '20px',
            border: '1px solid rgba(99,102,241,0.35)',
            backdropFilter: 'blur(4px)',
            zIndex: 20,
          }}
        >
          ⬥ LiDAR ACTIVE (35K pts)
        </div>
      )}

      {/* Map Controls */}
      <div className="map-controls-corner">
        <button onClick={handleZoomIn} className="map-control-btn" title="Zoom In">
          <Plus size={18} />
        </button>
        <button onClick={handleZoomOut} className="map-control-btn" title="Zoom Out">
          <Minus size={18} />
        </button>
        <button onClick={onResetView} className="map-control-btn" title="Reset Camera">
          <RotateCcw size={18} />
        </button>
        <button onClick={handleTopView} className="map-control-btn" title="Top (Orthographic)">
          <span style={{ fontSize: '0.72rem', fontWeight: 700 }}>2D</span>
        </button>
        <button onClick={handle3DView} className="map-control-btn active" title="3D Perspective">
          <Box size={18} />
        </button>
        <button
          onClick={() => setShowDEM(!showDEM)}
          className={`map-control-btn ${showDEM ? 'active' : ''}`}
          title="Toggle DEM Terrain"
        >
          <Layers size={16} />
        </button>
        <button onClick={toggleFullscreen} className="map-control-btn" title="Fullscreen">
          {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
      </div>

      {/* North Compass */}
      <div className="map-compass-indicator" title="North Arrow">
        <div style={{ transform: `rotate(${-compassHeading}deg)`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Compass size={22} color="#dc2626" />
          <span style={{ fontSize: '0.65rem', fontWeight: 800, marginTop: '-2px' }}>N</span>
        </div>
      </div>

      {/* Scale Bar */}
      <div className="map-scale-bar" style={{ bottom: '1.25rem', left: '260px' }}>
        <div style={{ borderBottom: '2px solid #0f172a', width: '60px', marginBottom: '2px' }} />
        <span>10 meters</span>
      </div>

      {/* Map Legend */}
      <div className="map-legend-card">
        <div style={{ fontWeight: 700, fontSize: '0.72rem', color: '#0f172a', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
          MAP LEGEND
        </div>
        {[
          { color: '#38bdf8', label: 'Residential Unit' },
          { color: '#10b981', label: 'Commercial / Retail' },
          { color: '#dc2626', label: 'Conflict Overlap (1m)' },
          { color: '#fbbf24', label: 'Survey Benchmark' },
          { color: '#8b5cf6', label: 'Penthouse' },
          { color: '#0284c7', label: 'Parcel Boundary' },
          { color: '#818cf8', label: 'LiDAR Point Cloud' },
          { color: '#64748b', label: 'Basement / Parking' },
        ].map(({ color, label }) => (
          <div className="legend-item" key={label}>
            <span className="legend-color-box" style={{ background: color }} />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
