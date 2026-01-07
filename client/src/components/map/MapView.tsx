import { useRef, useEffect, useState, useCallback } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';
import ImageLayer from 'ol/layer/Image';
import ImageStatic from 'ol/source/ImageStatic';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Feature } from 'ol';
import { Point, Polygon } from 'ol/geom';
import { Style, Fill, Stroke, Icon } from 'ol/style';
import Draw from 'ol/interaction/Draw';
import { Layers, Crosshair } from 'lucide-react';
import { useApp, Coordinates } from '@/store/AppContext';
import { Button } from '@/components/ui/button';
import 'ol/ol.css';

// Israel bounds in EPSG:4326 (lon, lat)
const ISRAEL_BOUNDS = {
  minLon: 34.2,
  minLat: 29.5,
  maxLon: 35.9,
  maxLat: 33.3,
};

// Israel center
const ISRAEL_CENTER: [number, number] = [35.0, 31.5];

export function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const userMarkerLayer = useRef<VectorLayer<VectorSource> | null>(null);
  const controllerMarkerLayer = useRef<VectorLayer<VectorSource> | null>(null);
  const droneMarkerLayer = useRef<VectorLayer<VectorSource> | null>(null);
  const drawnAreaLayer = useRef<VectorLayer<VectorSource> | null>(null);
  const resultOverlayLayer = useRef<ImageLayer<ImageStatic> | null>(null);
  const drawInteraction = useRef<Draw | null>(null);

  const { state, dispatch } = useApp();
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Create the map
    map.current = new Map({
      target: mapContainer.current,
      layers: [
        new TileLayer({
          source: new XYZ({
            urls: [
              'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
              'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
              'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
            ],
            attributions: '© CARTO',
          }),
        }),
      ],
      view: new View({
        center: fromLonLat(ISRAEL_CENTER),
        zoom: 7,
        extent: [
          ...fromLonLat([ISRAEL_BOUNDS.minLon, ISRAEL_BOUNDS.minLat]),
          ...fromLonLat([ISRAEL_BOUNDS.maxLon, ISRAEL_BOUNDS.maxLat]),
        ],
      }),
      controls: [],
    });

    // Create vector layers for markers
    userMarkerLayer.current = new VectorLayer({
      source: new VectorSource(),
      zIndex: 100,
    });

    controllerMarkerLayer.current = new VectorLayer({
      source: new VectorSource(),
      zIndex: 101,
    });

    droneMarkerLayer.current = new VectorLayer({
      source: new VectorSource(),
      zIndex: 102,
    });

    drawnAreaLayer.current = new VectorLayer({
      source: new VectorSource(),
      zIndex: 50,
      style: new Style({
        fill: new Fill({
          color: 'rgba(168, 85, 247, 0.15)',
        }),
        stroke: new Stroke({
          color: '#a855f7',
          width: 2,
        }),
      }),
    });

    map.current.addLayer(drawnAreaLayer.current);
    map.current.addLayer(userMarkerLayer.current);
    map.current.addLayer(controllerMarkerLayer.current);
    map.current.addLayer(droneMarkerLayer.current);

    setMapLoaded(true);

    return () => {
      if (map.current) {
        map.current.setTarget(undefined);
        map.current = null;
      }
    };
  }, []);

  // Handle map click for placement mode (controller and drone)
  useEffect(() => {
    if (!map.current) return;

    const handleClick = (e: { coordinate: number[] }) => {
      if (state.placementMode !== 'controller' && state.placementMode !== 'drone') return;
      
      const lonLat = toLonLat(e.coordinate);
      const coords = { lat: lonLat[1], lng: lonLat[0] };

      if (state.placementMode === 'controller') {
        dispatch({ type: 'SET_CONTROLLER_LOCATION', payload: coords });
      } else if (state.placementMode === 'drone') {
        dispatch({ type: 'SET_DRONE_LOCATION', payload: coords });
      }
    };

    map.current.on('click', handleClick);

    return () => {
      map.current?.un('click', handleClick);
    };
  }, [state.placementMode, dispatch]);

  // Handle drawing mode
  useEffect(() => {
    if (!map.current || !drawnAreaLayer.current) return;

    // Remove existing draw interaction
    if (drawInteraction.current) {
      map.current.removeInteraction(drawInteraction.current);
      drawInteraction.current = null;
    }

    if (state.placementMode === 'drawing') {
      const source = drawnAreaLayer.current.getSource();
      if (!source) return;

      // Clear existing drawn area
      source.clear();

      // Create draw interaction for polygon
      drawInteraction.current = new Draw({
        source: source,
        type: 'Polygon',
        style: new Style({
          fill: new Fill({
            color: 'rgba(168, 85, 247, 0.2)',
          }),
          stroke: new Stroke({
            color: '#a855f7',
            width: 2,
            lineDash: [5, 5],
          }),
        }),
      });

      // Handle draw end
      drawInteraction.current.on('drawend', (e) => {
        const geometry = e.feature.getGeometry() as Polygon;
        const coordinates = geometry.getCoordinates()[0];
        
        // Convert from map projection to lat/lng
        const areaCoords: Coordinates[] = coordinates.map((coord) => {
          const lonLat = toLonLat(coord);
          return { lat: lonLat[1], lng: lonLat[0] };
        });

        dispatch({ type: 'SET_DRONE_AREA', payload: areaCoords });

        // Remove draw interaction after drawing
        if (map.current && drawInteraction.current) {
          map.current.removeInteraction(drawInteraction.current);
          drawInteraction.current = null;
        }
      });

      map.current.addInteraction(drawInteraction.current);
    }

    return () => {
      if (map.current && drawInteraction.current) {
        map.current.removeInteraction(drawInteraction.current);
        drawInteraction.current = null;
      }
    };
  }, [state.placementMode, dispatch]);

  // Update cursor based on placement mode
  useEffect(() => {
    if (!map.current || !mapContainer.current) return;

    if (state.placementMode === 'controller' || state.placementMode === 'drone') {
      mapContainer.current.style.cursor = 'crosshair';
    } else if (state.placementMode === 'drawing') {
      mapContainer.current.style.cursor = 'crosshair';
    } else {
      mapContainer.current.style.cursor = '';
    }
  }, [state.placementMode]);

  // Update user location marker
  useEffect(() => {
    if (!map.current || !mapLoaded || !state.userLocation || !userMarkerLayer.current) return;

    const source = userMarkerLayer.current.getSource();
    if (!source) return;

    source.clear();

    // Create user location feature with pulsing effect style
    const userFeature = new Feature({
      geometry: new Point(fromLonLat([state.userLocation.lng, state.userLocation.lat])),
    });

    // Create SVG for user marker
    const userMarkerSvg = `
      <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#3b82f6" opacity="0.3"/>
        <circle cx="12" cy="12" r="6" fill="#3b82f6" stroke="white" stroke-width="2"/>
      </svg>
    `;

    userFeature.setStyle(
      new Style({
        image: new Icon({
          src: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(userMarkerSvg),
          scale: 1,
        }),
      })
    );

    source.addFeature(userFeature);

    // Center map on user location
    map.current.getView().animate({
      center: fromLonLat([state.userLocation.lng, state.userLocation.lat]),
      zoom: 14,
      duration: 1500,
    });
  }, [state.userLocation, mapLoaded]);

  // Update controller marker
  useEffect(() => {
    if (!map.current || !mapLoaded || !controllerMarkerLayer.current) return;

    const source = controllerMarkerLayer.current.getSource();
    if (!source) return;

    source.clear();

    if (state.controllerConfig.location) {
      const { lat, lng } = state.controllerConfig.location;

      const controllerFeature = new Feature({
        geometry: new Point(fromLonLat([lng, lat])),
      });

      // Controller marker SVG
      const controllerSvg = `
        <svg width="48" height="56" viewBox="0 0 48 56" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="4" width="40" height="40" rx="8" fill="#a855f7" stroke="white" stroke-width="2"/>
          <rect x="14" y="14" width="8" height="6" rx="1" fill="white"/>
          <rect x="26" y="14" width="8" height="6" rx="1" fill="white"/>
          <circle cx="18" cy="30" r="4" fill="white"/>
          <circle cx="30" cy="30" r="4" fill="white"/>
          <polygon points="24,44 18,52 30,52" fill="#a855f7"/>
        </svg>
      `;

      controllerFeature.setStyle(
        new Style({
          image: new Icon({
            src: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(controllerSvg),
            scale: 0.85,
            anchor: [0.5, 1],
          }),
        })
      );

      source.addFeature(controllerFeature);
    }
  }, [state.controllerConfig.location, mapLoaded]);

  // Update drone marker
  useEffect(() => {
    if (!map.current || !mapLoaded || !droneMarkerLayer.current) return;

    const droneSource = droneMarkerLayer.current.getSource();
    if (!droneSource) return;

    droneSource.clear();

    if (state.droneConfig.location) {
      const { lat, lng } = state.droneConfig.location;

      // Create drone marker
      const droneFeature = new Feature({
        geometry: new Point(fromLonLat([lng, lat])),
      });

      const droneName = state.selectedDrone?.name || 'DRONE-01';

      // Drone marker SVG with label
      const droneSvg = `
        <svg width="100" height="80" viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="0" width="80" height="24" rx="6" fill="rgba(30, 30, 40, 0.9)" stroke="#3f3f5f" stroke-width="1"/>
          <circle cx="22" cy="12" r="4" fill="#22c55e"/>
          <text x="50" y="16" text-anchor="middle" fill="white" font-size="10" font-family="system-ui, sans-serif" font-weight="600">${droneName}</text>
          <rect x="28" y="32" width="44" height="44" rx="8" fill="#1e1e28" stroke="#a855f7" stroke-width="2"/>
          <path d="M50 38 L58 46 L42 46 Z" fill="#a855f7"/>
          <rect x="42" y="46" width="16" height="16" rx="2" fill="#a855f7"/>
          <path d="M50 72 L42 64 L58 64 Z" fill="#a855f7"/>
          <rect x="20" y="48" width="8" height="8" rx="1" fill="#a855f7" opacity="0.6"/>
          <rect x="72" y="48" width="8" height="8" rx="1" fill="#a855f7" opacity="0.6"/>
        </svg>
      `;

      droneFeature.setStyle(
        new Style({
          image: new Icon({
            src: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(droneSvg),
            scale: 1,
            anchor: [0.5, 0.7],
          }),
        })
      );

      droneSource.addFeature(droneFeature);
    }
  }, [state.droneConfig.location, state.selectedDrone?.name, mapLoaded]);

  // Update drawn area polygon
  useEffect(() => {
    if (!map.current || !mapLoaded || !drawnAreaLayer.current) return;

    const source = drawnAreaLayer.current.getSource();
    if (!source) return;

    // Only clear and redraw if we're not in drawing mode (to prevent clearing while drawing)
    if (state.placementMode !== 'drawing') {
      source.clear();

      if (state.droneConfig.drawnArea && state.droneConfig.drawnArea.length > 2) {
        // Convert lat/lng to map projection
        const coordinates = state.droneConfig.drawnArea.map((coord) =>
          fromLonLat([coord.lng, coord.lat])
        );

        const polygonFeature = new Feature({
          geometry: new Polygon([coordinates]),
        });

        // Set style based on whether we have a calculation result
        polygonFeature.setStyle(
          new Style({
            fill: new Fill({
              color: state.calculationResult ? 'transparent' : 'rgba(168, 85, 247, 0.15)',
            }),
            stroke: new Stroke({
              color: '#a855f7',
              width: 2,
            }),
          })
        );

        source.addFeature(polygonFeature);
      }
    }
  }, [state.droneConfig.drawnArea, state.calculationResult, state.placementMode, mapLoaded]);

  // Render calculation result image clipped to drawn area
  useEffect(() => {
    if (!map.current || !mapLoaded || !state.droneConfig.drawnArea) return;

    // Remove existing overlay
    if (resultOverlayLayer.current) {
      map.current.removeLayer(resultOverlayLayer.current);
      resultOverlayLayer.current = null;
    }

    if (state.calculationResult && state.droneConfig.drawnArea.length > 2) {
      // Calculate bounds from polygon
      const bounds = calculateBoundsFromPolygon(state.droneConfig.drawnArea);

      resultOverlayLayer.current = new ImageLayer({
        source: new ImageStatic({
          url: state.calculationResult.imageData,
          imageExtent: [
            ...fromLonLat([bounds.west, bounds.south]),
            ...fromLonLat([bounds.east, bounds.north]),
          ],
        }),
        opacity: 0.8,
        zIndex: 60,
      });

      map.current.addLayer(resultOverlayLayer.current);
    }
  }, [state.calculationResult, state.droneConfig.drawnArea, mapLoaded]);

  // Center on user location
  const handleCenterOnUser = useCallback(() => {
    if (!map.current || !state.userLocation) return;

    map.current.getView().animate({
      center: fromLonLat([state.userLocation.lng, state.userLocation.lat]),
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
              {state.placementMode === 'drawing' ? (
                <>
                  <span className="text-buzz-purple">Draw</span> the operational area on map
                </>
              ) : (
                <>
                  Tap on map to place{' '}
                  <span className="text-buzz-purple">
                    {state.placementMode === 'controller' ? 'Controller' : 'Drone'}
                  </span>
                </>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Calculate bounds from polygon coordinates
function calculateBoundsFromPolygon(coords: Coordinates[]) {
  let minLat = Infinity, maxLat = -Infinity;
  let minLng = Infinity, maxLng = -Infinity;

  for (const coord of coords) {
    minLat = Math.min(minLat, coord.lat);
    maxLat = Math.max(maxLat, coord.lat);
    minLng = Math.min(minLng, coord.lng);
    maxLng = Math.max(maxLng, coord.lng);
  }

  return {
    north: maxLat,
    south: minLat,
    east: maxLng,
    west: minLng,
  };
}
