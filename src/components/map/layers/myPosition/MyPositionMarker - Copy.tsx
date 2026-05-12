import React, { useEffect, useRef, useCallback } from "react";
import { useAppSelector } from "../../../../hooks/useAppSelector";

interface MyPositionMarkerProps {
  map: any;
}

const SRC_POS = "my-position";
const LYR_POS = "my-position-jeep-layer";
const UPDATE_MS = 25;

const ensureSource = (map: any, id: string, def: any) => { if (!map.getSource(id)) { map.addSource(id, def) } };
const ensureLayer = (map: any, def: any) => { if (!map.getLayer(def.id)) { map.addLayer(def) } };
const loadImageOnce = (map: any, name: string, url: string) =>
  new Promise<void>((resolve) => {
    if (map.hasImage(name)) return resolve();
    map.loadImage(url, (err: any, img: any) => {
      if (!err && img) {
        try {
          if (!map.hasImage(name)) {
            map.addImage(name, img);
          }
        } catch { }
      } else if (err) {
        console.error(`Failed to load image ${name}:`, err);
      }
      resolve();
    });
  });

const MyPositionMarker: React.FC<MyPositionMarkerProps> = ({ map }) => {
  const my = useAppSelector((s) => s.myPosition);
  const lastUpdate = useRef(0);
  const initialized = useRef(false);

  const initialize = useCallback(async () => {
    if (!map) return;

    if (!map.isStyleLoaded()) {
      map.once("idle", initialize);
      return;
    }

    ensureSource(map, SRC_POS, {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });

    await loadImageOnce(map, "jeep", "/icons/VehicleTopIcon.png");
    ensureLayer(map, {
      id: LYR_POS,
      type: "symbol",
      source: SRC_POS,
      layout: {
        "icon-image": "jeep", "icon-size": ["interpolate", ["linear"], ["zoom"], 5, 0.20, 10, 0.30, 15, 0.40,],
        "icon-rotate": ["coalesce", ["get", "heading"], 0], "icon-rotation-alignment": "map", "icon-allow-overlap": true,
      },
    });

    try {
      if (map.getLayer(LYR_POS)) {
        map.moveLayer(LYR_POS);
      }
    } catch { }

    initialized.current = true;
  }, [map]);

  const pushData = useCallback(() => {
    const lat = Number(my?.coordinates?.lat);
    const lng = Number(my?.coordinates?.lng);
    const heading = Number(my?.heading || 0);
    const src: any = map.getSource(SRC_POS);
    const now = Date.now();
    lastUpdate.current = now;

    if (!map) return;
    if (!initialized.current) return;
    if (!src) return;
    if (now - lastUpdate.current < UPDATE_MS) return;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      src.setData({ type: "FeatureCollection", features: [] });
      return;
    }

    src.setData({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [lng, lat] },
          properties: { heading },
        },
      ],
    });
  }, [map, my?.coordinates?.lat, my?.coordinates?.lng, my?.heading]);

  useEffect(() => {
    if (!map) return;
    const onReady = () => {
      initialized.current = false;
      initialize();
      pushData();
    };
    initialize();
    pushData();
    map.on("idle", onReady);
    return () => {
      map.off("idle", onReady);
    };
  }, [map, initialize, pushData]);

  useEffect(() => {
    pushData();
  }, [pushData]);
  return null;
};

export default MyPositionMarker;















