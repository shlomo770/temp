// import React, { useEffect, useMemo, useRef } from 'react';
// import { useAppSelector } from '../../../../hooks/useAppSelector';

// type MLMap = any;

// interface LayerManagerProps {
//   map: MLMap;
//   mapService?: { onStyleChanged?: (cb: () => void) => void };
// }

// /* ---------- helpers ---------- */
// const isMapReady = (map: MLMap) =>
//   !!map && typeof map.isStyleLoaded === 'function' && map.isStyleLoaded();

// const ensureSource = (map: MLMap, id: string, def: any) => {
//   if (!map.getSource?.(id)) map.addSource(id, def);
// };

// const ensureLayer = (map: MLMap, layerDef: any, beforeId?: string) => {
//   if (!map.getLayer?.(layerDef.id)) map.addLayer(layerDef, beforeId);
// };

// const loadImageOnce = (map: MLMap, name: string, url: string) =>
//   new Promise<void>(resolve => {
//     try {
//       if (map.hasImage?.(name)) return resolve();
//       map.loadImage(url, (err: any, image: any) => {
//         if (!err && image) {
//           try { map.addImage(name, image); } catch { }
//         }
//         resolve();
//       });
//     } catch { resolve(); }
//   });

// /* ---------- component ---------- */
// const LayerManager: React.FC<LayerManagerProps> = ({ map, mapService }) => {
//   const targets = useAppSelector(s => s.targets);
//   const myPosition = useAppSelector(s => s.myPosition);

//   const initializedRef = useRef(false);

//   const loadedIconNamesRef = useRef<Set<string>>(new Set());

//   const reinitScheduledRef = useRef(false);
//   const reinitTimerRef = useRef<number | null>(null);

//   const lastTargetsHashRef = useRef<string>('');
//   const lastTrailsHashRef = useRef<string>('');
//   const lastAssignHashRef = useRef<string>('');
//   const lastLocksHashRef = useRef<string>('');

//   const IDS = useMemo(() => ({
//     // sources
//     srcTargets: 'targets',
//     srcTrails: 'targets-trails',
//     srcAssignLines: 'target-lines',
//     srcLocks: 'target-locks',
//     // layers
//     lyrTrails: 'targets-trails-layer',
//     lyrCircleFallback: 'targets-circle-layer',
//     lyrTargets: 'targets-layer',
//     lyrAssignLines: 'target-lines-layer',
//     lyrLocks: 'target-locks-layer',
//     lyrRedRing: 'targets-red-ring-layer',
//     // images
//     imgLock: 'lock_eye',
//   }), []);

//   const loadIcons = async () => {
//     if (!isMapReady(map)) return;

//     const types = ['plane', 'uav'];
//     const colors = ['green', 'red'];

//     for (const type of types) {
//       for (const color of colors) {
//         const name = `${type}_${color}`;
//         await loadImageOnce(map, name, `/icons/${name}.png`);
//         if (map.hasImage?.(name)) loadedIconNamesRef.current.add(name);
//       }
//     }
//     await loadImageOnce(map, IDS.imgLock, '/icons/eye.png');
//   };

//   const initializeLayers = async () => {
//     if (!isMapReady(map) || initializedRef.current) return;

//     await loadIcons();

//     ensureSource(map, IDS.srcTargets, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
//     ensureSource(map, IDS.srcTrails, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
//     ensureSource(map, IDS.srcAssignLines, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
//     ensureSource(map, IDS.srcLocks, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });

//     // שובל
//     ensureLayer(map, {
//       id: IDS.lyrTrails,
//       type: 'line',
//       source: IDS.srcTrails,
//       paint: {
//         'line-color': ['case', ['==', ['get', 'friend'], true], '#34a847', '#EF4444'],
//         'line-width': 2,
//         'line-opacity': 0.6
//       }
//     });

//     // fallback circles – מצייר רק כשicon == null (כלומר אייקון לא זמין עדיין)
//     ensureLayer(map, {
//       id: IDS.lyrCircleFallback,
//       type: 'circle',
//       source: IDS.srcTargets,
//       filter: ['==', ['get', 'icon'], null],
//       paint: {
//         'circle-radius': 8,
//         'circle-color': ['case', ['==', ['get', 'status'], 'disconnected'], '#808080', ['==', ['get', 'friend'], true], '#34a847', '#EF4444'],
//         'circle-stroke-color': '#FFFFFF',
//         'circle-stroke-width': 2,
//         'circle-opacity': ['case', ['==', ['get', 'status'], 'disconnected'], 0.5, 1]
//       }
//     });

//     ensureLayer(map, {
//       id: IDS.lyrRedRing,
//       type: 'circle',
//       source: IDS.srcTargets,
//       filter: ['==', ['get', 'isRecommended'], true],
//       paint: {
//         'circle-color': 'rgba(0,0,0,0)',
//         'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 5, 2.5, 10, 3.5, 15, 4.5],
//         'circle-stroke-color': '#ff2b2b',
//         'circle-stroke-opacity': 0.5,
//         'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 15, 10, 25, 15, 35]
//       }
//     }, IDS.lyrTargets);


