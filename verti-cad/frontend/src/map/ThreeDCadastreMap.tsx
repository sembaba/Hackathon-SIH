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

// ─── Moving Vehicle Types & Generator ─────────────────────────
interface MovingVehicle {
  mesh: THREE.Group;
  speed: number;
  minX: number;
  maxX: number;
  direction: 1 | -1;
}

function createVehicleMesh(
  type: 'sedan' | 'suv' | 'bus' | 'metro',
  color: number,
  direction: 1 | -1
): THREE.Group {
  const group = new THREE.Group();

  const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 10);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });

  const headlightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const taillightMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.15,
    metalness: 0.85,
  });

  if (type === 'sedan') {
    const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.25 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.65, 1.8), bodyMat);
    body.position.y = 0.55;
    body.castShadow = true;
    group.add(body);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.55, 1.5), glassMat);
    cabin.position.set(-0.2, 1.05, 0);
    cabin.castShadow = true;
    group.add(cabin);

    [-1.2, 1.2].forEach((wx) => {
      [-0.85, 0.85].forEach((wz) => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.position.set(wx, 0.32, wz);
        group.add(wheel);
      });
    });

    const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 0.3), headlightMat);
    hl1.position.set(2.01, 0.6, 0.6);
    const hl2 = hl1.clone();
    hl2.position.set(2.01, 0.6, -0.6);
    group.add(hl1, hl2);

    const tl1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 0.35), taillightMat);
    tl1.position.set(-2.01, 0.6, 0.6);
    const tl2 = tl1.clone();
    tl2.position.set(-2.01, 0.6, -0.6);
    group.add(tl1, tl2);
  } else if (type === 'suv') {
    const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.3 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.85, 2.0), bodyMat);
    body.position.y = 0.7;
    body.castShadow = true;
    group.add(body);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.7, 1.7), glassMat);
    cabin.position.set(-0.2, 1.4, 0);
    cabin.castShadow = true;
    group.add(cabin);

    const suvWheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 10);
    suvWheelGeo.rotateZ(Math.PI / 2);
    [-1.4, 1.4].forEach((wx) => {
      [-0.95, 0.95].forEach((wz) => {
        const wheel = new THREE.Mesh(suvWheelGeo, wheelMat);
        wheel.position.set(wx, 0.38, wz);
        group.add(wheel);
      });
    });

    const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 0.35), headlightMat);
    hl1.position.set(2.31, 0.75, 0.65);
    const hl2 = hl1.clone();
    hl2.position.set(2.31, 0.75, -0.65);
    group.add(hl1, hl2);

    const tl1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 0.35), taillightMat);
    tl1.position.set(-2.31, 0.75, 0.65);
    const tl2 = tl1.clone();
    tl2.position.set(-2.31, 0.75, -0.65);
    group.add(tl1, tl2);
  } else if (type === 'bus') {
    const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.4 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(9.6, 2.4, 2.4), bodyMat);
    body.position.y = 1.5;
    body.castShadow = true;
    group.add(body);

    const winStrip = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.7, 2.42), glassMat);
    winStrip.position.set(0, 1.8, 0);
    group.add(winStrip);

    const frontWind = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 2.2), glassMat);
    frontWind.position.set(4.81, 1.6, 0);
    group.add(frontWind);

    [-3.0, 1.8, 3.2].forEach((wx) => {
      [-1.15, 1.15].forEach((wz) => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.position.set(wx, 0.35, wz);
        group.add(wheel);
      });
    });

    const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.25, 0.4), headlightMat);
    hl1.position.set(4.82, 0.7, 0.8);
    const hl2 = hl1.clone();
    hl2.position.set(4.82, 0.7, -0.8);
    group.add(hl1, hl2);

    const tl1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.4), taillightMat);
    tl1.position.set(-4.82, 1.0, 0.8);
    const tl2 = tl1.clone();
    tl2.position.set(-4.82, 1.0, -0.8);
    group.add(tl1, tl2);
  }

  if (direction === -1) {
    group.rotation.y = Math.PI;
  }

  return group;
}

