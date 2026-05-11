import { useEffect, useMemo } from "react";
import type { Position } from "geojson";
import { buildRadarSectors } from "../../../../utils/radarSector";

type Props = {
    map: maplibregl.Map;
    center: Position;
    radiusMeters: number;
    angles: string[] | null;
    stepDeg?: number;
    fillColor?: string;
    fillOpacity?: number;
    lineColor?: string;
    lineWidth?: number;
    idPrefix?: string;
    overlayPrefixHints?: string[];
};

export default function RadarNonCoverageLayer({
    map,
    center,
    radiusMeters,
    angles,
    stepDeg = 1,
    fillColor = "#0400ff",
    fillOpacity = 0.20,
    lineColor = "#7574ad",
    lineWidth = 2,
    idPrefix = "radar-nc",
    overlayPrefixHints = ["targets-", "entities-", "overlay-", "draw-"],
}: Props) {
    const ids = useMemo(
        () => ({
            src: `${idPrefix}-src`,
            fill: `${idPrefix}-fill`,
            line: `${idPrefix}-line`,
        }),
        [idPrefix]
    );

    const fc = useMemo<GeoJSON.FeatureCollection<GeoJSON.Polygon>>(() => {
        return buildRadarSectors(center, radiusMeters, angles, stepDeg);
    }, [center[0], center[1], radiusMeters, stepDeg, JSON.stringify(angles)]);

    useEffect(() => {
        if (!map) return;
        const ensure = () => {
            if (!map.isStyleLoaded()) return;
            const src = map.getSource(ids.src) as maplibregl.GeoJSONSource | undefined;
            if (!src) {
                map.addSource(ids.src, { type: "geojson", data: fc });
            } else {
                src.setData(fc);
            }
            if (!map.getLayer(ids.fill)) {
                map.addLayer({
                    id: ids.fill,
                    type: "fill",
                    source: ids.src,
                    paint: {
                        "fill-color": fillColor,
                        "fill-opacity": fillOpacity,
                    },
                });
            } else {
                map.setPaintProperty(ids.fill, "fill-color", fillColor);
                map.setPaintProperty(ids.fill, "fill-opacity", fillOpacity);
            }

            if (!map.getLayer(ids.line)) {
                map.addLayer(
                    {
                        id: ids.line,
                        type: "line",
                        source: ids.src,
                        paint: {
                            "line-color": lineColor,
                            "line-width": lineWidth,
                        },
                        layout: {
                            "line-join": "round",
                            "line-cap": "round",
                        },
                    },
                    ids.fill
                );
            } else {
                map.setPaintProperty(ids.line, "line-color", lineColor);
                map.setPaintProperty(ids.line, "line-width", lineWidth);
            }

            const layers = map.getStyle()?.layers || [];
            let before: string | undefined;
            for (const lyr of layers) {
                if (lyr.id === ids.fill || lyr.id === ids.line) continue;
                if (overlayPrefixHints.some((p) => lyr.id.startsWith(p))) {
                    before = lyr.id;
                    break;
                }
            }
            if (before) {
                try {
                    map.moveLayer(ids.fill, before);
                } catch { }
                try {
                    map.moveLayer(ids.line, before);
                } catch { }
            }
        };

        const onLoad = () => ensure();
        const onStyle = () => ensure();
        map.on("load", onLoad);
        map.on("styledata", onStyle);
        if (map.isStyleLoaded()) ensure();
        return () => {
            map.off("load", onLoad);
            map.off("styledata", onStyle);
            try {
                if (map.getLayer(ids.line)) map.removeLayer(ids.line);
            } catch { }
            try {
                if (map.getLayer(ids.fill)) map.removeLayer(ids.fill);
            } catch { }
            try {
                if (map.getSource(ids.src)) map.removeSource(ids.src);
            } catch { }
        };
    }, [map, ids.src, ids.fill, ids.line, fillColor, fillOpacity, lineColor, lineWidth, JSON.stringify(overlayPrefixHints), fc]);
    return null;
}