//     ensureLayer(map, {
//       id: IDS.lyrTargets,
//       type: 'symbol',
//       source: IDS.srcTargets,
//       filter: ['!=', ['get', 'icon'], null],
//       layout: {
//         'icon-image': ['get', 'icon'],
//         'icon-size': ['interpolate', ['linear'], ['zoom'], 5, 0.06, 10, 0.08, 15, 0.1],
//         'icon-allow-overlap': true,
//         'icon-rotation-alignment': 'map',
//         'icon-rotate': ['get', 'heading']
//       },
//       paint: {
//         'icon-opacity': ['case', ['==', ['get', 'status'], 'disconnected'], 0.5, 1]
//       }
//     });

//     ensureLayer(map, {
//       id: IDS.lyrAssignLines,
//       type: 'line',
//       source: IDS.srcAssignLines,
//       paint: {
//         'line-color': 'black', 'line-width': 2, 'line-dasharray': [2, 6]
//       }
//     });

//     ensureLayer(map, {
//       id: IDS.lyrLocks,
//       type: 'symbol',
//       source: IDS.srcLocks,
//       layout: {
//         'icon-image': IDS.imgLock,
//         'icon-size': ['interpolate', ['linear'], ['zoom'], 5, 0.06, 10, 0.08, 15, 0.1],
//         'icon-allow-overlap': true
//       }
//     });

//     try {
//       const layers = map.getStyle()?.layers || [];
//       const lastId = layers[layers.length - 1]?.id;
//       if (lastId && lastId !== IDS.lyrLocks) map.moveLayer(IDS.lyrLocks, lastId);
//     } catch { }

//     initializedRef.current = true;
//   };

//   const pushData = () => {
//     if (!isMapReady(map) || !initializedRef.current) return;

//     const targetsSrc = map.getSource?.(IDS.srcTargets);
//     const trailsSrc = map.getSource?.(IDS.srcTrails);
//     const assignSrc = map.getSource?.(IDS.srcAssignLines);
//     const locksSrc = map.getSource?.(IDS.srcLocks);
//     if (!targetsSrc?.setData || !trailsSrc?.setData || !assignSrc?.setData || !locksSrc?.setData) return;

//     // --- Targets ---
//     const targetFeatures = targets.allIds.map(id => {
//       const t = targets.byId[id];
//       if (!t || !t.coordinates || isNaN(t.coordinates.lng) || isNaN(t.coordinates.lat)) return null;

//       const color = t.friend ? 'green' : 'red';
//       const type = t.type === 'uav' ? 'uav' : 'plane';
//       const iconName = `${type}_${color}`;

//       let iconProp: string | null = null;
//       if (loadedIconNamesRef.current.has(iconName)) {
//         iconProp = iconName;
//       } else if (map.hasImage?.(iconName)) {
//         loadedIconNamesRef.current.add(iconName);
//         iconProp = iconName;
//       } else {
//         iconProp = null; // ← fallback circle
//       }

//       const now = Date.now();
//       const inactive = (now - (t.lastUpdate || 0)) > 30000 && !t.isDestroyed;
//       const status = inactive ? 'disconnected' : 'active';

//       return {
//         type: 'Feature',
//         geometry: { type: 'Point', coordinates: [t.coordinates.lng, t.coordinates.lat] },
//         properties: {
//           id: t.id,
//           heading: t.heading || 0,
//           friend: t.friend,
//           status,
//           icon: iconProp,
//           isDestroyed: !!t.isDestroyed,
//           isRecommended: t.isRecommended
//         }
//       };
//     }).filter(Boolean) as any[];

//     const targetsFC = { type: 'FeatureCollection', features: targetFeatures };
//     const tHash = JSON.stringify(targetsFC);
//     if (tHash !== lastTargetsHashRef.current) {
//       targetsSrc.setData(targetsFC);
//       lastTargetsHashRef.current = tHash;
//     }

//     const trailFeatures = targets.allIds.map(id => {
//       const t = targets.byId[id];
//       if (!t?.trail || t.trail.length < 2) return null;
//       const pts = t.trail.filter(p => p && !isNaN(p.lng) && !isNaN(p.lat));
//       if (pts.length < 2) return null;
//       return {
//         type: 'Feature',
//         geometry: { type: 'LineString', coordinates: pts.map(p => [p.lng, p.lat]) },
//         properties: { id: t.id, friend: t.friend }
//       };
//     }).filter(Boolean) as any[];

//     const trailsFC = { type: 'FeatureCollection', features: trailFeatures };
//     const trHash = JSON.stringify(trailsFC);
//     if (trHash !== lastTrailsHashRef.current) {
//       trailsSrc.setData(trailsFC);
//       lastTrailsHashRef.current = trHash;
//     }

//     // --- Assignment lines (אם בשימוש) ---
//     const jeep = myPosition?.coordinates;
//     const assignFeatures = (jeep ? targets.allIds
//       .filter(id => targets.byId[id]?.isAssigned)
//       .map(id => {
//         const t = targets.byId[id]!;
//         return t?.coordinates ? {
//           type: 'Feature',
//           geometry: { type: 'LineString', coordinates: [[jeep.lng, jeep.lat], [t.coordinates.lng, t.coordinates.lat]] },
//           properties: { id: t.id }
//         } : null;
//       }).filter(Boolean) : []) as any[];

