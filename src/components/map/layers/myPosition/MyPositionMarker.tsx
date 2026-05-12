import React, { useEffect, useRef, useCallback } from "react";
import { useAppSelector } from "../../../../hooks/useAppSelector";

interface MyPositionMarkerProps {
  map: any;
}

const SRC_POS = "my-position";
/** עיגול רך סביב הג׳יפ — מתחת לשכבת האייקון */
const LYR_HALO = "my-position-halo-layer";
const LYR_POS = "my-position-jeep-layer";
const UPDATE_MS = 25;

const emptyFc = {
  type: "FeatureCollection",
  features: [],
};

const ensureSource = (map: any, id: string, def: any) => {
  if (!map.getSource(id)) map.addSource(id, def);
};

const ensureLayer = (map: any, def: any) => {
  if (!map.getLayer(def.id)) map.addLayer(def);
};

const loadImageOnce = (map: any, name: string, url: string) =>
  new Promise<void>((resolve) => {
    if (map.hasImage(name)) return resolve();

    map.loadImage(url, (err: any, img: any) => {
      if (!err && img && !map.hasImage(name)) {
        try {
          map.addImage(name, img);
        } catch {}
      }
      resolve();
    });
  });

const MyPositionMarker: React.FC<MyPositionMarkerProps> = ({ map }) => {
  const my = useAppSelector((s) => s.myPosition);

  const myRef = useRef(my);
  myRef.current = my;

  const lastPushTime = useRef(0);
  const initialized = useRef(false);

  const pushData = useCallback(() => {
    if (!map) return;
    if (!initialized.current) return;

    const src: any = map.getSource(SRC_POS);
    if (!src) return;

    const now = Date.now();
    if (now - lastPushTime.current < UPDATE_MS) return;
    lastPushTime.current = now;

    const pos = myRef.current;
    const lat = Number(pos?.coordinates?.lat);
    const lng = Number(pos?.coordinates?.lng);
    const heading = Number(pos?.heading ?? 0);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      src.setData(emptyFc);
      return;
    }

    src.setData({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
          properties: {
            heading: Number.isFinite(heading) ? heading : 0,
          },
        },
      ],
    });
  }, [map]);

  const initialize = useCallback(async () => {
    if (!map) return;

    if (!map.isStyleLoaded?.()) {
      map.once("idle", initialize);
      return;
    }

    ensureSource(map, SRC_POS, {
      type: "geojson",
      data: emptyFc,
    });

    await loadImageOnce(map, "jeep", "/icons/123.png");

    ensureLayer(map, {
      id: LYR_HALO,
      type: "circle",
      source: SRC_POS,
      paint: {
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          6,
          22,
          10,
          34,
          14,
          48,
          18,
          62,
        ],
        "circle-color": "#38bdf8",
        "circle-opacity": 0.2,
        "circle-blur": 0.9,
        "circle-pitch-alignment": "map",
      },
    });

    if (map.hasImage("jeep")) {
      ensureLayer(map, {
        id: LYR_POS,
        type: "symbol",
        source: SRC_POS,
        layout: {
          "icon-image": "jeep",
          "icon-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            5,
            0.2,
            10,
            0.3,
            15,
            0.4,
          ],
          "icon-rotate": ["coalesce", ["get", "heading"], 0],
          "icon-rotation-alignment": "map",
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
        },
      });
    } else {
      ensureLayer(map, {
        id: LYR_POS,
        type: "circle",
        source: SRC_POS,
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            5,
            6,
            10,
            10,
            15,
            14,
          ],
          "circle-color": "#22c55e",
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
        },
      });
    }

    try {
      if (map.getLayer(LYR_HALO) && map.getLayer(LYR_POS)) {
        map.moveLayer(LYR_HALO);
        map.moveLayer(LYR_POS);
      }
    } catch {}

    initialized.current = true;
    
    pushData();
  }, [map, pushData]);

  useEffect(() => {
    if (!map) return;

    let cancelled = false;
    let styleTimer: ReturnType<typeof setTimeout> | null = null;

    const initAndPush = async () => {
      await initialize();
      if (!cancelled) pushData();
    };

    const onStyleData = () => {
      if (styleTimer) clearTimeout(styleTimer);

      styleTimer = setTimeout(() => {
        styleTimer = null;

        if (!map.isStyleLoaded?.()) return;

        const hasSource = !!map.getSource(SRC_POS);
        const hasLayer = !!map.getLayer(LYR_POS) && !!map.getLayer(LYR_HALO);

        if (hasSource && hasLayer) {
          initialized.current = true;
          pushData();
          return;
        }

        initialized.current = false;
        initAndPush();
      }, 80);
    };

    initAndPush();

    map.on("styledata", onStyleData);

    return () => {
      cancelled = true;
      map.off("styledata", onStyleData);
      if (styleTimer) clearTimeout(styleTimer);
    };
  }, [map, initialize, pushData]);

  useEffect(() => {
    pushData();
  }, [pushData, my?.coordinates?.lat, my?.coordinates?.lng, my?.heading]);

  return null;
};

export default MyPositionMarker;