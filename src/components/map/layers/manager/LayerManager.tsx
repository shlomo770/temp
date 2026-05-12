import React, { useEffect, useMemo, useRef, useCallback, useState } from 'react';
import { useAppSelector } from '../../../../hooks/useAppSelector';
import { RedRoundButton } from '../../../ui/RedRoundButton';
type MLMap = any;
interface LayerManagerProps {
  map: MLMap;
  mapService?: { onStyleChanged?: (cb: () => void) => void };
  onAbort: (targetId: string) => void;
}

const isMapReady = (map: MLMap) =>
  !!map && typeof map.isStyleLoaded === 'function' && map.isStyleLoaded();

const ensureSource = (map: MLMap, id: string, def: any) => {
  if (!map.getSource?.(id)) {
    map.addSource(id, def);
  }
};

const ensureLayer = (map: MLMap, layerDef: any, beforeId?: string) => {
  if (!map.getLayer?.(layerDef.id)) {
    map.addLayer(layerDef, beforeId);
  }
};

const LayerManager: React.FC<LayerManagerProps> = ({ map, mapService, onAbort }) => {
  const targets = useAppSelector(s => s.targets);
  const myPosition = useAppSelector(s => s.myPosition);
  const initializedRef = useRef(false);
  const IDS = useMemo(() => ({
    srcTargets: "targets",
    srcTrails: "targets-trails",
    srcAssign: "target-arrows",
    srcTips: "arrow-tips",
    lyrTargets: "targets-layer",
    lyrTrails: "targets-trails-layer",
    lyrRingRed: "targets-red-ring-layer",
    lyrRingRec: "targets-recommended-ring",
    lyrAssigned: "target-arrows-layer",
    lyrAllocated: "target-arrows-layer-allocated",
    lyrLocked: "target-arrows-locked",
    lyrDestroyed: "targets-destroyed-layer",
  }), []);

  const loadPngIcons = useCallback(async () => {
    if (!map) return;
    const iconDefs = [
      "airplaneLarge_friendly",
      "airplaneLarge_hostile",
      "airplaneMedium_friendly",
      "airplaneMedium_hostile",
      "droneLarge_friendly",
      "droneLarge_hostile",
      "droneMedium_friendly",
      "droneMedium_hostile",
      "helicopter_friendly",
      "helicopter_hostile",
      "unknown_friendly",
      "unknown_hostile",
    ];

    const loadOne = (name: string) =>
      new Promise<void>(resolve => {
        const url = `/icons/targets/${name}.png`;
        map.loadImage(url, (err: any, img: any) => {
          if (!err && img && !map.hasImage(name)) {
            map.addImage(name, img);
          }
          resolve();
        });
      });
    await Promise.all(iconDefs.map(loadOne));
  }, [map]);

  useEffect(() => {
    if (!map) return;
    const LYR = "targets-recommended-ring";
    let visible = true;
    const interval = setInterval(() => {
      try {
        if (!map.getLayer(LYR)) return;
        map.setPaintProperty(
          LYR,
          "circle-stroke-opacity",
          visible ? 0.9 : 0.2
        );
        visible = !visible;
      } catch { }
    }, 600); 
    return () => clearInterval(interval);
  }, [map]);

  const initialize = useCallback(async () => {
    if (!map || !isMapReady(map) || initializedRef.current) return;
    await loadPngIcons();
    ensureSource(map, IDS.srcTargets, {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] }
    });

    ensureSource(map, IDS.srcTrails, {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] }
    });

    ensureSource(map, IDS.srcAssign, {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] }
    });

    ensureSource(map, IDS.srcTips, {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] }
    });

    ensureLayer(map, {
      id: IDS.lyrTrails,
      type: "line",
      source: IDS.srcTrails,
      paint: {
        "line-color": "#FFFFFF",
        "line-width": ["interpolate", ["linear"], ["zoom"], 5, 2, 10, 3, 15, 4],
        "line-opacity": 0.9,
        "line-dasharray": [1, 1]
      }
    });

    ensureLayer(map, {
      id: IDS.lyrTargets,
      type: "symbol",
      source: IDS.srcTargets,
      layout: {
        "icon-image": ["get", "iconName"],
        "icon-size": ["interpolate", ["linear"], ["zoom"], 5, 0.04, 10, 0.07, 15, 0.09],
        "icon-allow-overlap": true,
        "icon-rotation-alignment": "map",
        "icon-rotate": ["get", "heading"],
      }
    });

    ensureLayer(map, {
      id: IDS.lyrRingRed,
      type: "circle",
      source: IDS.srcTargets,
      filter: ["any", ["==", ["get", "isAssigned"], true], ["==", ["get", "isLocked"], true]],
      paint: {
        "circle-stroke-color": "#dd4141",
        "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 5, 2.5, 10, 3.5, 15, 4.5],
        "circle-stroke-opacity": 0.9,
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 20, 10, 30, 15, 40],
        "circle-color": "rgba(0,0,0,0)"
      }
    });

    ensureLayer(map, {
      id: IDS.lyrRingRec,
      type: "circle",
      source: IDS.srcTargets,
      filter: [
        'all',
        ['==', ['get', 'isRecommended'], true],
        ['==', ['get', 'isAssigned'], false],
        ['==', ['get', 'isLocked'], false],
      ],
      paint: {
        "circle-stroke-color": "#fff400",
        "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 5, 2.5, 10, 3.5, 15, 4.5],
        "circle-stroke-opacity": 0.9,
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 20, 10, 30, 15, 40],
        "circle-color": "rgba(0,0,0,0)"
      }
    });

    ensureLayer(map, {
      id: IDS.lyrAssigned,
      type: "line",
      source: IDS.srcAssign,
      filter: ["==", ["get", "isLocked"], true],
      paint: {
        "line-color": "#ff2b2b",
        "line-width": 2,
        "line-dasharray": [1, 0],
      }
    }, IDS.lyrTargets);

    ensureLayer(map, {
      id: IDS.lyrAllocated,
      type: "line",
      source: IDS.srcAssign,
      filter: ["==", ["get", "isAllocated"], true],
      paint: {
        "line-color": "#58e1db",
        "line-width": 2,
        "line-dasharray": [4, 4],
      }
    }, IDS.lyrTargets);

    ensureLayer(map, {
      id: IDS.lyrLocked,
      type: "line",
      source: IDS.srcAssign,
      filter: ["all", ["==", ["get", "isAssigned"], true], ["!=", ["get", "isLocked"], true]],
      paint: {
        "line-color": "#ff2b2b",
        "line-width": 2,
        "line-dasharray": [4, 4],
      }
    }, IDS.lyrTargets);

    map.loadImage("/icons/x.png", (err: any, img: any) => {
      if (!err && img && !map.hasImage("x-icon")) {
        map.addImage("x-icon", img);
        ensureLayer(map, {
          id: IDS.lyrDestroyed,
          type: "symbol",
          source: IDS.srcTargets,
          filter: ["==", ["get", "isDestroyed"], true],
          layout: {
            "icon-image": "x-icon",
            "icon-size": 0.25,
            "icon-allow-overlap": true
          }
        });
      }
    });
    initializedRef.current = true;
  }, [IDS, loadPngIcons, map]);

  const pushData = useCallback(() => {
    if (!map || !initializedRef.current) return;
    const srcTargets = map.getSource(IDS.srcTargets);
    const srcTrails = map.getSource(IDS.srcTrails);
    const srcAssign = map.getSource(IDS.srcAssign);
    const srcTips = map.getSource(IDS.srcTips);
    if (!srcTargets || !srcTrails || !srcAssign || !srcTips) return;
    const targetFeatures = targets.allIds.map(id => {
      const t = targets.byId[id];
      if (!t || !t.coordinates) return null;
      const base = t.type || "unknown";
      const iconName = `${base}_${t.friend ? "friendly" : "hostile"}`;
      return {
        type: "Feature",
        geometry: { type: "Point", coordinates: [t.coordinates.lng, t.coordinates.lat] },
        properties: {
          id: t.id,
          heading: t.heading || 0,
          iconName,
          isRecommended: t.isRecommended,
          isAssigned: t.isAssigned,
          isLocked: t.isLocked,
          isAllocated: t.status === "allocated",
          isDestroyed: t.status === "destroyed",
        }
      };
    }).filter(Boolean);
    srcTargets.setData({
      type: "FeatureCollection",
      features: targetFeatures
    });

    const trailFeatures: any[] = [];
    targets.allIds.forEach(id => {
      const t = targets.byId[id];
      if (!t?.trail || t.trail.length < 2) return;
      trailFeatures.push({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: t.trail.map(p => [p.lng, p.lat])
        },
        properties: { id: t.id }
      });
    });

    srcTrails.setData({
      type: "FeatureCollection",
      features: trailFeatures
    });

    if (!myPosition?.coordinates) {
      srcAssign.setData({ type: "FeatureCollection", features: [] });
      srcTips.setData({ type: "FeatureCollection", features: [] });
      return;
    }
    const jeep = myPosition.coordinates;
    const assignFeatures: any[] = [];
    const tipFeatures: any[] = [];
    const getPointBefore = (from: any, to: any, meters = 200) => {
      const deg = meters / 111000;
      const dx = to.lng - from.lng;
      const dy = to.lat - from.lat;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < deg) return { lng: to.lng, lat: to.lat };
      const r = (dist - deg) / dist;
      return { lng: from.lng + dx * r, lat: from.lat + dy * r };
    };

    targets.allIds.forEach(id => {
      const t = targets.byId[id];
      if (!t?.coordinates) return;

      if (
        t.isAssigned ||
        t.isLocked ||
        t.status === "allocated" ||
        t.status === "destroyed"
      ) {
        const end = getPointBefore(jeep, t.coordinates);
        assignFeatures.push({
          type: "Feature",
          geometry: { type: "LineString", coordinates: [[jeep.lng, jeep.lat], [end.lng, end.lat]] },
          properties: {
            id: t.id,
            isAssigned: t.isAssigned,
            isLocked: t.isLocked,
            isAllocated: t.status === "allocated",
            isDestroyed: t.status === "destroyed"
          }
        });
        const len = 0.002;
        const ang = 25 * Math.PI / 180;
        const dir = Math.atan2(t.coordinates.lat - end.lat, t.coordinates.lng - end.lng);
        const left = { lng: end.lng - len * Math.cos(dir + ang), lat: end.lat - len * Math.sin(dir + ang) };
        const right = { lng: end.lng - len * Math.cos(dir - ang), lat: end.lat - len * Math.sin(dir - ang) };
        tipFeatures.push({
          type: "Feature",
          geometry: { type: "LineString", coordinates: [[end.lng, end.lat], [left.lng, left.lat]] },
          properties: { id: `${t.id}_left` }
        });
        tipFeatures.push({
          type: "Feature",
          geometry: { type: "LineString", coordinates: [[end.lng, end.lat], [right.lng, right.lat]] },
          properties: { id: `${t.id}_right` }
        });
      }
    });
    srcAssign.setData({ type: "FeatureCollection", features: assignFeatures });
    srcTips.setData({ type: "FeatureCollection", features: tipFeatures });
  }, [map, IDS, targets, myPosition]);

  useEffect(() => {
    if (!map) return;
    const start = () => {
      if (!isMapReady(map)) return;
      initialize();
      pushData();
    };
    if (isMapReady(map)) start();
    else map.once("load", start);
    map.on("styledata", start);
    mapService?.onStyleChanged?.(start);
    return () => {
      map.off("styledata", start);
    };
  }, [map, initialize, pushData, mapService]);

  useEffect(() => {
    pushData();
  }, [pushData, targets.byId, targets.allIds, myPosition]);

  const [buttons, setButtons] =
    useState<Record<string, { x: number; y: number }>>({});
  const updateButtonPos = useCallback(() => {
    if (!map) return;
    const result: any = {};
    const arr = targets.allIds.map(id => targets.byId[id]);
    arr.forEach(t => {
      if (
        t?.coordinates &&
        (t.isAssigned ||
          t.status === "allocated" ||
          t.status === "designated" ||
          t.status === "track" ||
          t.status === "arm")
      ) {
        const p = map.project([t.coordinates.lng, t.coordinates.lat]);
        result[t.id] = { x: p.x - 22.5, y: p.y + 30 };
      }
    });
    setButtons(result);
  }, [map, targets.allIds, targets.byId]);

  useEffect(() => {
    if (!map) return;
    updateButtonPos();
    map.on("move", updateButtonPos);
    map.on("zoom", updateButtonPos);
    return () => {
      map.off("move", updateButtonPos);
      map.off("zoom", updateButtonPos);
    };
  }, [map, updateButtonPos]);

  const assignedTargets = targets.allIds
    .map(id => targets.byId[id])
    .filter(t =>
      t?.coordinates &&
      (t.isAssigned ||
        t.status === "allocated" ||
        t.status === "designated" ||
        t.status === "track" ||
        t.status === "arm")
    );
  return (
    <>
      {assignedTargets.map(t => {
        const pos = buttons[t.id];
        if (!pos) return null;
        return (
          <div
            key={t.id}
            className="fixed pointer-events-auto"
            style={{ left: pos.x, top: pos.y }}
          >
            <RedRoundButton
              onClick={() => onAbort(t.id)}
              size={45}
              label="ביטול"
            />
          </div>
        );
      })}
    </>
  );
};

export default LayerManager;