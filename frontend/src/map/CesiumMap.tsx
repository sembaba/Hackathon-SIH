import React, { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import { PropertyUnit, Floor, InfrastructureAsset, Parcel, Building } from '../types';

interface CesiumMapProps {
  parcels: Parcel[];
  building: Building | null;
  floors: Floor[];
  properties: PropertyUnit[];
  infrastructure: InfrastructureAsset[];
  selectedFloor: Floor | null;
  selectedProperty: PropertyUnit | null;
  onSelectProperty: (property: PropertyUnit | null) => void;
  showUnderground: boolean;
  activeLayers: Record<string, boolean>;
  cameraTarget?: { lon: number; lat: number; height: number } | null;
}

export const CesiumMap: React.FC<CesiumMapProps> = ({
  parcels,
  building,
  floors,
  properties,
  infrastructure,
  selectedFloor,
  selectedProperty,
  onSelectProperty,
  showUnderground,
  activeLayers,
  cameraTarget
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const [ionNotice, setIonNotice] = useState<string | null>(null);

  // Initialize Cesium Viewer
  useEffect(() => {
    if (!containerRef.current) return;

    // Check Cesium Ion Token
    const ionToken = import.meta.env.VITE_CESIUM_ION_TOKEN;
    if (ionToken && ionToken !== 'YOUR_CESIUM_ION_TOKEN_HERE') {
      Cesium.Ion.defaultAccessToken = ionToken;
    } else {
      setIonNotice(
        'Cesium terrain/global photogrammetry requires a Cesium ion token. Local 3D volumetric property cadastre remains fully operational.'
      );
    }

    // Create Viewer
    const viewer = new Cesium.Viewer(containerRef.current, {
      animation: false,
      baseLayerPicker: false,
      fullscreenButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      sceneModePicker: false,
      selectionIndicator: false,
      timeline: false,
      navigationHelpButton: false,
      shadows: true,
      shouldAnimate: true,
    });

    viewerRef.current = viewer;

    // Configure Scene & Lighting
    const scene = viewer.scene;
    scene.globe.depthTestAgainstTerrain = true;
    scene.globe.enableLighting = true;

    // Enable subsurface transparency when viewing underground
    scene.globe.translucency.enabled = true;
    scene.globe.translucency.frontFaceAlphaByDistance = new Cesium.NearFarScalar(400.0, 0.4, 8000.0, 1.0);

    // Initial Camera Positioning over Haridwar Demo Parcel
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(78.1642, 29.9450, 420.0),
      orientation: {
        heading: Cesium.Math.toRadians(0.0),
        pitch: Cesium.Math.toRadians(-45.0),
        roll: 0.0,
      },
      duration: 1.5,
    });

    // Handle Click Selection
    const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
    handler.setInputAction((movement: any) => {
      const pickedObject = scene.pick(movement.position);
      if (Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.propertyUnit) {
        onSelectProperty(pickedObject.id.propertyUnit);
      } else {
        // Did not pick a property
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    return () => {
      handler.destroy();
      if (viewer && !viewer.isDestroyed()) {
        viewer.destroy();
      }
      viewerRef.current = null;
    };
  }, []);

  // Sync Camera Target
  useEffect(() => {
    if (!viewerRef.current || !cameraTarget) return;
    viewerRef.current.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(cameraTarget.lon, cameraTarget.lat, cameraTarget.height),
      orientation: {
        heading: Cesium.Math.toRadians(0.0),
        pitch: Cesium.Math.toRadians(-40.0),
        roll: 0.0,
      },
      duration: 1.8,
    });
  }, [cameraTarget]);

  // Sync Entities (Parcels, Building, 3D Property Volumes, Utilities)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    viewer.entities.removeAll();

    const baseElevation = building?.ground_elevation || 280.0;

    // 1. Cadastral Parcel Boundaries
    if (activeLayers.parcels !== false) {
      parcels.forEach((p) => {
        if (p.geometry && p.geometry.coordinates) {
          const coords = p.geometry.coordinates[0];
          const flatCoords = coords.flatMap(([lon, lat]: [number, number]) => [lon, lat]);
          viewer.entities.add({
            name: `Parcel ${p.parcel_number}`,
            polygon: {
              hierarchy: Cesium.Cartesian3.fromDegreesArray(flatCoords),
              material: Cesium.Color.fromCssColorString('#0284c7').withAlpha(0.12),
              outline: true,
              outlineColor: Cesium.Color.fromCssColorString('#38bdf8'),
              outlineWidth: 3,
              height: baseElevation - 0.5,
            },
          });
        }
      });
    }

    // 2. 3D Volumetric Property Units
    if (activeLayers.properties_3d !== false) {
      properties.forEach((prop) => {
        // Underground filtering: if property is in basement and underground toggle is off, skip
        const isBasement = prop.floor_number < 0;
        if (isBasement && !showUnderground) return;

        // Floor isolation filtering
        const isSelectedFloor = selectedFloor ? prop.floor === selectedFloor.id : true;
        const isSelectedUnit = selectedProperty && selectedProperty.id === prop.id;
        const isConflict = prop.status === 'CONFLICT_FLAGGED';

        let alpha = isSelectedFloor ? 0.75 : 0.15;
        if (!selectedFloor && !isSelectedUnit) alpha = 0.65;

        // Color coding: Red for conflict, Gold for selected, Blue for standard, Amber for ground
        let unitColor = Cesium.Color.fromCssColorString('#0ea5e9');
        if (isConflict) {
          unitColor = Cesium.Color.fromCssColorString('#f43f5e'); // Vibrant Rose Red for Conflict
          alpha = 0.9;
        } else if (prop.property_type.includes('Parking')) {
          unitColor = Cesium.Color.fromCssColorString('#64748b');
        } else if (prop.property_type.includes('Utility')) {
          unitColor = Cesium.Color.fromCssColorString('#d97706');
        } else if (prop.floor_number === 0) {
          unitColor = Cesium.Color.fromCssColorString('#10b981');
        }

        if (isSelectedUnit) {
          unitColor = Cesium.Color.fromCssColorString('#fbbf24'); // Glowing Amber
          alpha = 0.95;
        }

        if (prop.geometry && prop.geometry.coordinates) {
          const coords = prop.geometry.coordinates[0];
          const flatCoords = coords.flatMap(([lon, lat]: [number, number]) => [lon, lat]);

          const entity = viewer.entities.add({
            name: `Unit ${prop.unit_number}`,
            polygon: {
              hierarchy: Cesium.Cartesian3.fromDegreesArray(flatCoords),
              height: baseElevation + prop.z_min,
              extrudedHeight: baseElevation + prop.z_max,
              material: unitColor.withAlpha(alpha),
              outline: true,
              outlineColor: isConflict
                ? Cesium.Color.WHITE
                : (isSelectedUnit ? Cesium.Color.YELLOW : Cesium.Color.fromCssColorString('#38bdf8').withAlpha(0.8)),
              outlineWidth: isSelectedUnit || isConflict ? 3 : 1,
            },
          });

          // Attach property reference for click inspection
          (entity as any).propertyUnit = prop;
        }
      });
    }

    // 3. Underground Infrastructure (Water, Sewer, Power, Metro)
    if (showUnderground && activeLayers.underground_infra !== false) {
      infrastructure.forEach((infra) => {
        if (infra.geometry && infra.geometry.coordinates) {
          const coords = infra.geometry.coordinates;
          const flatCoords = coords.flatMap(([lon, lat]: [number, number]) => [
            lon,
            lat,
            baseElevation + (infra.depth_min + infra.depth_max) / 2,
          ]);

          let infraColor = Cesium.Color.fromCssColorString('#06b6d4'); // Water
          if (infra.asset_type === 'SEWERAGE') infraColor = Cesium.Color.fromCssColorString('#10b981');
          if (infra.asset_type === 'ELECTRICITY') infraColor = Cesium.Color.fromCssColorString('#f59e0b');
          if (infra.asset_type === 'METRO_TUNNEL') infraColor = Cesium.Color.fromCssColorString('#a855f7');

          viewer.entities.add({
            name: infra.name,
            polyline: {
              positions: Cesium.Cartesian3.fromDegreesArrayHeights(flatCoords),
              width: Math.max(4, infra.diameter_m * 4),
              material: new Cesium.PolylineGlowMaterialProperty({
                glowPower: 0.25,
                color: infraColor,
              }),
            },
          });
        }
      });
    }
  }, [parcels, building, properties, infrastructure, selectedFloor, selectedProperty, showUnderground, activeLayers]);

  return (
    <div className="cesium-viewer-wrapper">
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {ionNotice && (
        <div
          style={{
            position: 'absolute',
            bottom: '1rem',
            right: '1rem',
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            color: '#fef3c7',
            padding: '0.5rem 0.85rem',
            borderRadius: '6px',
            fontSize: '0.75rem',
            maxWidth: '380px',
            zIndex: 30,
            backdropFilter: 'blur(8px)',
          }}
        >
          {ionNotice}
        </div>
      )}
    </div>
  );
};
