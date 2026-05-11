import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useAppSelector } from '../../../../hooks/useAppSelector';
import { bearing } from '../../../../utils/geometry';

type MLMap = any;

const isMapReady = (map: MLMap) => !!map && typeof map.isStyleLoaded === 'function' && map.isStyleLoaded();
const ensureSource = (map: MLMap, id: string, def: any) => { if (!map.getSource?.(id)) { map.addSource(id, def); } };
const ensureLayer = (map: MLMap, layerDef: any) => { if (!map.getLayer?.(layerDef.id)) { map.addLayer(layerDef); } };

const MissileLayer = ({ map }: { map: MLMap }) => {
  const missiles = useAppSelector(s => s.missiles);
  const initializedRef = useRef(false);
  const IDS = useMemo(() => ({
    src: 'missiles-source',
    srcTrail: 'missiles-trail-source',
    lyr: 'missiles-layer',
    halo: 'missiles-halo',
    trail: 'missiles-trail',
    headSrc: 'missiles-head-source',
    head: 'missiles-head',
    dirSrc: 'missiles-dir-source',
    dirLyr: 'missiles-dir-layer',
    labelLyr: 'missiles-label-layer',
  }), []);

  const initialize = useCallback(() => {
    if (!map || !isMapReady(map)) return;
    if (map.getLayer?.(IDS.lyr)) {
      initializedRef.current = true;
      return;
    }
    ensureSource(map, IDS.src, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
    ensureSource(map, IDS.srcTrail, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
    ensureSource(map, IDS.dirSrc, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
    ensureSource(map, IDS.headSrc, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
    ensureLayer(map, {
      id: IDS.trail,
      type: 'circle',
      source: IDS.srcTrail,
      paint: {
        'circle-color': '#ff6b6b',
        'circle-radius': 2,
        'circle-opacity': 0.8,
        'circle-blur': 0.2,
      },
    });
    ensureLayer(map, {
      id: IDS.halo,
      type: 'circle',
      source: IDS.src,
      paint: {
        'circle-color': '#ff3b3b',
        'circle-radius': 14,
        'circle-opacity': 0.25,
        'circle-blur': 0.8,
      },
    });
    ensureLayer(map, {
      id: IDS.lyr,
      type: 'circle',
      source: IDS.src,
      paint: {
        'circle-color': '#ff3b3b',
        'circle-radius': 7,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
        'circle-opacity': 0.9,
      },
    });
    ensureLayer(map, {
      id: IDS.head,
      type: 'symbol',
      source: IDS.headSrc,
      layout: {
        'text-field': '^',
        'text-font': ['Open Sans Semibold'],
        'text-size': 24,
        'text-allow-overlap': true,
        'text-ignore-placement': true,
        'text-rotation-alignment': 'map',
        'text-rotate': ['get', 'heading'],
      },
      paint: {
        'text-color': '#ffffff',
        'text-opacity': 0.95,
        'text-halo-color': '#000000',
        'text-halo-width': 1,
      },
    });
    ensureLayer(map, {
      id: IDS.dirLyr,
      type: 'line',
      source: IDS.dirSrc,
      paint: {
        'line-color': '#22c55e',
        'line-width': 2,
        'line-dasharray': [2, 2],
      },
    });
    ensureLayer(map, {
      id: IDS.labelLyr,
      type: 'symbol',
      source: IDS.src,
      layout: {
        'text-field': ['get', 'label'],
        'text-font': ['Open Sans Semibold'],
        'text-size': 12,
        'text-offset': [0, -1.2],
        'text-anchor': 'top',
        'text-allow-overlap': false,
        'text-ignore-placement': false,
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': '#000000',
        'text-halo-width': 1,
      },
    });
    initializedRef.current = true;
  }, [IDS, map]);

  const pushData = useCallback(() => {
    if (!map) return;
    if (!initializedRef.current) initialize();
    const src = map.getSource?.(IDS.src);
    const srcTrail = map.getSource?.(IDS.srcTrail);
    const srcDir = map.getSource?.(IDS.dirSrc);
    const srcHead = map.getSource?.(IDS.headSrc);
    if (!src || !srcTrail || !srcDir || !srcHead) return;
    const features = missiles.allIds.map(id => {
      const m = missiles.byId[id];
      if (!m?.coordinates) return null;
      const speedNum = typeof m.speed === 'number' && Number.isFinite(m.speed) ? m.speed : 0;
      const label = `${speedNum.toFixed(1)} kts`;
      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [m.coordinates.lng, m.coordinates.lat],
        },
        properties: { id: m.id, label },
      };
    }).filter(Boolean);
    src.setData({ type: 'FeatureCollection', features });
    const trailFeatures = missiles.allIds.flatMap(id => {
      const m = missiles.byId[id];
      if (!m?.trail || m.trail.length < 2) return [];
      return m.trail.map((p, idx) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
        properties: { id: m.id, idx },
      }));
    });
    srcTrail.setData({ type: 'FeatureCollection', features: trailFeatures });
    const dirFeatures = missiles.allIds.map(id => {
      const m = missiles.byId[id];
      if (!m?.coordinates || !m?.nextCoordinates) return null;
      return {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [m.coordinates.lng, m.coordinates.lat],
            [m.nextCoordinates.lng, m.nextCoordinates.lat],
          ],
        },
        properties: { id: m.id },
      };
    }).filter(Boolean);
    srcDir.setData({ type: 'FeatureCollection', features: dirFeatures });
    const headFeatures = missiles.allIds.map(id => {
      const m = missiles.byId[id];
      if (!m?.coordinates || !m?.nextCoordinates) return null;
      const headingDeg = bearing(
        { lat: m.coordinates.lat, lng: m.coordinates.lng },
        { lat: m.nextCoordinates.lat, lng: m.nextCoordinates.lng }
      );
      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [m.nextCoordinates.lng, m.nextCoordinates.lat],
        },
        properties: { id: m.id, heading: headingDeg },
      };
    }).filter(Boolean);
    srcHead.setData({ type: 'FeatureCollection', features: headFeatures });
  }, [IDS.src, IDS.srcTrail, IDS.dirSrc, IDS.headSrc, initialize, map, missiles.allIds, missiles.byId]);

  useEffect(() => {
    if (!map) return;
    const start = () => {
      if (!isMapReady(map)) return;
      initialize();
      pushData();
    };
    if (isMapReady(map)) start();
    else map.once('load', start);
    map.on('styledata', start);
    return () => {
      map.off('styledata', start);
    };
  }, [initialize, map, pushData]);

  useEffect(() => {
    pushData();
  }, [pushData, missiles.byId, missiles.allIds]);

  useEffect(() => {
    if (!map) return;
    let visible = true;
    const interval = setInterval(() => {
      try {
        if (!map.getLayer(IDS.lyr)) return;
        map.setPaintProperty(IDS.lyr, 'circle-opacity', visible ? 0.95 : 0.3);
        map.setPaintProperty(IDS.halo, 'circle-opacity', visible ? 0.35 : 0.1);
        visible = !visible;
      } catch { }
    }, 500);
    return () => clearInterval(interval);
  }, [IDS.halo, IDS.lyr, map]);

  return null;
};

export default MissileLayer;