//     const assignFC = { type: 'FeatureCollection', features: assignFeatures };
//     const aHash = JSON.stringify(assignFC);
//     if (aHash !== lastAssignHashRef.current) {
//       assignSrc.setData(assignFC);
//       lastAssignHashRef.current = aHash;
//     }

//     // --- Locks (אם בשימוש) ---
//     const lockFeatures = (jeep ? targets.allIds
//       .filter(id => targets.byId[id]?.isLocked)
//       .map(id => {
//         const t = targets.byId[id]!;
//         const midLng = (jeep.lng + t.coordinates.lng) / 2;
//         const midLat = (jeep.lat + t.coordinates.lat) / 2;
//         return {
//           type: 'Feature',
//           geometry: { type: 'Point', coordinates: [midLng, midLat] },
//           properties: { id: t.id }
//         };
//       }).filter(Boolean) : []) as any[];

//     const locksFC = { type: 'FeatureCollection', features: lockFeatures };
//     const lHash = JSON.stringify(locksFC);
//     if (lHash !== lastLocksHashRef.current) {
//       locksSrc.setData(locksFC);
//       lastLocksHashRef.current = lHash;
//     }
//   };


//   useEffect(() => {
//     if (!map) return;

//     const kick = () => {
//       if (!isMapReady(map)) return;
//       initializeLayers();
//       pushData();
//     };

//     if (isMapReady(map)) {
//       kick();
//     } else {
//       map.once?.('load', kick);
//     }

//     const onStyle = () => {
//       if (reinitScheduledRef.current) return;
//       reinitScheduledRef.current = true;
//       reinitTimerRef.current = window.setTimeout(() => {
//         reinitScheduledRef.current = false;
//         initializedRef.current = false;
//         initializeLayers();
//         pushData();
//       }, 120);
//     };

//     map.on?.('styledata', onStyle);
//     mapService?.onStyleChanged?.(onStyle);

//     return () => {
//       map.off?.('styledata', onStyle);
//       if (reinitTimerRef.current) {
//         clearTimeout(reinitTimerRef.current);
//         reinitTimerRef.current = null;
//       }
//     };
//   }, [map]);

//   useEffect(() => {
//     pushData();
//   }, [targets.byId, targets.allIds, myPosition]);

//   return null;
// };

// export default LayerManager;


// import React, { useEffect, useMemo, useRef } from 'react';
// import { useAppSelector } from '../../../../hooks/useAppSelector';

// type MLMap = any;

// interface LayerManagerProps {
//   map: MLMap;
//   mapService?: { onStyleChanged?: (cb: () => void) => void };
// }

// const isMapReady = (map: MLMap) =>
//   !!map && typeof map.isStyleLoaded === 'function' && map.isStyleLoaded();

// const ensureSource = (map: MLMap, id: string, def: any) => {
//   if (!map.getSource?.(id)) map.addSource(id, def);
// };

// const ensureLayer = (map: MLMap, layerDef: any, beforeId?: string) => {
//   if (!map.getLayer?.(layerDef.id)) map.addLayer(layerDef, beforeId);
// };

// const LayerManager: React.FC<LayerManagerProps> = ({ map, mapService }) => {
//   const targets = useAppSelector(s => s.targets);
//   const myPosition = useAppSelector(s => s.myPosition);

//   const initializedRef = useRef(false);
//   const iconsLoadAttemptRef = useRef(0);
//   const maxIconLoadAttempts = 3;

//   const IDS = useMemo(() => ({
//     srcTargets: 'targets',
//     srcTrails: 'targets-trails',
//     srcAssignArrows: 'target-arrows',
//     lyrTrails: 'targets-trails-layer',
//     lyrCircleFallback: 'targets-circle-layer',
//     lyrTargets: 'targets-layer',
//     lyrAssignArrows: 'target-arrows-layer',
//     lyrRedRing: 'targets-red-ring-layer',
//   }), []);

//   const initializeLayers = async () => {
//     console.log('🎯 LayerManager initializeLayers called:', {
//       mapReady: isMapReady(map),
//       initialized: initializedRef.current
//     });

//     if (!isMapReady(map) || initializedRef.current) return;

//     console.log('🎯 LayerManager: Initializing layers...');

//     if (iconsLoadAttemptRef.current < maxIconLoadAttempts) {
//       iconsLoadAttemptRef.current++;
//       console.log(`🎯 LayerManager: Loading SVG icons (attempt ${iconsLoadAttemptRef.current}/${maxIconLoadAttempts})...`);

//       try {
//         const svgIcons = [
//           { type: 'drone', file: 'drone.svg' },
//           { type: 'plane', file: 'plane.svg' },
//           { type: 'unknown', file: 'unknown.svg' }
//         ];

//         for (const icon of svgIcons) {
//           try {
//             const response = await fetch(`/icons/targets/${icon.file}`);
//             if (!response.ok) {
//               console.warn(`⚠️ SVG not found: ${icon.file}`);
//               continue;
//             }

//             let svgText = await response.text();

