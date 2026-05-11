import { useEffect, useRef } from "react";

type Props = { map: maplibregl.Map; opacity: number; color?: string; id?: string };
const ID = "dim-world-layer";
const SRC = "dim-world-layer-src";
export default function MapDimmerAuto({ map, opacity = 0, color = "#000", id = ID }: Props) {
  const inited = useRef(false);
  const last = useRef<number>(-1);
  const clamp = (n: number) => (Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0);
  const ensure = () => {
    if (!map.isStyleLoaded()) return;
    if (!map.getSource(SRC)) {
      const data = {
        type: "FeatureCollection", features: [{
          type: "Feature", properties: {}, geometry: {
            type: "Polygon", coordinates:
              [[[-179.999, -85], [-179.999, 85], [179.999, 85], [179.999, -85], [-179.999, -85]]]
          }
        }]
      } as GeoJSON.FeatureCollection;
      map.addSource(SRC, { type: "geojson", data });
    }
    if (!map.getLayer(id)) {
      map.addLayer({ id, type: "fill", source: SRC, paint: { "fill-color": color, "fill-opacity": 0 } });
      last.current = 0;
    }
    map.setPaintProperty(id, "fill-color", color);
    const style = map.getStyle();
    const layers = style?.layers || [];
    const sources = style?.sources || {};
    const baseSourceIds = Object.entries(sources).filter(([, s]: any) => s.type !== "geojson").map(([k]) => k);
    let lastBaseIdx = -1;
    for (let i = 0; i < layers.length; i++) {
      const lyr: any = layers[i];
      if (lyr.id === id) continue;
      if (lyr.type === "background" || (lyr.source && baseSourceIds.includes(lyr.source))) lastBaseIdx = i;
    }
    const currentIdx = layers.findIndex(l => l.id === id);
    let shouldBeIdx = currentIdx;
    if (lastBaseIdx >= 0 && lastBaseIdx < layers.length - 1) shouldBeIdx = lastBaseIdx + 1; else shouldBeIdx = layers.length - 1;
    if (currentIdx !== shouldBeIdx) {
      const beforeId = layers[shouldBeIdx]?.id;
      if (beforeId && beforeId !== id) { try { map.moveLayer(id, beforeId); } catch { } } else { try { map.moveLayer(id); } catch { } }
    }
  };
  useEffect(() => {
    if (!map) return;
    const on = () => { ensure(); inited.current = true; };
    map.on("load", on);
    map.on("styledata", on);
    if (map.isStyleLoaded()) on();
    return () => {
      map.off("load", on); map.off("styledata", on);
      try { if (map.getLayer(id)) map.removeLayer(id); } catch { }
      try { if (map.getSource(SRC)) map.removeSource(SRC); } catch { } inited.current = false; last.current = -1;
    };
  }, [map, id, color]);
  useEffect(() => {
    if (!map?.getLayer(id)) return;
    const v = clamp(opacity);
    if (last.current !== v) { map.setPaintProperty(id, "fill-opacity", v); last.current = v; }
  }, [map, id, opacity]);
  return null;
}
