import React, { useRef, useEffect, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import { Layers, Crosshair } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { Button } from '@/components/ui/button';

// Israel bounds
const ISRAEL_BOUNDS: [[number, number], [number, number]] = [
  [34.2, 29.5], // Southwest
  [35.9, 33.3], // Northeast
];

// Israel center
const ISRAEL_CENTER: [number, number] = [35.0, 31.5];

export function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const userMarker = useRef<maplibregl.Marker | null>(null);
  const controllerMarker = useRef<maplibregl.Marker | null>(null);
  const droneMarker = useRef<maplibregl.Marker | null>(null);
  const radiusCircle = useRef<string | null>(null);
  const resultOverlay = useRef<string | null>(null);

  const { state, dispatch } = useApp();
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'carto-dark': {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
              'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
              'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
            ],
            tileSize: 256,
            attribution: '© CARTO',
          },
        },
        layers: [
          {
            id: 'carto-dark-layer',
            type: 'raster',
            source: 'carto-dark',
            minzoom: 0,
            maxzoom: 20,
          },
        ],
        glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
      },
      center: ISRAEL_CENTER,
      zoom: 7,
      maxBounds: ISRAEL_BOUNDS,
      attributionControl: false,
    });

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    // Handle map click for placement mode
    map.current.on('click', (e) => {
      const coords = { lat: e.lngLat.lat, lng: e.lngLat.lng };
      
      // Dispatch based on current placement mode
      if (state.placementMode === 'controller') {
        dispatch({ type: 'SET_CONTROLLER_LOCATION', payload: coords });
      } else if (state.placementMode === 'drone') {
        dispatch({ type: 'SET_DRONE_LOCATION', payload: coords });
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update placement mode click handler
  useEffect(() => {
    if (!map.current) return;

    const handleClick = (e: maplibregl.MapMouseEvent) => {
      const coords = { lat: e.lngLat.lat, lng: e.lngLat.lng };
      
      if (state.placementMode === 'controller') {
        dispatch({ type: 'SET_CONTROLLER_LOCATION', payload: coords });
      } else if (state.placementMode === 'drone') {
        dispatch({ type: 'SET_DRONE_LOCATION', payload: coords });
      }
    };

    map.current.on('click', handleClick);
    
    return () => {
      map.current?.off('click', handleClick);
    };
  }, [state.placementMode, dispatch]);

  // Update cursor based on placement mode
  useEffect(() => {
    if (!map.current) return;
    
    if (state.placementMode !== 'none') {
      map.current.getCanvas().style.cursor = 'crosshair';
    } else {
      map.current.getCanvas().style.cursor = '';
    }
  }, [state.placementMode]);

  // Update user location marker
  useEffect(() => {
    if (!map.current || !mapLoaded || !state.userLocation) return;

    if (userMarker.current) {
      userMarker.current.setLngLat([state.userLocation.lng, state.userLocation.lat]);
    } else {
      // Create user location marker
      const el = document.createElement('div');
      el.className = 'user-location-marker';
      el.innerHTML = `
        <div class="relative">
          <div class="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-30"></div>
          <div class="relative h-4 w-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>
        </div>
      `;

      userMarker.current = new maplibregl.Marker({ element: el })
        .setLngLat([state.userLocation.lng, state.userLocation.lat])
        .addTo(map.current);

      // Center map on user location
      map.current.flyTo({
        center: [state.userLocation.lng, state.userLocation.lat],
        zoom: 14,
        duration: 1500,
      });
    }
  }, [state.userLocation, mapLoaded]);

  // Update controller marker
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    if (state.controllerConfig.location) {
      const { lat, lng } = state.controllerConfig.location;

      if (controllerMarker.current) {
        controllerMarker.current.setLngLat([lng, lat]);
      } else {
        const el = document.createElement('div');
        el.className = 'controller-marker';
        el.innerHTML = `
          <div class="relative flex items-center justify-center">
            <div class="h-10 w-10 bg-buzz-purple rounded-lg border-2 border-white shadow-xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <rect x="4" y="6" width="16" height="12" rx="2"/>
                <circle cx="8" cy="12" r="2"/>
                <circle cx="16" cy="12" r="2"/>
                <rect x="10" y="3" width="4" height="3" rx="1"/>
              </svg>
            </div>
            <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-buzz-purple"></div>
          </div>
        `;

        controllerMarker.current = new maplibregl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(map.current);
      }
    } else if (controllerMarker.current) {
      controllerMarker.current.remove();
      controllerMarker.current = null;
    }
  }, [state.controllerConfig.location, mapLoaded]);

  // Update drone marker and radius circle
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove existing circle and overlay
    if (radiusCircle.current && map.current.getLayer(radiusCircle.current)) {
      map.current.removeLayer(radiusCircle.current);
      map.current.removeLayer(`${radiusCircle.current}-outline`);
      map.current.removeSource(radiusCircle.current);
    }

    if (state.droneConfig.location) {
      const { lat, lng } = state.droneConfig.location;
      const radius = state.droneConfig.radius;

      // Create radius circle
      const circleId = `drone-radius-${Date.now()}`;
      radiusCircle.current = circleId;

      // Create a GeoJSON circle
      const circleGeoJSON = createGeoJSONCircle([lng, lat], radius);

      map.current.addSource(circleId, {
        type: 'geojson',
        data: circleGeoJSON,
      });

      // Add fill layer
      map.current.addLayer({
        id: circleId,
        type: 'fill',
        source: circleId,
        paint: {
          'fill-color': state.calculationResult ? 'transparent' : '#a855f7',
          'fill-opacity': state.calculationResult ? 0 : 0.15,
        },
      });

      // Add outline
      map.current.addLayer({
        id: `${circleId}-outline`,
        type: 'line',
        source: circleId,
        paint: {
          'line-color': '#a855f7',
          'line-width': 2,
          'line-opacity': 0.8,
        },
      });

      // Update or create drone marker
      if (droneMarker.current) {
        droneMarker.current.setLngLat([lng, lat]);
      } else {
        const el = document.createElement('div');
        el.className = 'drone-marker';
        el.innerHTML = `
          <div class="relative flex flex-col items-center">
            <div class="px-3 py-1 bg-buzz-dark-card/90 rounded-lg border border-buzz-dark-border text-xs font-semibold mb-2 flex items-center gap-2">
              <span class="h-2 w-2 rounded-full bg-buzz-green"></span>
              ${state.selectedDrone?.name || 'DRONE-01'}
            </div>
            <div class="relative">
              <div class="absolute inset-0 border-2 border-buzz-purple rounded-lg animate-pulse opacity-50"></div>
              <div class="h-12 w-12 bg-buzz-dark-card rounded-lg border-2 border-buzz-purple flex items-center justify-center shadow-xl shadow-buzz-purple/30">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 4L15 7H9L12 4Z" fill="#a855f7"/>
                  <rect x="9" y="7" width="6" height="6" rx="1" fill="#a855f7"/>
                  <path d="M12 20L9 17H15L12 20Z" fill="#a855f7"/>
                  <rect x="4" y="9" width="3" height="3" rx="0.5" fill="#a855f7" opacity="0.6"/>
                  <rect x="17" y="9" width="3" height="3" rx="0.5" fill="#a855f7" opacity="0.6"/>
                </svg>
              </div>
            </div>
          </div>
        `;

        droneMarker.current = new maplibregl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(map.current);
      }
    } else {
      if (droneMarker.current) {
        droneMarker.current.remove();
        droneMarker.current = null;
      }
    }
  }, [state.droneConfig.location, state.droneConfig.radius, state.calculationResult, state.selectedDrone?.name, mapLoaded]);

  // Render calculation result image
  useEffect(() => {
    if (!map.current || !mapLoaded || !state.droneConfig.location) return;

    // Remove existing overlay
    if (resultOverlay.current && map.current.getLayer(resultOverlay.current)) {
      map.current.removeLayer(resultOverlay.current);
      map.current.removeSource(resultOverlay.current);
    }

    if (state.calculationResult) {
      const { lat, lng } = state.droneConfig.location;
      const radius = state.droneConfig.radius;
      const overlayId = `result-overlay-${Date.now()}`;
      resultOverlay.current = overlayId;

      // Calculate bounds for the image
      const bounds = calculateBoundsFromRadius(lat, lng, radius);

      // Add the image as a raster source
      map.current.addSource(overlayId, {
        type: 'image',
        url: state.calculationResult.imageData,
        coordinates: [
          [bounds.west, bounds.north],
          [bounds.east, bounds.north],
          [bounds.east, bounds.south],
          [bounds.west, bounds.south],
        ],
      });

      map.current.addLayer({
        id: overlayId,
        type: 'raster',
        source: overlayId,
        paint: {
          'raster-opacity': 0.8,
        },
      });
    }
  }, [state.calculationResult, state.droneConfig.location, state.droneConfig.radius, mapLoaded]);

  // Center on user location
  const handleCenterOnUser = useCallback(() => {
    if (!map.current || !state.userLocation) return;
    
    map.current.flyTo({
      center: [state.userLocation.lng, state.userLocation.lat],
      zoom: 14,
      duration: 1000,
    });
  }, [state.userLocation]);

  return (
    <div className="absolute inset-0">
      <div ref={mapContainer} className="h-full w-full" />

      {/* Map controls */}
      <div className="absolute right-4 bottom-48 z-10 flex flex-col gap-2">
        <Button
          variant="secondary"
          size="icon"
          className="h-12 w-12 rounded-xl shadow-lg"
          onClick={() => {}}
        >
          <Layers className="h-5 w-5" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-12 w-12 rounded-xl shadow-lg"
          onClick={handleCenterOnUser}
        >
          <Crosshair className="h-5 w-5" />
        </Button>
      </div>

      {/* Placement mode indicator */}
      {state.placementMode !== 'none' && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20">
          <div className="glass px-4 py-2 rounded-full">
            <span className="text-sm font-medium">
              Tap on map to place{' '}
              <span className="text-buzz-purple">
                {state.placementMode === 'controller' ? 'Controller' : 'Drone'}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to create a GeoJSON circle
function createGeoJSONCircle(center: [number, number], radiusMeters: number, points: number = 64): GeoJSON.Feature<GeoJSON.Polygon> {
  const coords: [number, number][] = [];
  const distanceX = radiusMeters / (111320 * Math.cos((center[1] * Math.PI) / 180));
  const distanceY = radiusMeters / 110540;

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    coords.push([center[0] + x, center[1] + y]);
  }
  coords.push(coords[0]); // Close the polygon

  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [coords],
    },
  };
}

// Calculate bounds from center and radius
function calculateBoundsFromRadius(lat: number, lng: number, radiusMeters: number) {
  const distanceX = radiusMeters / (111320 * Math.cos((lat * Math.PI) / 180));
  const distanceY = radiusMeters / 110540;

  return {
    north: lat + distanceY,
    south: lat - distanceY,
    east: lng + distanceX,
    west: lng - distanceX,
  };
}