//             if (!svgText.includes('fill=')) {
//               svgText = svgText.replace(/<path/g, '<path fill="currentColor"');
//             }

//             const friendlySvg = svgText
//               .replace(/fill="[^"]*"/g, 'fill="#34a847"')
//               .replace(/stroke="[^"]*"/g, 'stroke="#34a847"')
//               .replace(/fill:([^;]*);/g, 'fill:#34a847;');

//             const hostileSvg = svgText
//               .replace(/fill="[^"]*"/g, 'fill="#EF4444"')
//               .replace(/stroke="[^"]*"/g, 'stroke="#EF4444"')
//               .replace(/fill:([^;]*);/g, 'fill:#EF4444;');

//             const friendlyImg = new Image();
//             const hostileImg = new Image();

//             friendlyImg.onload = () => {
//               try {
//                 map.addImage(`${icon.type}_friendly`, friendlyImg);
//                 console.log(`✅ Loaded ${icon.type}_friendly`);
//               } catch (e) {
//                 console.warn(`⚠️ Failed to add ${icon.type}_friendly:`, e);
//               }
//             };

//             hostileImg.onload = () => {
//               try {
//                 map.addImage(`${icon.type}_hostile`, hostileImg);
//                 console.log(`✅ Loaded ${icon.type}_hostile`);
//               } catch (e) {
//                 console.warn(`⚠️ Failed to add ${icon.type}_hostile:`, e);
//               }
//             };

//             friendlyImg.src = 'data:image/svg+xml;base64,' + btoa(friendlySvg);
//             hostileImg.src = 'data:image/svg+xml;base64,' + btoa(hostileSvg);

//           } catch (error) {
//             console.warn(`⚠️ Failed to process ${icon.file}:`, error);
//           }
//         }
//       } catch (error) {
//         console.warn('⚠️ SVG loading failed:', error);
//       }
//     } else {
//       console.log(`🎯 LayerManager: Skipping icon loading - max attempts (${maxIconLoadAttempts}) reached`);
//     }

//     console.log('🎯 LayerManager: Adding sources...');
//     ensureSource(map, IDS.srcTargets, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
//     ensureSource(map, IDS.srcTrails, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
//     ensureSource(map, IDS.srcAssignArrows, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
//     ensureSource(map, 'arrow-heads', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
//     ensureSource(map, 'arrow-tips', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });

//     console.log('🎯 LayerManager: Adding layers...');

//     ensureLayer(map, {
//       id: IDS.lyrTrails,
//       type: 'line',
//       source: IDS.srcTrails,
//       paint: {
//         'line-color': ['case', ['==', ['get', 'friend'], true], '#34a847', '#EF4444'],
//         'line-width': ['interpolate', ['linear'], ['zoom'], 5, 2, 10, 3, 15, 4],
//         'line-opacity': 0.9,
//         'line-dasharray': [0.5, 1.5]
//       }
//     });

//     ensureLayer(map, {
//       id: IDS.lyrCircleFallback,
//       type: 'circle',
//       source: IDS.srcTargets,
//       filter: ['==', ['get', 'iconName'], null],
//       paint: {
//         'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 8, 10, 12, 15, 16],
//         'circle-color': ['case',
//           ['==', ['get', 'status'], 'disconnected'], '#808080',
//           ['==', ['get', 'friend'], true], '#34a847',
//           '#EF4444'
//         ],
//         'circle-stroke-color': '#FFFFFF',
//         'circle-stroke-width': 3,
//         'circle-opacity': 1
//       }
//     });

//     ensureLayer(map, {
//       id: IDS.lyrRedRing,
//       type: 'circle',
//       source: IDS.srcTargets,
//       filter: ['any', ['==', ['get', 'isRecommended'], true], ['==', ['get', 'isAssigned'], true]],
//       paint: {
//         'circle-color': 'rgba(0,0,0,0)',
//         'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 5, 2.5, 10, 3.5, 15, 4.5],
//         'circle-stroke-color': [
//           'case',
//           ['==', ['get', 'isAssigned'], true], '#ff2b2b',
//           ['==', ['get', 'isRecommended'], true], '#ff8c00',
//           '#ff2b2b'
//         ],
//         'circle-stroke-opacity': 0.7,
//         'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 15, 10, 25, 15, 35]
//       }
//     }, IDS.lyrTargets);

//     ensureLayer(map, {
//       id: IDS.lyrTargets,
//       type: 'symbol',
//       source: IDS.srcTargets,
//       filter: ['!=', ['get', 'iconName'], null],
//       layout: {
//         'icon-image': ['get', 'iconName'],
//         'icon-size': ['interpolate', ['linear'], ['zoom'], 5, 0.05, 10, 0.07, 15, 0.09],
//         'icon-allow-overlap': true,
//         'icon-rotation-alignment': 'map',
//         'icon-rotate': ['get', 'heading']
//       },
//       paint: {
//         'icon-opacity': 1
//       }
//     });

//     ensureLayer(map, {
//       id: IDS.lyrAssignArrows,
//       type: 'line',
//       source: IDS.srcAssignArrows,
//       paint: {
//         'line-color': '#ff4444',
//         'line-width': ['interpolate', ['linear'], ['zoom'], 5, 2, 10, 3, 15, 4],
//         'line-opacity': 0.8
//       }
//     });