// ─────────────────────────────────────────────────────────────
// Multi-Car Articulated Metro Train Generator
// Creates a 3-car high-speed transit train with bullet nose,
// glowing passenger windows, articulated bellows, and pantographs.
// ─────────────────────────────────────────────────────────────
function createMetroTrainMesh(
  direction: 1 | -1,
  liveryColor: number = 0x0284c7,
  numCars: number = 3
): THREE.Group {
  const trainGroup = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.2,
    metalness: 0.55,
  });
  const stripeMat = new THREE.MeshStandardMaterial({
    color: liveryColor,
    roughness: 0.3,
    metalness: 0.2,
  });
  const windowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const darkGlassMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.1,
    metalness: 0.9,
  });
  const bogieMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85, roughness: 0.2 });
  const pantographMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });
  const headlightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const taillightMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

  const carLength = 11.5;
  const carWidth = 2.6;
  const carHeight = 2.6;
  const gangwayLength = 0.8;

  const totalSpan = numCars * carLength + (numCars - 1) * gangwayLength;
  const startX = totalSpan / 2 - carLength / 2;

  for (let c = 0; c < numCars; c++) {
    const isLead = c === 0;
    const isRear = c === numCars - 1;
    const carX = startX - c * (carLength + gangwayLength);

    const car = new THREE.Group();
    car.position.set(carX, 0, 0);

    // Main Car Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(carLength, carHeight, carWidth), bodyMat);
    body.position.y = carHeight / 2 + 0.45;
    body.castShadow = true;
    car.add(body);

    // Colored Livery Stripe
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(carLength + 0.05, 0.42, carWidth + 0.05), stripeMat);
    stripe.position.set(0, 1.25, 0);
    car.add(stripe);

    // Passenger Windows (Panoramic glowing cyan)
    const winGeo = new THREE.BoxGeometry(carLength - (isLead || isRear ? 2.5 : 1.2), 0.75, carWidth + 0.08);
    const windows = new THREE.Mesh(winGeo, windowMat);
    windows.position.set(isLead ? -0.6 : isRear ? 0.6 : 0, 2.0, 0);
    car.add(windows);

    // Roof AC Units
    [-3.0, 3.0].forEach((rx) => {
      const ac = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.35, 1.5), new THREE.MeshStandardMaterial({ color: 0x94a3b8 }));
      ac.position.set(rx, carHeight + 0.6, 0);
      car.add(ac);
    });

    // Bogies & Steel Train Wheels
    [-3.5, 3.5].forEach((bx) => {
      const bFrame = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.25, 2.2), bogieMat);
      bFrame.position.set(bx, 0.35, 0);
      car.add(bFrame);

      [-0.7, 0.7].forEach((wx) => {
        [-1.05, 1.05].forEach((wz) => {
          const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.16, 12), wheelMat);
          wheel.rotation.x = Math.PI / 2;
          wheel.position.set(bx + wx, 0.35, wz);
          car.add(wheel);
        });
      });
    });

    // Lead Car: Aerodynamic Nose, Windshield & Headlights
    if (isLead) {
      const noseGeo = new THREE.ConeGeometry(1.35, 2.4, 4);
      const nose = new THREE.Mesh(noseGeo, bodyMat);
      nose.rotation.z = -Math.PI / 2;
      nose.rotation.y = Math.PI / 4;
      nose.position.set(carLength / 2 + 1.2, carHeight / 2 + 0.45, 0);
      car.add(nose);

      const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.85, 2.1), darkGlassMat);
      windshield.position.set(carLength / 2 + 0.5, 2.15, 0);
      windshield.rotation.z = -0.3;
      car.add(windshield);

      // High-Power Headlights & Beams
      [-0.8, 0.8].forEach((hz) => {
        const hl = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), headlightMat);
        hl.position.set(carLength / 2 + 1.6, 1.4, hz);
        car.add(hl);

        const beam = new THREE.Mesh(
          new THREE.ConeGeometry(0.5, 4.0, 8),
          new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.28 })
        );
        beam.rotation.z = -Math.PI / 2;
        beam.position.set(carLength / 2 + 3.5, 1.4, hz);
        car.add(beam);
      });

      // Roof Pantograph (Power Collector)
      const pGroup = new THREE.Group();
      const arm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2), pantographMat);
      arm1.rotation.z = 0.6;
      arm1.position.set(-0.3, 0.5, 0);
      const arm2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2), pantographMat);
      arm2.rotation.z = -0.6;
      arm2.position.set(0.3, 1.2, 0);
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 1.8), pantographMat);
      bar.position.set(0, 1.7, 0);
      pGroup.add(arm1, arm2, bar);
      pGroup.position.set(-1.5, carHeight + 0.5, 0);
      car.add(pGroup);
    }

    // Rear Car: Red Marker Lights
    if (isRear) {
      [-0.8, 0.8].forEach((tz) => {
        const tl = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.35, 0.45), taillightMat);
        tl.position.set(-carLength / 2 - 0.06, 1.4, tz);
        car.add(tl);
      });

      const rearWindow = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.75, 1.8), darkGlassMat);
      rearWindow.position.set(-carLength / 2 - 0.05, 2.1, 0);
      car.add(rearWindow);
    }

    // Flexible Gangway Bellows between carriages
    if (!isRear) {
      const bellows = new THREE.Mesh(
        new THREE.BoxGeometry(gangwayLength, carHeight - 0.3, carWidth - 0.4),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.95 })
      );
      bellows.position.set(carX - carLength / 2 - gangwayLength / 2, carHeight / 2 + 0.45, 0);
      trainGroup.add(bellows);
    }

    trainGroup.add(car);
  }

  if (direction === -1) {
    trainGroup.rotation.y = Math.PI;
  }

  return trainGroup;
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
  const movingVehiclesRef = useRef<MovingVehicle[]>([]);

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

      // Animate dynamic moving traffic (surface roads & elevated transport corridor)
      const delta = Math.min(clockRef.current.getDelta(), 0.1);
      const vehicles = movingVehiclesRef.current;
      for (let i = 0; i < vehicles.length; i++) {
        const v = vehicles[i];
        v.mesh.position.x += v.speed * v.direction * delta;
        if (v.direction === 1 && v.mesh.position.x > v.maxX) {
          v.mesh.position.x = v.minX;
        } else if (v.direction === -1 && v.mesh.position.x < v.minX) {
          v.mesh.position.x = v.maxX;
        }
      }

      controls.update();

      // Conflict zone pulse animation
      if (conflictMeshRef.current) {
        const t = clockRef.current.elapsedTime;
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

    // Shared dark green material (used by park canopies and house rear trees)
    const grassDark = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.9 });

    // ── 🌿 Green Park / Garden — West of VERTI Tower (Parcel P-001244, X≈-60) ──
    {
      const parkGroup = new THREE.Group();
      parkGroup.name = 'green_park';
      root.add(parkGroup);

      // Lush grass lawn — 50×55m
      const grassMat = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.88, metalness: 0.0 });
      const lawn = new THREE.Mesh(new THREE.PlaneGeometry(48, 54), grassMat);
      lawn.rotation.x = -Math.PI / 2;
      lawn.position.set(-60, 0.03, 0);
      lawn.receiveShadow = true;
      parkGroup.add(lawn);

      // Gravel walking path through the park (diagonal crossing)
      const pathMat = new THREE.MeshStandardMaterial({ color: 0xe2c98a, roughness: 0.95 });
      const pathH = new THREE.Mesh(new THREE.PlaneGeometry(48, 2.2), pathMat);
      pathH.rotation.x = -Math.PI / 2;
      pathH.position.set(-60, 0.04, 0);
      parkGroup.add(pathH);
      const pathV = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 54), pathMat);
      pathV.rotation.x = -Math.PI / 2;
      pathV.position.set(-60, 0.04, 0);
      parkGroup.add(pathV);

      // Park Fountain — central feature
      const fountainBase = new THREE.Mesh(
        new THREE.CylinderGeometry(4.5, 5.0, 0.5, 20),
        new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.4, metalness: 0.2 })
      );
      fountainBase.position.set(-60, 0.25, 0);
      parkGroup.add(fountainBase);

      const fountainPool = new THREE.Mesh(
        new THREE.CylinderGeometry(3.8, 3.8, 0.3, 20),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.75 })
      );
      fountainPool.position.set(-60, 0.55, 0);
      parkGroup.add(fountainPool);

      const fountainSpire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.25, 3.0, 8),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 })
      );
      fountainSpire.position.set(-60, 2.0, 0);
      parkGroup.add(fountainSpire);

      // Park Benches
      const benchMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.7 });
      const benchLegMat = new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.7, roughness: 0.3 });
      [[-55, -8], [-55, 8], [-65, -8], [-65, 8]].forEach(([bx, bz]) => {
        const seat = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.15, 0.7), benchMat);
        seat.position.set(bx, 0.7, bz);
        parkGroup.add(seat);
        const back = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.7, 0.12), benchMat);
        back.position.set(bx, 1.1, bz - 0.32);
        parkGroup.add(back);
        [-1.1, 1.1].forEach((lx) => {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.65, 6), benchLegMat);
          leg.position.set(bx + lx, 0.32, bz);
          parkGroup.add(leg);
        });
      });

      // Trees — deciduous (sphere canopy on cylinder trunk)
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x713f12, roughness: 0.9 });
      const treePositions: [number, number, number, number][] = [
        [-72, 0, -22, 2.8], [-72, 0, 22, 3.2], [-48, 0, -22, 2.5],
        [-48, 0, 22, 3.0], [-72, 0, 0, 2.6], [-48, 0, 0, 2.9],
        [-60, 0, -24, 2.4], [-60, 0, 24, 3.1],
        [-55, 0, -15, 2.2], [-65, 0, 15, 2.7],
      ];
      treePositions.forEach(([tx, _ty, tz, radius]) => {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 3.2, 8), trunkMat);
        trunk.position.set(tx, 1.6, tz);
        trunk.castShadow = true;
        parkGroup.add(trunk);

        // Three layered canopy spheres for depth
        const canopyColors = [0x15803d, 0x166534, 0x4ade80];
        canopyColors.forEach((cColor, ci) => {
          const canopy = new THREE.Mesh(
            new THREE.SphereGeometry(radius - ci * 0.3, 10, 8),
            new THREE.MeshStandardMaterial({ color: cColor, roughness: 0.85 })
          );
          canopy.position.set(tx + (ci - 1) * 0.4, 3.2 + radius + ci * 0.5, tz + (ci - 1) * 0.3);
          canopy.castShadow = true;
          parkGroup.add(canopy);
        });
      });

      // Flower beds — colorful patches
      const flowerColors = [0xf472b6, 0xfbbf24, 0xf87171, 0xa78bfa];
      [[-55, -20], [-65, 20], [-57, 18], [-63, -18]].forEach(([fx, fz], fi) => {
        const bed = new THREE.Mesh(
          new THREE.PlaneGeometry(4.5, 2.5),
          new THREE.MeshStandardMaterial({ color: flowerColors[fi % flowerColors.length], roughness: 0.8 })
        );
        bed.rotation.x = -Math.PI / 2;
        bed.position.set(fx, 0.05, fz);
        parkGroup.add(bed);
      });

      // Park boundary low hedge fence
      const hedgeMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.95 });
      // North hedge
      const hedgeN = new THREE.Mesh(new THREE.BoxGeometry(48, 1.0, 0.8), hedgeMat);
      hedgeN.position.set(-60, 0.5, -27.5);
      parkGroup.add(hedgeN);
      // South hedge
      const hedgeS = hedgeN.clone();
      hedgeS.position.set(-60, 0.5, 27.5);
      parkGroup.add(hedgeS);
      // East hedge (faces VERTI Tower)
      const hedgeE = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.0, 54), hedgeMat);
      hedgeE.position.set(-36.5, 0.5, 0);
      parkGroup.add(hedgeE);
      // West hedge
      const hedgeW = hedgeE.clone();
      hedgeW.position.set(-83.5, 0.5, 0);
      parkGroup.add(hedgeW);
    }

    // ── 🏠 Residential House — East of VERTI Tower (Parcel P-001246, X≈+62) ──
    {
      const houseGroup = new THREE.Group();
      houseGroup.name = 'residential_house';
      root.add(houseGroup);

      const houseX = 62;
      const houseZ = -5;

      // Materials
      const wallMat  = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.7, metalness: 0.0 });
      const roofMat  = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.65 });
      const brickMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 });
      const glassMat = new THREE.MeshStandardMaterial({ color: 0x7dd3fc, roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.6 });
      const doorMat  = new THREE.MeshStandardMaterial({ color: 0x7c3aed, roughness: 0.6 });
      const trimMat  = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
      const concreteMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.9 });
      const woodMat  = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.8 });

      // House driveway / entrance slab
      const driveway = new THREE.Mesh(new THREE.PlaneGeometry(10, 20), concreteMat);
      driveway.rotation.x = -Math.PI / 2;
      driveway.position.set(houseX, 0.03, houseZ + 18);
      houseGroup.add(driveway);

      // Main house footprint: 22×15m, 2 storeys
      // Ground floor walls
      const groundFloor = new THREE.Mesh(new THREE.BoxGeometry(22, 4.5, 15), wallMat);
      groundFloor.position.set(houseX, 2.25, houseZ);
      groundFloor.castShadow = true;
      groundFloor.receiveShadow = true;
      houseGroup.add(groundFloor);

      // First floor walls
      const firstFloor = new THREE.Mesh(new THREE.BoxGeometry(22, 4.0, 15), wallMat);
      firstFloor.position.set(houseX, 6.75, houseZ);
      firstFloor.castShadow = true;
      houseGroup.add(firstFloor);

      // Brick accent base (plinth course)
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(22.4, 0.9, 15.4), brickMat);
      plinth.position.set(houseX, 0.45, houseZ);
      houseGroup.add(plinth);

      // Gabled Hip Roof (triangular prism)
      const roofGeo = new THREE.CylinderGeometry(0, 13.5, 4.8, 4, 1);
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.set(houseX, 11.2, houseZ);
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      houseGroup.add(roof);

      // Roof overhangs (eave)
      const eaveMat = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.5 });
      const eaveN = new THREE.Mesh(new THREE.BoxGeometry(24, 0.2, 1.0), eaveMat);
      eaveN.position.set(houseX, 9.0, houseZ - 8.0);
      houseGroup.add(eaveN);
      const eaveS = eaveN.clone(); eaveS.position.set(houseX, 9.0, houseZ + 8.0);
      houseGroup.add(eaveS);

      // Front door (south face)
      const door = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.4, 0.15), doorMat);
      door.position.set(houseX, 1.2, houseZ + 7.6);
      houseGroup.add(door);

      // Door frame white trim
      const doorFrameV = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.6, 0.2), trimMat);
      [-0.98, 0.98].forEach((dx) => {
        const df = doorFrameV.clone();
        df.position.set(houseX + dx, 1.3, houseZ + 7.65);
        houseGroup.add(df);
      });
      const doorTop = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.18, 0.2), trimMat);
      doorTop.position.set(houseX, 2.55, houseZ + 7.65);
      houseGroup.add(doorTop);

      // Transom window above door
      const transomWin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.55, 0.12), glassMat);
      transomWin.position.set(houseX, 2.85, houseZ + 7.6);
      houseGroup.add(transomWin);

      // Ground floor windows — south face
      [[-6, 7.6], [6, 7.6]].forEach(([wx, wz]) => {
        const win = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.6, 0.12), glassMat);
        win.position.set(houseX + wx, 2.8, houseZ + wz);
        houseGroup.add(win);
        const frame = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.9, 0.18), trimMat);
        frame.position.set(houseX + wx, 2.8, houseZ + wz - 0.03);
        houseGroup.add(frame);
        const wglass2 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.6, 0.12), glassMat);
        wglass2.position.set(houseX + wx, 2.8, houseZ + wz + 0.02);
        houseGroup.add(wglass2);
      });

      // First floor windows — south face
      [[-7, 7.6], [0, 7.6], [7, 7.6]].forEach(([wx, wz]) => {
        const win = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.4, 0.12), glassMat);
        win.position.set(houseX + wx, 6.8, houseZ + wz);
        houseGroup.add(win);
        const frame = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.7, 0.18), trimMat);
        frame.position.set(houseX + wx, 6.8, houseZ + wz - 0.02);
        houseGroup.add(frame);
        const wglass2 = win.clone();
        wglass2.position.set(houseX + wx, 6.8, houseZ + wz + 0.02);
        houseGroup.add(wglass2);
      });

      // Side windows — east & west faces
      [[-2, -7.7], [4, -7.7], [-2, 7.7], [4, 7.7]].forEach(([wx, wz]) => {
        const win = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.4, 1.8), glassMat);
        win.position.set(houseX + 11.06 * Math.sign(wz), 2.8, houseZ + wx);
        houseGroup.add(win);
      });

      // Chimney stack
      const chimney = new THREE.Mesh(new THREE.BoxGeometry(1.4, 3.5, 1.4), brickMat);
      chimney.position.set(houseX + 6, 12.5, houseZ - 2);
      chimney.castShadow = true;
      houseGroup.add(chimney);
      const chimneyCap = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.25, 1.8), new THREE.MeshStandardMaterial({ color: 0x374151 }));
      chimneyCap.position.set(houseX + 6, 14.3, houseZ - 2);
      houseGroup.add(chimneyCap);

      // Balcony — first floor south
      const balconyFloor = new THREE.Mesh(new THREE.BoxGeometry(8, 0.2, 2.5), concreteMat);
      balconyFloor.position.set(houseX, 4.6, houseZ + 8.85);
      houseGroup.add(balconyFloor);
      // Balcony glass railing
      const balconyRail = new THREE.Mesh(new THREE.BoxGeometry(8.2, 1.0, 0.1), glassMat);
      balconyRail.position.set(houseX, 5.2, houseZ + 10.05);
      houseGroup.add(balconyRail);
      // Vertical railing posts
      for (let rx = -3.5; rx <= 3.5; rx += 1.0) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.1, 6), trimMat);
        post.position.set(houseX + rx, 5.2, houseZ + 10.0);
        houseGroup.add(post);
      }

      // Porch / Portico with columns
      const porchSlab = new THREE.Mesh(new THREE.BoxGeometry(10, 0.2, 3.5), concreteMat);
      porchSlab.position.set(houseX, 0.1, houseZ + 9.5);
      houseGroup.add(porchSlab);
      const porchRoof = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.25, 3.8), eaveMat);
      porchRoof.position.set(houseX, 4.6, houseZ + 9.5);
      houseGroup.add(porchRoof);
      [-4.5, -1.5, 1.5, 4.5].forEach((cx) => {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 4.5, 10), trimMat);
        col.position.set(houseX + cx, 2.35, houseZ + 11.1);
        houseGroup.add(col);
        // Column capital
        const capital = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.2, 0.55), trimMat);
        capital.position.set(houseX + cx, 4.5, houseZ + 11.1);
        houseGroup.add(capital);
      });

      // Front Garden / Lawn
      const frontLawn = new THREE.Mesh(new THREE.PlaneGeometry(22, 8), new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.88 }));
      frontLawn.rotation.x = -Math.PI / 2;
      frontLawn.position.set(houseX, 0.04, houseZ + 17);
      houseGroup.add(frontLawn);

      // Garden shrubs
      const shrubMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 });
      [[-9, 13], [9, 13], [-9, 21], [9, 21]].forEach(([sx, sz]) => {
        const shrub = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 6), shrubMat);
        shrub.scale.y = 0.75;
        shrub.position.set(houseX + sx, 0.9, houseZ + sz);
        shrub.castShadow = true;
        houseGroup.add(shrub);
      });

      // Driveway car (parked)
      const parkedCar = createVehicleMesh('sedan', 0x1e3a5f, 1);
      parkedCar.position.set(houseX + 2, 0.05, houseZ + 19);
      parkedCar.rotation.y = Math.PI / 2;
      houseGroup.add(parkedCar);

      // Rear garden trees
      const trunkMat2 = new THREE.MeshStandardMaterial({ color: 0x713f12, roughness: 0.9 });
      [[-8, -11], [0, -13], [8, -11]].forEach(([tx, tz]) => {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 3.5, 8), trunkMat2);
        trunk.position.set(houseX + tx, 1.75, houseZ + tz);
        trunk.castShadow = true;
        houseGroup.add(trunk);
        const canopy = new THREE.Mesh(new THREE.SphereGeometry(2.8, 9, 7), grassDark);
        canopy.position.set(houseX + tx, 5.8, houseZ + tz);
        canopy.castShadow = true;
        houseGroup.add(canopy);
      });

      // Perimeter garden wall / fence
      const fenceMat = new THREE.MeshStandardMaterial({ color: 0xe2c98a, roughness: 0.8 });
      const fenceN = new THREE.Mesh(new THREE.BoxGeometry(26, 1.4, 0.3), fenceMat);
      fenceN.position.set(houseX, 0.7, houseZ - 15.5);
      houseGroup.add(fenceN);
      const fenceE = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.4, 54), fenceMat);
      fenceE.position.set(houseX + 13, 0.7, houseZ + 12);
      houseGroup.add(fenceE);
      const fenceW = fenceE.clone();
      fenceW.position.set(houseX - 13, 0.7, houseZ + 12);
      houseGroup.add(fenceW);
    }

    // ── Roads & Dynamic Traffic ────────────────────────────
    movingVehiclesRef.current = [];

    if (activeLayers.roads !== false) {
      // Front arterial boulevard (4-lane avenue, Z=38)
      const roadMat = new THREE.MeshStandardMaterial({ color: 0x272e39, roughness: 0.82 });
      const road = new THREE.Mesh(new THREE.PlaneGeometry(260, 16), roadMat);
      road.rotation.x = -Math.PI / 2;
      road.position.set(0, 0.02, 38);
      road.receiveShadow = true;
      root.add(road);

      // North & South Concrete Sidewalks / Curbs
      const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.9 });
      const northSidewalk = new THREE.Mesh(new THREE.BoxGeometry(260, 0.2, 2.2), sidewalkMat);
      northSidewalk.position.set(0, 0.1, 29.1);
      root.add(northSidewalk);

      const southSidewalk = new THREE.Mesh(new THREE.BoxGeometry(260, 0.2, 2.2), sidewalkMat);
      southSidewalk.position.set(0, 0.1, 46.9);
      root.add(southSidewalk);

      // Yellow Center Double Line (dividing eastbound & westbound)
      [-0.3, 0.3].forEach((zOff) => {
        const centerLine = new THREE.Mesh(
          new THREE.PlaneGeometry(260, 0.2),
          new THREE.MeshBasicMaterial({ color: 0xfacc15 })
        );
        centerLine.rotation.x = -Math.PI / 2;
        centerLine.position.set(0, 0.03, 38 + zOff);
        root.add(centerLine);
      });

      // White Lane Divider Dashes (Lane 1/2 and Lane 3/4)
      [34.2, 41.8].forEach((zLane) => {
        for (let x = -120; x <= 120; x += 10) {
          const dash = new THREE.Mesh(
            new THREE.PlaneGeometry(5, 0.35),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
          );
          dash.rotation.x = -Math.PI / 2;
          dash.position.set(x, 0.035, zLane);
          root.add(dash);
        }
      });

      // Pedestrian Crosswalks (zebra crossings)
      [-50, 50].forEach((cwX) => {
        for (let z = 30.8; z <= 45.2; z += 1.3) {
          const bar = new THREE.Mesh(
            new THREE.PlaneGeometry(4.5, 0.75),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
          );
          bar.rotation.x = -Math.PI / 2;
          bar.position.set(cwX, 0.038, z);
          root.add(bar);
        }
      });

      // Modern Streetlight Poles along sidewalk
      for (let sx = -110; sx <= 110; sx += 35) {
        const poleGroup = new THREE.Group();
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6, roughness: 0.4 });
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 7.0, 8), poleMat);
        pole.position.y = 3.5;
        poleGroup.add(pole);

        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 2.5), poleMat);
        arm.position.set(0, 6.9, 1.2);
        poleGroup.add(arm);

        const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.6), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
        lamp.position.set(0, 6.8, 2.2);
        poleGroup.add(lamp);

        poleGroup.position.set(sx, 0.1, 29.1);
        root.add(poleGroup);
      }

      // Side road (North-South connection, X = -90)
      const sideRoad = new THREE.Mesh(new THREE.PlaneGeometry(14, 110), roadMat);
      sideRoad.rotation.x = -Math.PI / 2;
      sideRoad.position.set(-90, 0.02, -15);
      root.add(sideRoad);

      // Populate Surface Vehicles
      const surfaceEastCars = [
        { type: 'sedan' as const, color: 0xef4444, x: -110, speed: 17.0, laneZ: 32.5 },
        { type: 'suv' as const,   color: 0x0f172a, x: -70,  speed: 15.0, laneZ: 36.0 },
        { type: 'sedan' as const, color: 0xfacc15, x: -25,  speed: 18.0, laneZ: 32.5 }, // Yellow Taxi
        { type: 'sedan' as const, color: 0x0284c7, x: 20,   speed: 16.5, laneZ: 36.0 },
        { type: 'suv' as const,   color: 0x10b981, x: 65,   speed: 15.5, laneZ: 32.5 },
        { type: 'sedan' as const, color: 0xf8fafc, x: 105,  speed: 17.5, laneZ: 36.0 },
      ];

      surfaceEastCars.forEach(({ type, color, x, speed, laneZ }) => {
        const mesh = createVehicleMesh(type, color, 1);
        mesh.position.set(x, 0.05, laneZ);
        root.add(mesh);
        movingVehiclesRef.current.push({ mesh, speed, minX: -135, maxX: 135, direction: 1 });
      });

      const surfaceWestCars = [
        { type: 'bus' as const,   color: 0x0284c7, x: -95,  speed: 13.0, laneZ: 43.5 }, // City Transit Bus
        { type: 'sedan' as const, color: 0xe2e8f0, x: -50,  speed: 16.0, laneZ: 40.0 },
        { type: 'suv' as const,   color: 0x334155, x: -5,   speed: 15.0, laneZ: 43.5 },
        { type: 'sedan' as const, color: 0xf97316, x: 40,   speed: 17.0, laneZ: 40.0 },
        { type: 'sedan' as const, color: 0x8b5cf6, x: 85,   speed: 16.2, laneZ: 43.5 },
        { type: 'suv' as const,   color: 0x047857, x: 120,  speed: 15.2, laneZ: 40.0 },
      ];

      surfaceWestCars.forEach(({ type, color, x, speed, laneZ }) => {
        const mesh = createVehicleMesh(type, color, -1);
        mesh.position.set(x, 0.05, laneZ);
        root.add(mesh);
        movingVehiclesRef.current.push({ mesh, speed, minX: -135, maxX: 135, direction: -1 });
      });
    }

    // ── Elevated Transport Corridor (3D Vertical Infrastructure Asset) ──
    if (activeLayers.transport_corridor !== false) {
      const elevGroup = new THREE.Group();
      elevGroup.name = 'elevated_transport_corridor';
      root.add(elevGroup);

      const corridorZ = 53.0; // Parallels front boulevard at Z=53
      const deckY = 8.5;     // Elevated 8.5m in the air (strata parcel)
      const corridorLength = 260;
      const corridorWidth = 12.0;

      // Heavy Structural Concrete Piers (Support Columns)
      const concretePillarMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.6,
        metalness: 0.1,
      });
      const concreteCapMat = new THREE.MeshStandardMaterial({
        color: 0x64748b,
        roughness: 0.5,
        metalness: 0.15,
      });

      for (let px = -105; px <= 105; px += 30) {
        // Foundation Footing
        const footing = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.6, 4.4), concreteCapMat);
        footing.position.set(px, 0.3, corridorZ);
        footing.castShadow = true;
        elevGroup.add(footing);

        // Column Pier
        const column = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 7.8, 12), concretePillarMat);
        column.position.set(px, 4.2, corridorZ);
        column.castShadow = true;
        elevGroup.add(column);

        // T-Head Pier Cap (Cantilever beam supporting the viaduct deck)
        const pierCap = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.2, corridorWidth + 0.8), concreteCapMat);
        pierCap.position.set(px, 7.9, corridorZ);
        pierCap.castShadow = true;
        elevGroup.add(pierCap);

        // Pier bearings
        [-3.5, 3.5].forEach((bz) => {
          const bearing = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.2, 8), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
          bearing.position.set(px, 8.55, corridorZ + bz);
          elevGroup.add(bearing);
        });
      }

      // Concrete Box Girder (Segmental Viaduct Body)
      const deckBeam = new THREE.Mesh(
        new THREE.BoxGeometry(corridorLength, 1.1, corridorWidth),
        new THREE.MeshStandardMaterial({ color: 0xd8e0ea, roughness: 0.5, metalness: 0.1 })
      );
      deckBeam.position.set(0, deckY + 0.55, corridorZ);
      deckBeam.castShadow = true;
      deckBeam.receiveShadow = true;
      elevGroup.add(deckBeam);

      // Elevated Roadway & Rail Surface Deck
      const deckSurface = new THREE.Mesh(
        new THREE.PlaneGeometry(corridorLength, corridorWidth - 0.4),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.75 })
      );
      deckSurface.rotation.x = -Math.PI / 2;
      deckSurface.position.set(0, deckY + 1.12, corridorZ);
      deckSurface.receiveShadow = true;
      elevGroup.add(deckSurface);

      // Elevated Median Barrier & Rail Track Divider
      const median = new THREE.Mesh(
        new THREE.BoxGeometry(corridorLength, 0.35, 0.6),
        new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 })
      );
      median.position.set(0, deckY + 1.3, corridorZ);
      elevGroup.add(median);

      // White Lane Markers on Elevated Deck
      [-3.0, 3.0].forEach((zOff) => {
        for (let x = -120; x <= 120; x += 10) {
          const edash = new THREE.Mesh(
            new THREE.PlaneGeometry(5, 0.3),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
          );
          edash.rotation.x = -Math.PI / 2;
          edash.position.set(x, deckY + 1.13, corridorZ + zOff);
          elevGroup.add(edash);
        }
      });

      // ── Twin Elevated Metro Rail Tracks & Overhead Electrification ──
      const trackZSouth = corridorZ - 2.8; // South Track: Eastbound (+X)
      const trackZNorth = corridorZ + 2.8; // North Track: Westbound (-X)

      // Concrete Sleepers (Railway Ties) every 2.2m for both tracks
      const sleeperMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
      for (let tx = -125; tx <= 125; tx += 2.2) {
        const s1 = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 2.3), sleeperMat);
        s1.position.set(tx, deckY + 1.14, trackZSouth);
        elevGroup.add(s1);

        const s2 = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 2.3), sleeperMat);
        s2.position.set(tx, deckY + 1.14, trackZNorth);
        elevGroup.add(s2);
      }

      // Continuous Steel Rails (2 rails per track)
      const railSteelMat = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: 0.92, roughness: 0.15 });
      [-0.75, 0.75].forEach((roff) => {
        const rSouth = new THREE.Mesh(new THREE.BoxGeometry(corridorLength, 0.14, 0.08), railSteelMat);
        rSouth.position.set(0, deckY + 1.22, trackZSouth + roff);
        elevGroup.add(rSouth);

        const rNorth = new THREE.Mesh(new THREE.BoxGeometry(corridorLength, 0.14, 0.08), railSteelMat);
        rNorth.position.set(0, deckY + 1.22, trackZNorth + roff);
        elevGroup.add(rNorth);
      });

      // Concrete Safety Parapet Barriers with Handrails
      [-corridorWidth / 2 + 0.25, corridorWidth / 2 - 0.25].forEach((bz) => {
        const barrier = new THREE.Mesh(
          new THREE.BoxGeometry(corridorLength, 0.9, 0.45),
          new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.6 })
        );
        barrier.position.set(0, deckY + 1.55, corridorZ + bz);
        barrier.castShadow = true;
        elevGroup.add(barrier);

        const railBar = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06, 0.06, corridorLength, 6),
          new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.8, roughness: 0.2 })
        );
        railBar.rotation.z = Math.PI / 2;
        railBar.position.set(0, deckY + 2.05, corridorZ + bz);
        elevGroup.add(railBar);
      });

      // Overhead Catenary Gantries & Electrification Mast Arches every 25m
      for (let gx = -105; gx <= 105; gx += 25) {
        const gantryMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 });
        const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.4, 8), gantryMat);
        p1.position.set(gx, deckY + 2.8, corridorZ - corridorWidth / 2 + 0.4);
        const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.4, 8), gantryMat);
        p2.position.set(gx, deckY + 2.8, corridorZ + corridorWidth / 2 - 0.4);
        const beam = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, corridorWidth - 0.6), gantryMat);
        beam.position.set(gx, deckY + 4.5, corridorZ);

        // Contact Wire Droppers & Insulators
        [-2.8, 2.8].forEach((cwz) => {
          const drop = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6, 6), new THREE.MeshBasicMaterial({ color: 0xe2e8f0 }));
          drop.position.set(gx, deckY + 4.1, corridorZ + cwz);
          elevGroup.add(drop);
        });

        const light1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.4), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
        light1.position.set(gx, deckY + 4.4, corridorZ - 2.8);
        const light2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.4), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
        light2.position.set(gx, deckY + 4.4, corridorZ + 2.8);

        elevGroup.add(p1, p2, beam, light1, light2);
      }

      // Overhead Contact Wire Cable running the entire corridor length
      [-2.8, 2.8].forEach((cwz) => {
        const wire = new THREE.Mesh(
          new THREE.CylinderGeometry(0.02, 0.02, corridorLength, 6),
          new THREE.MeshBasicMaterial({ color: 0x94a3b8 })
        );
        wire.rotation.z = Math.PI / 2;
        wire.position.set(0, deckY + 3.8, corridorZ + cwz);
        elevGroup.add(wire);
      });

      // 3D Air-Rights Strata Parcel Volume (Cadastral Boundary for Vertical Transport)
      const strataGeo = new THREE.BoxGeometry(corridorLength, 5.0, corridorWidth);
      const strataWire = new THREE.LineSegments(
        new THREE.EdgesGeometry(strataGeo),
        new THREE.LineBasicMaterial({ color: 0x6366f1, transparent: true, opacity: 0.35 })
      );
      strataWire.position.set(0, deckY + 3.0, corridorZ);
      elevGroup.add(strataWire);

      // ── Dynamic Moving Trains on Elevated Corridor ──
      // Train 1: Eastbound High-Speed Metro Express (3-Car Unit, Emerald & Silver Livery, +X)
      const metroEast = createMetroTrainMesh(1, 0x059669, 3);
      metroEast.position.set(-60, deckY + 1.18, trackZSouth);
      elevGroup.add(metroEast);
      movingVehiclesRef.current.push({
        mesh: metroEast,
        speed: 23.0,
        minX: -170,
        maxX: 170,
        direction: 1,
      });

      // Train 2: Westbound Rapid Transit Metro (3-Car Unit, Royal Cyan & White Livery, -X)
      const metroWest = createMetroTrainMesh(-1, 0x0284c7, 3);
      metroWest.position.set(40, deckY + 1.18, trackZNorth);
      elevGroup.add(metroWest);
      movingVehiclesRef.current.push({
        mesh: metroWest,
        speed: 25.5,
        minX: -170,
        maxX: 170,
        direction: -1,
      });

      // Train 3: Staggered Eastbound Intercity Metro Shuttle (2-Car Unit, Saffron / Orange Livery, +X)
      const metroEast2 = createMetroTrainMesh(1, 0xf97316, 2);
      metroEast2.position.set(70, deckY + 1.18, trackZSouth);
      elevGroup.add(metroEast2);
      movingVehiclesRef.current.push({
        mesh: metroEast2,
        speed: 21.0,
        minX: -170,
        maxX: 170,
        direction: 1,
      });
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
      <div className="map-controls-corner map-controls-3d">
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
          { color: '#6366f1', label: 'Elevated 3D Corridor' },
          { color: '#f59e0b', label: 'Moving Traffic & Metro' },
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
