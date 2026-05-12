import React, { useEffect, useMemo, useRef } from 'react';
import { useAppSelector } from '../../../../hooks/useAppSelector';
import { useAppDispatch } from '../../../../hooks/useAppDispatch';
import { updateTarget } from '../../../../store/slices/targetsSlice';
import { RedRoundButton } from '../../../ui/RedRoundButton';

type MLMap = any;

interface LayerManagerProps {
  map: MLMap;
  mapService?: { onStyleChanged?: (cb: () => void) => void };
}

/* ---------- helpers ---------- */
const isMapReady = (map: MLMap) =>
  !!map && typeof map.isStyleLoaded === 'function' && map.isStyleLoaded();

const ensureSource = (map: MLMap, id: string, def: any) => {
  if (!map.getSource?.(id)) map.addSource(id, def);
};

const ensureLayer = (map: MLMap, layerDef: any, beforeId?: string) => {
  if (!map.getLayer?.(layerDef.id)) map.addLayer(layerDef, beforeId);
};

// Removed unused loadImageOnce function

/* ---------- component ---------- */
const LayerManager: React.FC<LayerManagerProps> = ({ map, mapService }) => {
  const targets = useAppSelector(s => s.targets);
  const myPosition = useAppSelector(s => s.myPosition);

  const initializedRef = useRef(false);
  const iconsLoadAttemptRef = useRef(0);
  const maxIconLoadAttempts = 3; 
  const styleTimeoutRef = useRef<number | null>(null);

  const IDS = useMemo(() => ({
    // sources
    srcTargets: 'targets',
    srcTrails: 'targets-trails',
    srcAssignArrows: 'target-arrows',
    // layers
    lyrTrails: 'targets-trails-layer',
    lyrCircleFallback: 'targets-circle-layer',
    lyrTargets: 'targets-layer',
    lyrAssignArrows: 'target-arrows-layer',
    lyrRedRing: 'targets-red-ring-layer',
  }), []);

  const initializeLayers = async () => {
    console.log('🎯 LayerManager initializeLayers called:', {
      mapReady: isMapReady(map),
      initialized: initializedRef.current
    });

    if (!isMapReady(map) || initializedRef.current) return;

    console.log('🎯 LayerManager: Initializing layers...');

    // Load SVG icons with limited attempts
    if (iconsLoadAttemptRef.current < maxIconLoadAttempts) {
      iconsLoadAttemptRef.current++;

      try {
        // Load SVG icons and create colored versions
        const svgIcons = [
          { type: 'drone', file: 'drone.svg' },
          { type: 'plane', file: 'plane.svg' },
          { type: 'unknown', file: 'unknown.svg' }
        ];

        for (const icon of svgIcons) {
          try {
            const response = await fetch(`/icons/targets/${icon.file}`);
            if (!response.ok) {
              console.warn(`⚠️ SVG not found: ${icon.file}`);
              continue;
            }

            let svgText = await response.text();

            // Ensure SVG has proper fill attributes
            if (!svgText.includes('fill=')) {
              // Add fill to path elements if missing
              svgText = svgText.replace(/<path/g, '<path fill="currentColor"');
            }

            // Create friendly (green) version
            const friendlySvg = svgText
              .replace(/fill="[^"]*"/g, 'fill="#34a847"')
              .replace(/stroke="[^"]*"/g, 'stroke="#34a847"')
              .replace(/fill:([^;]*);/g, 'fill:#34a847;');

            // Create hostile (red) version  
            const hostileSvg = svgText
              .replace(/fill="[^"]*"/g, 'fill="#EF4444"')
              .replace(/stroke="[^"]*"/g, 'stroke="#EF4444"')
              .replace(/fill:([^;]*);/g, 'fill:#EF4444;');

            // Convert to images
            const friendlyImg = new Image();
            const hostileImg = new Image();

            friendlyImg.onload = () => {
              try {
                map.addImage(`${icon.type}_friendly`, friendlyImg);
                console.log(`✅ Loaded ${icon.type}_friendly`);
              } catch (e) {
                console.warn(`⚠️ Failed to add ${icon.type}_friendly:`, e);
              }
            };

            hostileImg.onload = () => {
              try {
                map.addImage(`${icon.type}_hostile`, hostileImg);
                console.log(`✅ Loaded ${icon.type}_hostile`);
              } catch (e) {
                console.warn(`⚠️ Failed to add ${icon.type}_hostile:`, e);
              }
            };

            friendlyImg.src = 'data:image/svg+xml;base64,' + btoa(friendlySvg);
            hostileImg.src = 'data:image/svg+xml;base64,' + btoa(hostileSvg);

          } catch (error) {
            console.warn(`⚠️ Failed to process ${icon.file}:`, error);
          }
        }
      } catch (error) {
        console.warn('⚠️ SVG loading failed:', error);
      }
    } else {
      console.log(`🎯 LayerManager: Skipping icon loading - max attempts (${maxIconLoadAttempts}) reached`);
    }

    console.log('🎯 LayerManager: Adding sources...');
    ensureSource(map, IDS.srcTargets, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    ensureSource(map, IDS.srcTrails, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    ensureSource(map, IDS.srcAssignArrows, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    ensureSource(map, 'arrow-heads', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    ensureSource(map, 'arrow-tips', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });

    console.log('🎯 LayerManager: Adding layers...');

    // שובל - small dense dots like real trail
    ensureLayer(map, {
      id: IDS.lyrTrails,
      type: 'line',
      source: IDS.srcTrails,
      paint: {
        'line-color': "#FFF",
        'line-width': ['interpolate', ['linear'], ['zoom'], 5, 2, 10, 3, 15, 4],
        'line-opacity': 0.9,
        'line-dasharray': [1, 1] // Very small dots with small gaps - dense trail
      }
    });

    // Target circles as fallback only when no icon available
    // ensureLayer(map, {
    //   id: IDS.lyrCircleFallback,
    //   type: 'circle',
    //   source: IDS.srcTargets,
    //   filter: ['==', ['get', 'iconName'], null],
    //   paint: {
    //     'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 10, 10, 14, 15, 18],
    //     'circle-color': ['case',
    //       ['==', ['get', 'status'], 'disconnected'], '#808080',
    //       ['==', ['get', 'friend'], true], '#34a847',
    //       '#EF4444'
    //     ],
    //     'circle-stroke-color': '#FFFFFF',
    //     'circle-stroke-width': 5,
    //     'circle-opacity': 1 ,// Always full opacity
        
    //   }
    // });

    // Target icons layer
    ensureLayer(map, {
      id: IDS.lyrTargets,
      type: 'symbol',
      source: IDS.srcTargets,
      filter: ['!=', ['get', 'iconName'], null],
      layout: {
        'icon-image': ['get', 'iconName'],
        'icon-size': ['interpolate', ['linear'], ['zoom'], 5, 0.05, 10, 0.07, 15, 0.08],
        'icon-allow-overlap': true,
        'icon-rotation-alignment': 'map',
        'icon-rotate': ['get', 'heading']
      },
      paint: {
        'icon-opacity': 1 // Always full opacity
      }
    });

    // Status ring - orange for recommended, red for assigned
    ensureLayer(map, {
      id: IDS.lyrRedRing,
      type: 'circle',
      source: IDS.srcTargets,
      filter: ['any', ['==', ['get', 'isRecommended'], true], ['==', ['get', 'isAssigned'], true]],
      paint: {
        'circle-color': 'rgba(0,0,0,0)',
        'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 5, 2.5, 10, 3.5, 15, 4.5],
        'circle-stroke-color': [
          'case',
          ['==', ['get', 'isAssigned'], true], '#ff2b2b', 
          ['==', ['get', 'isRecommended'], true], '#ff8c00', 
          '#ff2b2b' 
        ],
        'circle-stroke-opacity': 0.7,
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 20, 10, 30, 15, 40]
      }
    });

    // Assignment arrows - thin elegant line
    ensureLayer(map, {
      id: IDS.lyrAssignArrows,
      type: 'line',
      source: IDS.srcAssignArrows,
      paint: {
        'line-color': '#ff4444',
        'line-width': ['interpolate', ['linear'], ['zoom'], 5, 2, 10, 3, 15, 4],
        'line-opacity': 0.8
      }
    });

    // Arrow tips - creating arrow shape with lines
    ensureLayer(map, {
      id: 'arrow-tips-layer',
      type: 'line',
      source: 'arrow-tips',
      paint: {
        'line-color': '#ff4444',
        'line-width': ['interpolate', ['linear'], ['zoom'], 5, 2, 10, 3, 15, 4],
        'line-opacity': 0.8
      }
    });

    initializedRef.current = true;
    console.log('🎯 LayerManager: Layers initialized successfully!');
  };

  // Helper function to calculate bearing between two points
  const calculateBearing = (from: { lng: number, lat: number }, to: { lng: number, lat: number }): number => {
    const dLng = (to.lng - from.lng) * Math.PI / 180;
    const lat1 = from.lat * Math.PI / 180;
    const lat2 = to.lat * Math.PI / 180;

    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

    const bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360; // Normalize to 0-360
  };

  // Helper function to calculate point at distance from target (200m before target)
  const getPointBeforeTarget = (from: { lng: number, lat: number }, to: { lng: number, lat: number }, distanceMeters: number = 200) => {
    // Approximate: 1 degree ≈ 111,000 meters
    const distanceDegrees = distanceMeters / 111000;

    const totalDistance = Math.sqrt(Math.pow(to.lng - from.lng, 2) + Math.pow(to.lat - from.lat, 2));
    const ratio = Math.max(0, (totalDistance - distanceDegrees) / totalDistance);

    return {
      lng: from.lng + (to.lng - from.lng) * ratio,
      lat: from.lat + (to.lat - from.lat) * ratio
    };
  };

  const pushData = () => {
    console.log('🎯 LayerManager pushData called:', {
      mapReady: isMapReady(map),
      initialized: initializedRef.current,
      targetsCount: targets.allIds.length
    });

    if (!isMapReady(map)) return;

    const targetsSrc = map.getSource?.(IDS.srcTargets);
    const trailsSrc = map.getSource?.(IDS.srcTrails);
    const assignSrc = map.getSource?.(IDS.srcAssignArrows);
    const arrowHeadsSrc = map.getSource?.('arrow-heads');

    console.log('🎯 LayerManager sources check:', {
      targetsSrc: !!targetsSrc,
      trailsSrc: !!trailsSrc,
      assignSrc: !!assignSrc,
      arrowHeadsSrc: !!arrowHeadsSrc,
      targetsLayer: !!map.getLayer?.(IDS.lyrTargets),
      circleLayer: !!map.getLayer?.(IDS.lyrCircleFallback)
    });

    if (!targetsSrc?.setData || !trailsSrc?.setData || !assignSrc?.setData || !arrowHeadsSrc?.setData) {
      console.warn('🎯 LayerManager: Missing sources, reinitializing...');
      initializeLayers();
      return;
    }

    console.log('🎯 LayerManager: Processing targets:', targets.allIds.length, targets.byId);

    // --- Targets ---
    const targetFeatures = targets.allIds.map(id => {
      const t = targets.byId[id];
      if (!t || !t.coordinates || isNaN(t.coordinates.lng) || isNaN(t.coordinates.lat)) return null;

      // const now = Date.now();
      // const inactive = (now - (t.lastUpdate || 0)) > 30000 && !t.isDestroyed;
      const status = 'active'; // Always active - no timeout logic

      // Determine icon name based on type and friend status
      let iconName = null;
      const targetType = t.type || 'unknown';
      const friendStatus = t.friend ? 'friendly' : 'hostile';

      // Try to get specific icon, fallback to unknown if not available
      let preferredIcon = null;
      if (targetType === 'uav' || targetType === 'drone') {
        preferredIcon = `drone_${friendStatus}`;
      } else if (targetType === 'plane' || targetType === 'aircraft' || targetType === 'jet') {
        preferredIcon = `plane_${friendStatus}`;
      } else if (targetType === 'helicopter') {
        preferredIcon = `helicopter_${friendStatus}`;
      }

      // Check if the preferred icon exists in the map, otherwise use unknown
      if (preferredIcon && map.hasImage?.(preferredIcon)) {
        iconName = preferredIcon;
      } else {
        // Fallback to unknown icon
        iconName = `unknown_${friendStatus}`;

        // If even unknown icon doesn't exist, set to null (will show circle)
        if (!map.hasImage?.(iconName)) {
          iconName = null;
        }
      }

      console.log(`🎯 Target ${t.id}: type="${t.type}" -> preferred="${preferredIcon}" -> final="${iconName}"`);

      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [t.coordinates.lng, t.coordinates.lat] },
        properties: {
          id: t.id,
          heading: t.heading || 0,
          speed: t.speed || 0,
          friend: t.friend,
          status,
          type: t.type,
          iconName: iconName,
          isDestroyed: !!t.isDestroyed,
          isRecommended: !!t.isRecommended,
          isAssigned: !!t.isAssigned
        }
      };
    }).filter(Boolean) as any[];

    const targetsFC = { type: 'FeatureCollection', features: targetFeatures };
    console.log('🎯 LayerManager: Updating targets on map:', targetFeatures.length);
    console.log('🎯 LayerManager: Target features:', targetFeatures.map(f => ({
      id: f.properties.id,
      iconName: f.properties.iconName,
      coordinates: f.geometry.coordinates
    })));
    targetsSrc.setData(targetsFC);

    // --- Trails ---
    const trailFeatures = targets.allIds.map(id => {
      const t = targets.byId[id];
      if (!t?.trail || t.trail.length < 2) return null;
      const pts = t.trail.filter(p => p && !isNaN(p.lng) && !isNaN(p.lat));
      if (pts.length < 2) return null;
      return {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: pts.map(p => [p.lng, p.lat]) },
        properties: { id: t.id, friend: t.friend }
      };
    }).filter(Boolean) as any[];

    const trailsFC = { type: 'FeatureCollection', features: trailFeatures };
    trailsSrc.setData(trailsFC);

    // --- Assignment arrows ---
    const jeep = myPosition?.coordinates;
    console.log('🎯 Jeep position:', jeep);
    console.log('🎯 Assigned targets:', targets.allIds.filter(id => targets.byId[id]?.isAssigned).map(id => ({
      id,
      isAssigned: targets.byId[id]?.isAssigned,
      coordinates: targets.byId[id]?.coordinates
    })));

    const assignFeatures: any[] = [];
    const arrowTipFeatures: any[] = [];

    if (jeep) {
      targets.allIds
        .filter(id => targets.byId[id]?.isAssigned)
        .forEach(id => {
          const t = targets.byId[id]!;
          if (!t?.coordinates) return;

          // Calculate bearing and end point (200m before target)
          const bearing = calculateBearing(jeep, t.coordinates);
          const lineEndPoint = getPointBeforeTarget(jeep, t.coordinates, 200);

          console.log(`🎯 Creating arrow for target ${id}:`, {
            from: jeep,
            to: t.coordinates,
            lineEnd: lineEndPoint,
            bearing
          });

          // Main line from jeep to 200m before target
          assignFeatures.push({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [[jeep.lng, jeep.lat], [lineEndPoint.lng, lineEndPoint.lat]]
            },
            properties: {
              id: t.id,
              targetId: t.id
            }
          });

          // Create arrow tip - two small lines forming arrow shape
          const arrowLength = 0.002; // Arrow size
          const arrowAngle = 25; // Arrow angle in degrees

          // Calculate the direction from line end towards target
          const directionRad = Math.atan2(t.coordinates.lat - lineEndPoint.lat, t.coordinates.lng - lineEndPoint.lng);

          // Calculate arrow tip points
          const leftAngle = directionRad + (arrowAngle * Math.PI / 180);
          const rightAngle = directionRad - (arrowAngle * Math.PI / 180);

          // Arrow tip points - going backwards from the line end
          const leftTip = {
            lng: lineEndPoint.lng - arrowLength * Math.cos(leftAngle),
            lat: lineEndPoint.lat - arrowLength * Math.sin(leftAngle)
          };

          const rightTip = {
            lng: lineEndPoint.lng - arrowLength * Math.cos(rightAngle),
            lat: lineEndPoint.lat - arrowLength * Math.sin(rightAngle)
          };

          // Add both arrow tip lines
          arrowTipFeatures.push({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [[lineEndPoint.lng, lineEndPoint.lat], [leftTip.lng, leftTip.lat]]
            },
            properties: { id: t.id + '_left' }
          });

          arrowTipFeatures.push({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [[lineEndPoint.lng, lineEndPoint.lat], [rightTip.lng, rightTip.lat]]
            },
            properties: { id: t.id + '_right' }
          });
        });
    }

    const assignFC = { type: 'FeatureCollection', features: assignFeatures };
    console.log('🎯 Assignment arrows updated:', assignFeatures.length, 'arrows');
    assignSrc.setData(assignFC);

    // Update arrow tips
    const arrowTipsFC = { type: 'FeatureCollection', features: arrowTipFeatures };
    const arrowTipsSrc = map.getSource?.('arrow-tips');
    if (arrowTipsSrc?.setData) {
      arrowTipsSrc.setData(arrowTipsFC);
      console.log('🎯 Arrow tips updated:', arrowTipFeatures.length, 'tips');
    }
  };

  useEffect(() => {
    if (!map) return;

    const kick = () => {
      if (!isMapReady(map)) return;
      initializeLayers();
      pushData();
    };

    if (isMapReady(map)) {
      kick();
    } else {
      map.once?.('load', kick);
    }

    const onStyle = () => {
      // Debounce style changes to prevent too many reinitializations
      if (styleTimeoutRef.current) {
        clearTimeout(styleTimeoutRef.current);
      }

      styleTimeoutRef.current = window.setTimeout(() => {
        console.log('🎯 LayerManager: Style changed, reinitializing...');
        initializedRef.current = false;
        initializeLayers();
        pushData();
      }, 300);
    };

    map.on?.('styledata', onStyle);
    mapService?.onStyleChanged?.(onStyle);

    return () => {
      map.off?.('styledata', onStyle);
    };
  }, [map]);

  useEffect(() => {
    pushData();
  }, [targets.byId, targets.allIds, myPosition]);

  const dispatch = useAppDispatch();

  // State for button positions that update with map movement
  const [buttonPositions, setButtonPositions] = React.useState<Record<string, { x: number, y: number }>>({});

  // Update button positions when map moves or targets change
  const updateButtonPositions = React.useCallback(() => {
    if (!map) return;

    const assignedTargets = targets.allIds
      .map(id => targets.byId[id])
      .filter(target => target?.isAssigned && target?.coordinates);

    const newPositions: Record<string, { x: number, y: number }> = {};

    assignedTargets.forEach(target => {
      if (target?.coordinates) {
        const pixel = map.project([target.coordinates.lng, target.coordinates.lat]);
        newPositions[target.id] = {
          x: pixel.x - 32.5, // Center the 65px button
          y: pixel.y + 30
        };
      }
    });

    setButtonPositions(newPositions);
  }, [map, targets.allIds, targets.byId]);

  // Listen to map movement events and target changes
  React.useEffect(() => {
    if (!map) return;

    updateButtonPositions();

    // Update positions on map move/zoom
    map.on('move', updateButtonPositions);
    map.on('zoom', updateButtonPositions);

    return () => {
      map.off('move', updateButtonPositions);
      map.off('zoom', updateButtonPositions);
    };
  }, [map, updateButtonPositions]);

  // Get assigned targets for rendering
  const assignedTargets = targets.allIds
    .map(id => targets.byId[id])
    .filter(target => target?.isAssigned && target?.coordinates);

  return (
    <>
      {/* Floating cancel buttons for assigned targets */}
      {assignedTargets.map(target => {
        if (!target?.coordinates) return null;

        const position = buttonPositions[target.id];
        if (!position) return null;

        return (
          <div
            key={`cancel-${target.id}`}
            className="fixed z-50 pointer-events-auto"
            style={{
              left: position.x,
              top: position.y,
            }}
          >
            <RedRoundButton
              onClick={() => {
                const updatedTarget = {
                  ...target,
                  isAssigned: false,
                  status: 'active'
                };
                dispatch(updateTarget(updatedTarget));
              }}
              size={65}
              label="ביטול"
            />
          </div>
        );
      })}
    </>
  );
};

export default LayerManager;