//     ensureLayer(map, {
//       id: 'arrow-tips-layer',
//       type: 'line',
//       source: 'arrow-tips',
//       paint: {
//         'line-color': '#ff4444',
//         'line-width': ['interpolate', ['linear'], ['zoom'], 5, 2, 10, 3, 15, 4],
//         'line-opacity': 0.8
//       }
//     });

//     initializedRef.current = true;
//     console.log('🎯 LayerManager: Layers initialized successfully!');
//   };

//   const calculateBearing = (from: { lng: number, lat: number }, to: { lng: number, lat: number }): number => {
//     const dLng = (to.lng - from.lng) * Math.PI / 180;
//     const lat1 = from.lat * Math.PI / 180;
//     const lat2 = to.lat * Math.PI / 180;

//     const y = Math.sin(dLng) * Math.cos(lat2);
//     const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

//     const bearing = Math.atan2(y, x) * 180 / Math.PI;
//     return (bearing + 360) % 360;
//   };

//   const getPointBeforeTarget = (from: { lng: number, lat: number }, to: { lng: number, lat: number }, distanceMeters: number = 200) => {
//     const distanceDegrees = distanceMeters / 111000;
//     const totalDistance = Math.sqrt(Math.pow(to.lng - from.lng, 2) + Math.pow(to.lat - from.lat, 2));
//     const ratio = Math.max(0, (totalDistance - distanceDegrees) / totalDistance);

//     return {
//       lng: from.lng + (to.lng - from.lng) * ratio,
//       lat: from.lat + (to.lat - from.lat) * ratio
//     };
//   };

//   const pushData = () => {
//     console.log('🎯 LayerManager pushData called:', {
//       mapReady: isMapReady(map),
//       initialized: initializedRef.current,
//       targetsCount: targets.allIds.length
//     });

//     if (!isMapReady(map) || !initializedRef.current) return;

//     const targetsSrc = map.getSource?.(IDS.srcTargets);
//     const trailsSrc = map.getSource?.(IDS.srcTrails);
//     const assignSrc = map.getSource?.(IDS.srcAssignArrows);
//     const arrowHeadsSrc = map.getSource?.('arrow-heads');
//     if (!targetsSrc?.setData || !trailsSrc?.setData || !assignSrc?.setData || !arrowHeadsSrc?.setData) return;

//     console.log('🎯 LayerManager: Processing targets:', targets.allIds.length, targets.byId);

//     const targetFeatures = targets.allIds.map(id => {
//       const t = targets.byId[id];
//       if (!t || !t.coordinates || isNaN(t.coordinates.lng) || isNaN(t.coordinates.lat)) return null;

//       const status = 'active';

//       let iconName = null;
//       const targetType = t.type?.toLowerCase() || 'unknown';
//       const friendStatus = t.friend ? 'friendly' : 'hostile';

//       let preferredIcon = null;
//       if (targetType === 'uav' || targetType === 'drone') {
//         preferredIcon = `drone_${friendStatus}`;
//       } else if (targetType === 'plane' || targetType === 'aircraft' || targetType === 'jet') {
//         preferredIcon = `plane_${friendStatus}`;
//       } else if (targetType === 'helicopter') {
//         preferredIcon = `helicopter_${friendStatus}`;
//       }

//       if (preferredIcon && map.hasImage?.(preferredIcon)) {
//         iconName = preferredIcon;
//       } else {
//         iconName = `unknown_${friendStatus}`;
//         if (!map.hasImage?.(iconName)) {
//           iconName = null;
//         }
//       }

//       console.log(`🎯 Target ${t.id}: type="${t.type}" -> preferred="${preferredIcon}" -> final="${iconName}"`);

//       return {
//         type: 'Feature',
//         geometry: { type: 'Point', coordinates: [t.coordinates.lng, t.coordinates.lat] },
//         properties: {
//           id: t.id,
//           heading: t.heading || 0,
//           speed: t.speed || 0,
//           friend: t.friend,
//           status,
//           type: t.type,
//           iconName: iconName,
//           isDestroyed: !!t.isDestroyed,
//           isRecommended: !!t.isRecommended,
//           isAssigned: !!t.isAssigned
//         }
//       };
//     }).filter(Boolean) as any[];

//     const targetsFC = { type: 'FeatureCollection', features: targetFeatures };
//     console.log('🎯 LayerManager: Updating targets on map:', targetFeatures.length);
//     targetsSrc.setData(targetsFC);

//     const trailFeatures = targets.allIds.map(id => {
//       const t = targets.byId[id];
//       if (!t?.trail || t.trail.length < 2) return null;
//       const pts = t.trail.filter(p => p && !isNaN(p.lng) && !isNaN(p.lat));
//       if (pts.length < 2) return null;
//       return {
//         type: 'Feature',
//         geometry: { type: 'LineString', coordinates: pts.map(p => [p.lng, p.lat]) },
//         properties: { id: t.id, friend: t.friend }
//       };
//     }).filter(Boolean) as any[];

//     const trailsFC = { type: 'FeatureCollection', features: trailFeatures };
//     trailsSrc.setData(trailsFC);

