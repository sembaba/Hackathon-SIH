import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Maximize2,
  RotateCcw,
  Layers,
  Sparkles,
  Plane,
  Satellite,
  Compass,
  Eye,
  EyeOff
} from 'lucide-react';

interface Pipeline3DCanvasProps {
  numFloors: number;
  totalHeightM: number;
  floorHeightM: number;
  groundZ: number;
  roofZ: number;
  volumeM3: number;
  footprintAreaSqm: number;
  selectedFloor: number | null;
  onSelectFloor: (floor: number | null) => void;
  ulpin: string;
}

export const Pipeline3DCanvas: React.FC<Pipeline3DCanvasProps> = ({
  numFloors,
  totalHeightM,
  floorHeightM,
  groundZ,
  roofZ,
  volumeM3,
  footprintAreaSqm,
  selectedFloor,
  onSelectFloor,
  ulpin,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animFrameRef = useRef<number>(0);

  // Toggles
  const [showLiDARCloud, setShowLiDARCloud] = useState<boolean>(true);
  const [showDronePath, setShowDronePath] = useState<boolean>(true);
  const [showGNSSMarkers, setShowGNSSMarkers] = useState<boolean>(true);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);

  // References to groups for toggling
  const lidarPointsRef = useRef<THREE.Points | null>(null);
  const droneFlightGroupRef = useRef<THREE.Group | null>(null);
  const gnssMarkersGroupRef = useRef<THREE.Group | null>(null);
  const buildingFloorsRef = useRef<THREE.Mesh[]>([]);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1128); // Deep Gov-Tech Navy
    scene.fog = new THREE.FogExp2(0x0a1128, 0.008);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 1000);
    camera.position.set(38, 28, 42);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.01;
    controls.minDistance = 10;
    controls.maxDistance = 250;
    controls.target.set(0, (totalHeightM || 18) / 2, 0);
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff8e7, 1.4);
    sunLight.position.set(40, 60, 30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);

    const blueRimLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
    blueRimLight.position.set(-30, 20, -30);
    scene.add(blueRimLight);

    // 6. Ground Plane / Cadastral Base
    const groundGeo = new THREE.PlaneGeometry(120, 120, 32, 32);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.85,
      metalness: 0.1,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // Cadastral Grid lines
    const gridHelper = new THREE.GridHelper(100, 50, 0x0284c7, 0x1e293b);
    gridHelper.position.y = 0.02;
    scene.add(gridHelper);

    // 7. Cadastral 2D Boundary Ring (Green outline)
    const parcelWidth = Math.sqrt(footprintAreaSqm || 2500) * 0.4;
    const parcelLength = parcelWidth * 1.1;

    const parcelPoints = [
      new THREE.Vector3(-parcelWidth, 0.05, -parcelLength),
      new THREE.Vector3(parcelWidth, 0.05, -parcelLength),
      new THREE.Vector3(parcelWidth, 0.05, parcelLength),
      new THREE.Vector3(-parcelWidth, 0.05, parcelLength),
      new THREE.Vector3(-parcelWidth, 0.05, -parcelLength),
    ];
    const parcelLineGeo = new THREE.BufferGeometry().setFromPoints(parcelPoints);
    const parcelLineMat = new THREE.LineBasicMaterial({ color: 0x10b981, linewidth: 2 });
    const parcelLine = new THREE.Line(parcelLineGeo, parcelLineMat);
    scene.add(parcelLine);

    // 8. Volumetric Building Construction
    const bldWidth = parcelWidth * 0.75;
    const bldLength = parcelLength * 0.75;
    const floorsCount = Math.max(1, numFloors || 6);
    const fHeight = totalHeightM ? totalHeightM / floorsCount : 3.0;

    buildingFloorsRef.current = [];
    const buildingGroup = new THREE.Group();

    for (let f = 0; f < floorsCount; f++) {
      const isSelected = selectedFloor === f + 1;
      const floorBoxGeo = new THREE.BoxGeometry(bldWidth, fHeight * 0.92, bldLength);
      const floorMat = new THREE.MeshStandardMaterial({
        color: isSelected ? 0x0284c7 : (f === floorsCount - 1 ? 0x0ea5e9 : 0x1e293b),
        roughness: 0.2,
        metalness: 0.4,
        transparent: true,
        opacity: isSelected ? 0.95 : 0.78,
        emissive: isSelected ? 0x0284c7 : 0x000000,
        emissiveIntensity: isSelected ? 0.4 : 0,
      });

      const floorMesh = new THREE.Mesh(floorBoxGeo, floorMat);
      floorMesh.position.set(0, f * fHeight + (fHeight * 0.92) / 2 + 0.1, 0);
      floorMesh.castShadow = true;
      floorMesh.receiveShadow = true;
      floorMesh.userData = { floorNumber: f + 1 };

      // Edges wireframe
      const edges = new THREE.EdgesGeometry(floorBoxGeo);
      const edgeLine = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({
          color: isSelected ? 0x38bdf8 : 0x475569,
          linewidth: isSelected ? 2 : 1,
        })
      );
      floorMesh.add(edgeLine);

      buildingGroup.add(floorMesh);
      buildingFloorsRef.current.push(floorMesh);
    }
    scene.add(buildingGroup);

    // 9. LiDAR Simulated Point Cloud
    const particleCount = 4500;
    const pointPositions = new Float32Array(particleCount * 3);
    const pointColors = new Float32Array(particleCount * 3);
    const colorGround = new THREE.Color(0x10b981);
    const colorRoof = new THREE.Color(0x38bdf8);
    const colorBuilding = new THREE.Color(0x8b5cf6);

    for (let i = 0; i < particleCount; i++) {
      const isRoof = Math.random() > 0.45;
      let px: number, py: number, pz: number;
      let col: THREE.Color;

      if (isRoof) {
        // Roof point
        px = (Math.random() - 0.5) * bldWidth * 1.1;
        pz = (Math.random() - 0.5) * bldLength * 1.1;
        py = totalHeightM + (Math.random() - 0.5) * 0.6;
        col = colorRoof;
      } else if (Math.random() > 0.5) {
        // Facade point
        const side = Math.floor(Math.random() * 4);
        py = Math.random() * totalHeightM;
        if (side === 0) {
          px = -bldWidth / 2 + (Math.random() - 0.5) * 0.3;
          pz = (Math.random() - 0.5) * bldLength;
        } else if (side === 1) {
          px = bldWidth / 2 + (Math.random() - 0.5) * 0.3;
          pz = (Math.random() - 0.5) * bldLength;
        } else if (side === 2) {
          px = (Math.random() - 0.5) * bldWidth;
          pz = -bldLength / 2 + (Math.random() - 0.5) * 0.3;
        } else {
          px = (Math.random() - 0.5) * bldWidth;
          pz = bldLength / 2 + (Math.random() - 0.5) * 0.3;
        }
        col = colorBuilding;
      } else {
        // Ground surrounding point
        px = (Math.random() - 0.5) * (parcelWidth * 2.2);
        pz = (Math.random() - 0.5) * (parcelLength * 2.2);
        py = Math.random() * 0.4;
        col = colorGround;
      }

      pointPositions[i * 3] = px;
      pointPositions[i * 3 + 1] = py;
      pointPositions[i * 3 + 2] = pz;

      pointColors[i * 3] = col.r;
      pointColors[i * 3 + 1] = col.g;
      pointColors[i * 3 + 2] = col.b;
    }

    const pointGeo = new THREE.BufferGeometry();
    pointGeo.setAttribute('position', new THREE.BufferAttribute(pointPositions, 3));
    pointGeo.setAttribute('color', new THREE.BufferAttribute(pointColors, 3));

    const pointMat = new THREE.PointsMaterial({
      size: 0.35,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    const lidarPoints = new THREE.Points(pointGeo, pointMat);
    scene.add(lidarPoints);
    lidarPointsRef.current = lidarPoints;

    // 10. GNSS Control Point Pins
    const gnssGroup = new THREE.Group();
    const pinOffsets = [
      [-parcelWidth, -parcelLength],
      [parcelWidth, -parcelLength],
      [parcelWidth, parcelLength],
      [-parcelWidth, parcelLength],
    ];

    pinOffsets.forEach(([px, pz], idx) => {
      const pinMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.5 });
      const pinCylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 2.5, 8), pinMat);
      pinCylinder.position.set(px, 1.25, pz);
      gnssGroup.add(pinCylinder);

      const pinHead = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 12), pinMat);
      pinHead.position.set(px, 2.6, pz);
      gnssGroup.add(pinHead);
    });
    scene.add(gnssGroup);
    gnssMarkersGroupRef.current = gnssGroup;

    // 11. Drone Flight Path (Helical / lawnmower trajectory above)
    const droneGroup = new THREE.Group();
    const flightAltitude = totalHeightM + 12;
    const droneCurvePoints = [
      new THREE.Vector3(-parcelWidth * 1.5, flightAltitude, -parcelLength * 1.5),
      new THREE.Vector3(parcelWidth * 1.5, flightAltitude, -parcelLength * 1.5),
      new THREE.Vector3(parcelWidth * 1.5, flightAltitude, 0),
      new THREE.Vector3(-parcelWidth * 1.5, flightAltitude, 0),
      new THREE.Vector3(-parcelWidth * 1.5, flightAltitude, parcelLength * 1.5),
      new THREE.Vector3(parcelWidth * 1.5, flightAltitude, parcelLength * 1.5),
    ];
    const droneLineGeo = new THREE.BufferGeometry().setFromPoints(droneCurvePoints);
    const droneLineMat = new THREE.LineDashedMaterial({
      color: 0xec4899,
      linewidth: 2,
      dashSize: 1.5,
      gapSize: 0.8,
    });
    const droneLine = new THREE.Line(droneLineGeo, droneLineMat);
    droneLine.computeLineDistances();
    droneGroup.add(droneLine);

    // Drone miniature marker
    const droneIconGeo = new THREE.OctahedronGeometry(1.2);
    const droneIconMat = new THREE.MeshStandardMaterial({ color: 0xec4899, emissive: 0xec4899, emissiveIntensity: 0.6 });
    const droneIcon = new THREE.Mesh(droneIconGeo, droneIconMat);
    droneIcon.position.set(0, flightAltitude, 0);
    droneGroup.add(droneIcon);

    scene.add(droneGroup);
    droneFlightGroupRef.current = droneGroup;

    // 12. Animation Loop
    let angle = 0;
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);

      if (autoRotate) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 2.0;
      } else {
        controls.autoRotate = false;
      }
      controls.update();

      // Drone animation hovering
      angle += 0.02;
      if (droneIcon) {
        droneIcon.position.x = Math.sin(angle) * (parcelWidth * 1.2);
        droneIcon.position.z = Math.cos(angle * 0.8) * (parcelLength * 1.2);
        droneIcon.rotation.y += 0.04;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize listener
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [numFloors, totalHeightM, footprintAreaSqm]);

  // Update selected floor highlight
  useEffect(() => {
    buildingFloorsRef.current.forEach((mesh, idx) => {
      const isSelected = selectedFloor === idx + 1;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.color.setHex(isSelected ? 0x0284c7 : (idx === buildingFloorsRef.current.length - 1 ? 0x0ea5e9 : 0x1e293b));
        mat.emissive.setHex(isSelected ? 0x0284c7 : 0x000000);
        mat.emissiveIntensity = isSelected ? 0.5 : 0;
        mat.opacity = isSelected ? 0.98 : 0.78;
      }
    });
  }, [selectedFloor]);

  // Toggle visibility handlers
  useEffect(() => {
    if (lidarPointsRef.current) lidarPointsRef.current.visible = showLiDARCloud;
  }, [showLiDARCloud]);

  useEffect(() => {
    if (droneFlightGroupRef.current) droneFlightGroupRef.current.visible = showDronePath;
  }, [showDronePath]);

  useEffect(() => {
    if (gnssMarkersGroupRef.current) gnssMarkersGroupRef.current.visible = showGNSSMarkers;
  }, [showGNSSMarkers]);

  const handleResetCamera = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(38, 28, 42);
    controlsRef.current.target.set(0, (totalHeightM || 18) / 2, 0);
    controlsRef.current.update();
  };

  const handleTopView = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(0, 75, 0.1);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '440px', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#0a1128' }}>
      {/* Three.js Canvas Container */}
      <div ref={mountRef} style={{ width: '100%', height: '100%', minHeight: '440px' }} />

      {/* Top Floating HUD Badges */}
      <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', flexDirection: 'column', gap: '6px', pointerEvents: 'none' }}>
        <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', border: '1px solid rgba(56, 189, 248, 0.4)', borderRadius: '6px', padding: '5px 10px', color: '#fff', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
          <span>PostGIS PolyhedralSurface Z &bull; SRID: 4979</span>
        </div>
        <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', border: '1px solid rgba(51, 65, 85, 0.7)', borderRadius: '6px', padding: '5px 10px', color: '#cbd5e1', fontSize: '0.72rem' }}>
          Roof: <strong style={{ color: '#38bdf8' }}>{roofZ || 109.6}m</strong> MSL &bull; Base: <strong style={{ color: '#10b981' }}>{groundZ || 91.2}m</strong> (EGM2008)
        </div>
      </div>

      {/* Top-Right Layer Toggle Toggles */}
      <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '6px', zIndex: 10 }}>
        <button
          onClick={() => setShowLiDARCloud(!showLiDARCloud)}
          title="Toggle LiDAR Point Cloud"
          style={{
            backgroundColor: showLiDARCloud ? '#8b5cf6' : 'rgba(15, 23, 42, 0.85)',
            color: '#fff',
            border: '1px solid rgba(139, 92, 246, 0.5)',
            borderRadius: '6px',
            padding: '5px 8px',
            fontSize: '0.72rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <Sparkles size={13} />
          <span>LiDAR Cloud</span>
        </button>

        <button
          onClick={() => setShowDronePath(!showDronePath)}
          title="Toggle Drone Photogrammetry Flight"
          style={{
            backgroundColor: showDronePath ? '#ec4899' : 'rgba(15, 23, 42, 0.85)',
            color: '#fff',
            border: '1px solid rgba(236, 72, 153, 0.5)',
            borderRadius: '6px',
            padding: '5px 8px',
            fontSize: '0.72rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <Plane size={13} />
          <span>Drone SfM</span>
        </button>

        <button
          onClick={() => setShowGNSSMarkers(!showGNSSMarkers)}
          title="Toggle GNSS / CORS Survey Control Points"
          style={{
            backgroundColor: showGNSSMarkers ? '#f59e0b' : 'rgba(15, 23, 42, 0.85)',
            color: '#fff',
            border: '1px solid rgba(245, 158, 11, 0.5)',
            borderRadius: '6px',
            padding: '5px 8px',
            fontSize: '0.72rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <Satellite size={13} />
          <span>GNSS RTK</span>
        </button>
      </div>

      {/* Bottom Camera / Controls Toolbar */}
      <div style={{ position: 'absolute', bottom: '12px', right: '12px', display: 'flex', gap: '6px', zIndex: 10 }}>
        <button
          onClick={handleResetCamera}
          title="Reset Isometric 3D View"
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            color: '#38bdf8',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '6px',
            padding: '6px 10px',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <RotateCcw size={13} />
          <span>Reset 3D</span>
        </button>

        <button
          onClick={handleTopView}
          title="Switch to Top-Down 2D Cadastral View"
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            color: '#cbd5e1',
            border: '1px solid rgba(51, 65, 85, 0.8)',
            borderRadius: '6px',
            padding: '6px 10px',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <Compass size={13} />
          <span>Top View</span>
        </button>

        <button
          onClick={() => setAutoRotate(!autoRotate)}
          title="Auto-Rotate 3D Inspection"
          style={{
            backgroundColor: autoRotate ? '#0284c7' : 'rgba(15, 23, 42, 0.85)',
            color: '#fff',
            border: '1px solid rgba(2, 132, 199, 0.6)',
            borderRadius: '6px',
            padding: '6px 10px',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {autoRotate ? 'Pause 360°' : '360° Orbit'}
        </button>
      </div>

      {/* Bottom-Left Floor Selector Pill */}
      <div style={{ position: 'absolute', bottom: '12px', left: '12px', display: 'flex', alignItems: 'center', gap: '4px', zIndex: 10, flexWrap: 'wrap', maxWidth: '70%' }}>
        <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginRight: '4px', fontWeight: 600 }}>Level:</span>
        <button
          onClick={() => onSelectFloor(null)}
          style={{
            backgroundColor: selectedFloor === null ? '#0284c7' : 'rgba(15, 23, 42, 0.85)',
            color: '#fff',
            border: '1px solid rgba(51, 65, 85, 0.8)',
            borderRadius: '4px',
            padding: '3px 8px',
            fontSize: '0.7rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          All
        </button>
        {Array.from({ length: numFloors || 6 }).map((_, idx) => {
          const f = idx + 1;
          const isSelected = selectedFloor === f;
          return (
            <button
              key={f}
              onClick={() => onSelectFloor(isSelected ? null : f)}
              style={{
                backgroundColor: isSelected ? '#38bdf8' : 'rgba(15, 23, 42, 0.85)',
                color: isSelected ? '#0f172a' : '#cbd5e1',
                border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(51, 65, 85, 0.8)',
                borderRadius: '4px',
                padding: '3px 8px',
                fontSize: '0.7rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              F{f}
            </button>
          );
        })}
      </div>
    </div>
  );
};
