import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Parcel, Building, PropertyUnit, InfrastructureAsset } from '../types';

interface LeafletMapProps {
  parcels: Parcel[];
  building: Building | null;
  properties: PropertyUnit[];
  infrastructure: InfrastructureAsset[];
  selectedProperty: PropertyUnit | null;
  onSelectProperty: (property: PropertyUnit | null) => void;
  activeLayers: Record<string, boolean>;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  parcels,
  building,
  properties,
  infrastructure,
  selectedProperty,
  onSelectProperty,
  activeLayers
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Leaflet Map centered on Haridwar
    const map = L.map(mapContainerRef.current, {
      center: [29.9457, 78.1642],
      zoom: 17,
      zoomControl: true,
    });

    // CartoDB Dark Matter / OpenStreetMap Basemap
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 20,
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layersGroupRef.current = layerGroup;
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update GIS Layers on the 2D Map
  useEffect(() => {
    const map = mapRef.current;
    const group = layersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    // 1. Parcels
    if (activeLayers.parcels !== false) {
      parcels.forEach((p) => {
        if (p.geometry && p.geometry.coordinates) {
          const latLngs = p.geometry.coordinates[0].map(([lon, lat]: [number, number]) => [lat, lon]);
          const poly = L.polygon(latLngs, {
            color: '#0284c7',
            weight: 3,
            fillColor: '#38bdf8',
            fillOpacity: 0.15,
            dashArray: '4 4'
          }).bindPopup(`
            <div style="font-family: sans-serif; font-size: 12px;">
              <strong style="color:#0284c7;">Cadastral Parcel: ${p.parcel_number}</strong><br/>
              <span>Village: ${p.village}, Tehsil: ${p.tehsil}</span><br/>
              <span>District: ${p.district} (${p.state_code})</span><br/>
              <span>Area: ${p.area} m²</span>
            </div>
          `);
          group.addLayer(poly);
        }
      });
    }

    // 2. Building Footprint
    if (building && activeLayers.buildings !== false && building.geometry_2d) {
      const latLngs = building.geometry_2d.coordinates[0].map(([lon, lat]: [number, number]) => [lat, lon]);
      const poly = L.polygon(latLngs, {
        color: '#f59e0b',
        weight: 2.5,
        fillColor: '#fbbf24',
        fillOpacity: 0.25,
      }).bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px;">
          <strong style="color:#d97706;">${building.name} (${building.building_code})</strong><br/>
          <span>Type: ${building.building_type}</span><br/>
          <span>Height: ${building.height} m (${building.number_of_floors} Floors + ${building.number_of_basements} Basements)</span>
        </div>
      `);
      group.addLayer(poly);
    }

    // 3. Property Units (2D Footprints)
    if (activeLayers.properties !== false) {
      properties.forEach((prop) => {
        if (prop.geometry && prop.geometry.coordinates) {
          const latLngs = prop.geometry.coordinates[0].map(([lon, lat]: [number, number]) => [lat, lon]);
          const isConflict = prop.status === 'CONFLICT_FLAGGED';
          const isSelected = selectedProperty && selectedProperty.id === prop.id;

          const poly = L.polygon(latLngs, {
            color: isConflict ? '#f43f5e' : (isSelected ? '#fbbf24' : '#0ea5e9'),
            weight: isSelected || isConflict ? 3 : 1.5,
            fillColor: isConflict ? '#f43f5e' : '#0284c7',
            fillOpacity: isSelected ? 0.6 : (isConflict ? 0.45 : 0.2),
          });

          poly.on('click', () => onSelectProperty(prop));
          poly.bindTooltip(`Unit ${prop.unit_number} (${prop.floor_label}) - ${prop.owner_name}`);
          group.addLayer(poly);
        }
      });
    }

    // 4. Infrastructure Lines
    if (activeLayers.underground_infra !== false) {
      infrastructure.forEach((infra) => {
        if (infra.geometry && infra.geometry.coordinates) {
          const latLngs = infra.geometry.coordinates.map(([lon, lat]: [number, number]) => [lat, lon]);
          let lineColor = '#06b6d4';
          if (infra.asset_type === 'SEWERAGE') lineColor = '#10b981';
          if (infra.asset_type === 'ELECTRICITY') lineColor = '#f59e0b';
          if (infra.asset_type === 'METRO_TUNNEL') lineColor = '#a855f7';

          const line = L.polyline(latLngs, {
            color: lineColor,
            weight: 3,
            dashArray: '6 4',
          }).bindPopup(`
            <div style="font-family: sans-serif; font-size: 12px;">
              <strong>${infra.name}</strong><br/>
              <span>Type: ${infra.asset_type}</span><br/>
              <span>Depth Range: ${infra.depth_min}m to ${infra.depth_max}m</span>
            </div>
          `);
          group.addLayer(line);
        }
      });
    }
  }, [parcels, building, properties, infrastructure, selectedProperty, activeLayers]);

  return (
    <div className="leaflet-viewer-wrapper">
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};