//     const jeep = myPosition?.coordinates;
//     console.log('🎯 Jeep position:', jeep);
//     console.log('🎯 Assigned targets:', targets.allIds.filter(id => targets.byId[id]?.isAssigned).map(id => ({
//       id,
//       isAssigned: targets.byId[id]?.isAssigned,
//       coordinates: targets.byId[id]?.coordinates
//     })));

//     const assignFeatures: any[] = [];
//     const arrowTipFeatures: any[] = [];

//     if (jeep) {
//       targets.allIds
//         .filter(id => targets.byId[id]?.isAssigned)
//         .forEach(id => {
//           const t = targets.byId[id]!;
//           if (!t?.coordinates) return;

//           const bearing = calculateBearing(jeep, t.coordinates);
//           const lineEndPoint = getPointBeforeTarget(jeep, t.coordinates, 200);

//           console.log(`🎯 Creating arrow for target ${id}:`, {
//             from: jeep,
//             to: t.coordinates,
//             lineEnd: lineEndPoint,
//             bearing
//           });

//           assignFeatures.push({
//             type: 'Feature',
//             geometry: {
//               type: 'LineString',
//               coordinates: [[jeep.lng, jeep.lat], [lineEndPoint.lng, lineEndPoint.lat]]
//             },
//             properties: {
//               id: t.id,
//               targetId: t.id
//             }
//           });

//           const arrowLength = 0.002;
//           const arrowAngle = 25;

//           const directionRad = Math.atan2(t.coordinates.lat - lineEndPoint.lat, t.coordinates.lng - lineEndPoint.lng);

//           const leftAngle = directionRad + (arrowAngle * Math.PI / 180);
//           const rightAngle = directionRad - (arrowAngle * Math.PI / 180);

//           const leftTip = {
//             lng: lineEndPoint.lng - arrowLength * Math.cos(leftAngle),
//             lat: lineEndPoint.lat - arrowLength * Math.sin(leftAngle)
//           };

//           const rightTip = {
//             lng: lineEndPoint.lng - arrowLength * Math.cos(rightAngle),
//             lat: lineEndPoint.lat - arrowLength * Math.sin(rightAngle)
//           };

//           arrowTipFeatures.push({
//             type: 'Feature',
//             geometry: {
//               type: 'LineString',
//               coordinates: [[lineEndPoint.lng, lineEndPoint.lat], [leftTip.lng, leftTip.lat]]
//             },
//             properties: { id: t.id + '_left' }
//           });

//           arrowTipFeatures.push({
//             type: 'Feature',
//             geometry: {
//               type: 'LineString',
//               coordinates: [[lineEndPoint.lng, lineEndPoint.lat], [rightTip.lng, rightTip.lat]]
//             },
//             properties: { id: t.id + '_right' }
//           });
//         });
//     }

//     const assignFC = { type: 'FeatureCollection', features: assignFeatures };
//     console.log('🎯 Assignment arrows updated:', assignFeatures.length, 'arrows');
//     assignSrc.setData(assignFC);

//     const arrowTipsFC = { type: 'FeatureCollection', features: arrowTipFeatures };
//     const arrowTipsSrc = map.getSource?.('arrow-tips');
//     if (arrowTipsSrc?.setData) {
//       arrowTipsSrc.setData(arrowTipsFC);
//       console.log('🎯 Arrow tips updated:', arrowTipFeatures.length, 'tips');
//     }
//   };

//   useEffect(() => {
//     if (!map) return;

//     const kick = () => {
//       if (!isMapReady(map)) return;
//       initializeLayers();
//       pushData();
//     };

//     if (isMapReady(map)) {
//       kick();
//     } else {
//       map.once?.('load', kick);
//     }

//     const onStyle = () => {
//       initializedRef.current = false;
//       setTimeout(() => {
//         initializeLayers();
//         pushData();
//       }, 120);
//     };

//     map.on?.('styledata', onStyle);
//     mapService?.onStyleChanged?.(onStyle);

//     return () => {
//       map.off?.('styledata', onStyle);
//     };
//   }, [map]);

//   useEffect(() => {
//     pushData();
//   }, [targets.byId, targets.allIds, myPosition]);

//   return null;
// };

// export default LayerManager;



import React, { useEffect, useMemo, useRef } from 'react';
import { useAppSelector } from '../../../../hooks/useAppSelector';

type MLMap = any;

interface LayerManagerProps {
  map: MLMap;
  mapService?: { onStyleChanged?: (cb: () => void) => void };
}

const isMapReady = (map: MLMap) =>
  !!map && typeof map.isStyleLoaded === 'function' && map.isStyleLoaded();

const ensureSource = (map: MLMap, id: string, def: any) => {
  if (!map.getSource?.(id)) map.addSource(id, def);
};

const ensureLayer = (map: MLMap, layerDef: any, beforeId?: string) => {
  if (!map.getLayer?.(layerDef.id)) map.addLayer(layerDef, beforeId);
};

const LayerManager: React.FC<LayerManagerProps> = ({ map, mapService }) => {
  const targets = useAppSelector(s => s.targets);
  const myPosition = useAppSelector(s => s.myPosition);

  const initializedRef = useRef(false);
  const iconsLoadAttemptRef = useRef(0);
  const maxIconLoadAttempts = 3;

  const IDS = useMemo(() => ({
    srcTargets: 'targets',
    srcTrails: 'targets-trails',
    srcAssignArrows: 'target-arrows',
    lyrTrails: 'targets-trails-layer',
    lyrCircleFallback: 'targets-circle-layer',
    lyrTargets: 'targets-layer',
    lyrAssignArrows: 'target-arrows-layer',
    lyrRedRing: 'targets-red-ring-layer',
  }), []);

  const initializeLayers = async () => {
    if (!isMapReady(map) || initializedRef.current) return;

    if (iconsLoadAttemptRef.current < maxIconLoadAttempts) {
      iconsLoadAttemptRef.current++;
      try {
        const svgIcons = [
          { type: 'drone', file: 'drone-svgrepo-com.svg' },
          { type: 'plane', file: 'plane-svgrepo-com.svg' },
          { type: 'unknown', file: 'unknown.svg' }
        ];
        for (const icon of svgIcons) {
          try {
            const res = await fetch(`/icons/targets/${icon.file}`);
            if (!res.ok) continue;
            let svgText = await res.text();
            if (!svgText.includes('fill=')) svgText = svgText.replace(/<path/g, '<path fill="currentColor"');
            const friendlySvg = svgText
              .replace(/fill="[^"]*"/g, 'fill="#34a847"')
              .replace(/stroke="[^"]*"/g, 'stroke="#34a847"')
              .replace(/fill:([^;]*);/g, 'fill:#34a847;');
            const hostileSvg = svgText
              .replace(/fill="[^"]*"/g, 'fill="#EF4444"')
              .replace(/stroke="[^"]*"/g, 'stroke="#EF4444"')
              .replace(/fill:([^;]*);/g, 'fill:#EF4444;');
            const friendlyImg = new Image();
            const hostileImg = new Image();
            friendlyImg.onload = () => { try { map.addImage(`${icon.type}_friendly`, friendlyImg); } catch { } };
            hostileImg.onload = () => { try { map.addImage(`${icon.type}_hostile`, hostileImg); } catch { } };
            friendlyImg.src = 'data:image/svg+xml;base64,' + btoa(friendlySvg);
            hostileImg.src = 'data:image/svg+xml;base64,' + btoa(hostileSvg);
          } catch { }
        }
      } catch { }
    }

    ensureSource(map, IDS.srcTargets, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    ensureSource(map, IDS.srcTrails, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    ensureSource(map, IDS.srcAssignArrows, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    ensureSource(map, 'arrow-tips', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });

    ensureLayer(map, {
      id: IDS.lyrTrails,
      type: 'line',
      source: IDS.srcTrails,
      paint: {
        'line-color': ['case', ['==', ['get', 'friend'], true], '#34a847', '#EF4444'],
        'line-width': ['interpolate', ['linear'], ['zoom'], 5, 2, 10, 3, 15, 4],
        'line-opacity': 0.9,
        'line-dasharray': [0.5, 1.5]
      }
    });

    ensureLayer(map, {
      id: IDS.lyrCircleFallback,
      type: 'circle',
      source: IDS.srcTargets,
      filter: ['==', ['get', 'iconName'], null],
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 8, 10, 12, 15, 16],
        'circle-color': ['case',
          ['==', ['get', 'status'], 'disconnected'], '#808080',
          ['==', ['get', 'friend'], true], '#34a847',
          '#EF4444'
        ],
        'circle-stroke-color': '#FFFFFF',
        'circle-stroke-width': 3,
        'circle-opacity': 1
      }
    });

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
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 15, 10, 25, 15, 35]
      }
    }, IDS.lyrTargets);

    ensureLayer(map, {
      id: IDS.lyrTargets,
      type: 'symbol',
      source: IDS.srcTargets,
      filter: ['!=', ['get', 'iconName'], null],
      layout: {
        'icon-image': ['get', 'iconName'],
        'icon-size': ['interpolate', ['linear'], ['zoom'], 5, 0.05, 10, 0.07, 15, 0.09],
        'icon-allow-overlap': true,
        'icon-rotation-alignment': 'map',
        'icon-rotate': ['get', 'heading']
      },
      paint: { 'icon-opacity': 1 }
    });

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
  };

  const getPointBeforeTarget = (from: { lng: number, lat: number }, to: { lng: number, lat: number }, distanceMeters: number = 200) => {
    const distanceDegrees = distanceMeters / 111000;
    const totalDistance = Math.sqrt(Math.pow(to.lng - from.lng, 2) + Math.pow(to.lat - from.lat, 2));
    const ratio = Math.max(0, (totalDistance - distanceDegrees) / totalDistance);
    return {
      lng: from.lng + (to.lng - from.lng) * ratio,
      lat: from.lat + (to.lat - from.lat) * ratio
    };
  };

  const pushData = () => {
    if (!isMapReady(map) || !initializedRef.current) return;

    const targetsSrc = map.getSource?.(IDS.srcTargets);
    const trailsSrc = map.getSource?.(IDS.srcTrails);
    const assignSrc = map.getSource?.(IDS.srcAssignArrows);
    if (!targetsSrc?.setData || !trailsSrc?.setData || !assignSrc?.setData) return;

    const targetFeatures = targets.allIds.map(id => {
      const t = targets.byId[id];
      if (!t || !t.coordinates || isNaN(t.coordinates.lng) || isNaN(t.coordinates.lat)) return null;

      let iconName: string | null = null;
      const targetType = t.type || 'unknown';
      const friendStatus = t.friend ? 'friendly' : 'hostile';
      let preferredIcon: string | null = null;

      if (targetType === 'uav' || targetType === 'drone') preferredIcon = `drone_${friendStatus}`;
      else if (targetType === 'plane' || targetType === 'aircraft' || targetType === 'jet') preferredIcon = `plane_${friendStatus}`;
      else if (targetType === 'helicopter') preferredIcon = `helicopter_${friendStatus}`;

      if (preferredIcon && map.hasImage?.(preferredIcon)) iconName = preferredIcon;
      else {
        const fallback = `unknown_${friendStatus}`;
        iconName = map.hasImage?.(fallback) ? fallback : null;
      }

      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [t.coordinates.lng, t.coordinates.lat] },
        properties: {
          id: t.id,
          heading: t.heading || 0,
          speed: t.speed || 0,
          friend: t.friend,
          status: 'active',
          type: t.type,
          iconName,
          isDestroyed: !!t.isDestroyed,
          isRecommended: !!t.isRecommended,
          isAssigned: !!t.isAssigned
        }
      };
    }).filter(Boolean) as any[];

    targetsSrc.setData({ type: 'FeatureCollection', features: targetFeatures });

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

    trailsSrc.setData({ type: 'FeatureCollection', features: trailFeatures });

    const jeep = myPosition?.coordinates;
    const assignFeatures: any[] = [];
    const arrowTipFeatures: any[] = [];

    if (jeep) {
      targets.allIds
        .filter(id => targets.byId[id]?.isAssigned)
        .forEach(id => {
          const t = targets.byId[id]!;
          if (!t?.coordinates) return;

          const lineEndPoint = getPointBeforeTarget(jeep, t.coordinates, 200);

          assignFeatures.push({
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: [[jeep.lng, jeep.lat], [lineEndPoint.lng, lineEndPoint.lat]] },
            properties: { id: t.id, targetId: t.id }
          });

          const arrowLength = 0.002;
          const arrowAngle = 25;
          const directionRad = Math.atan2(t.coordinates.lat - lineEndPoint.lat, t.coordinates.lng - lineEndPoint.lng);
          const leftAngle = directionRad + (arrowAngle * Math.PI / 180);
          const rightAngle = directionRad - (arrowAngle * Math.PI / 180);

          const leftTip = { lng: lineEndPoint.lng - arrowLength * Math.cos(leftAngle), lat: lineEndPoint.lat - arrowLength * Math.sin(leftAngle) };
          const rightTip = { lng: lineEndPoint.lng - arrowLength * Math.cos(rightAngle), lat: lineEndPoint.lat - arrowLength * Math.sin(rightAngle) };

          arrowTipFeatures.push({
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: [[lineEndPoint.lng, lineEndPoint.lat], [leftTip.lng, leftTip.lat]] },
            properties: { id: t.id + '_left' }
          });

          arrowTipFeatures.push({
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: [[lineEndPoint.lng, lineEndPoint.lat], [rightTip.lng, rightTip.lat]] },
            properties: { id: t.id + '_right' }
          });
        });
    }

    assignSrc.setData({ type: 'FeatureCollection', features: assignFeatures });

    const arrowTipsSrc = map.getSource?.('arrow-tips');
    if (arrowTipsSrc?.setData) {
      arrowTipsSrc.setData({ type: 'FeatureCollection', features: arrowTipFeatures });
    }
  };

  useEffect(() => {
    if (!map) return;

    const kick = () => {
      if (!isMapReady(map)) return;
      initializeLayers();
      map.once?.('idle', pushData);
    };

    if (isMapReady(map)) kick();
    else map.once?.('load', kick);

    const onStyle = () => {
      initializedRef.current = false;
      setTimeout(() => {
        initializeLayers();
        map.once?.('idle', pushData);
      }, 250);
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

  return null;
};

export default LayerManager;





// Status ring - orange for recommended, red for assigned
    // ensureLayer(map, {
    //   id: IDS.lyrRedRing,
    //   type: 'circle',
    //   source: IDS.srcTargets,
    //   filter: ['any', ['==', ['get', 'isRecommended'], true], ['==', ['get', 'isAssigned'], true]],
    //   paint: {
    //     'circle-color': 'rgba(0,0,0,0)',
    //     'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 5, 2.5, 10, 3.5, 15, 4.5],
    //     'circle-stroke-color': [
    //       'case',
    //       ['==', ['get', 'isAssigned'], true], '#ff2b2b',
    //       ['==', ['get', 'isRecommended'], true], '#ff8c00',
    //       '#ff2b2b'
    //     ],
    //     'circle-stroke-opacity': 0.7,
    //     'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 20, 10, 30, 15, 40]
    //   }
    // });