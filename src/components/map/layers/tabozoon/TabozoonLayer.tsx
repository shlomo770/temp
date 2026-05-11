import { useEffect, useMemo } from "react";
import { buildRadarSectors } from "../../../../utils/radarSector";
import { useAppSelector } from '../../../../hooks/useAppSelector';

export default function TabozoonLayer({
    map,
    center,
    stepDeg = 1,
}: any) {
    const tabozoonState = useAppSelector(state => state.tabozoon);
    const fc = useMemo(() => {
        if (!center) return { type: "FeatureCollection", features: [] };
        return buildRadarSectors(center, tabozoonState.radiusMeters, tabozoonState.angles, stepDeg);
    }, [center, tabozoonState.radiusMeters, tabozoonState.angles, stepDeg]);

    useEffect(() => {
        if (!map || typeof map.getSource !== "function") return;

        const ensureLayer = () => {
            if (!map || typeof map.getSource !== "function") return;
            if (!map.getSource("tabozoon-sector")) {
                map.addSource("tabozoon-sector", {
                    type: "geojson",
                    data: fc,
                });

                map.addLayer({
                    id: "tabozoon-sector-fill",
                    type: "fill",
                    source: "tabozoon-sector",
                    paint: {
                        "fill-color": "#FFB300",
                        "fill-opacity": 0.35,
                    },
                });

                map.addLayer({
                    id: "tabozoon-sector-line",
                    type: "line",
                    source: "tabozoon-sector",
                    paint: {
                        "line-color": "#FFB300",
                        "line-width": 2,
                    },
                });
            } else {
                (map.getSource("tabozoon-sector") as any).setData(fc);
            }
        };

        if (!map.isStyleLoaded?.()) {
            const onLoad = () => {
                ensureLayer();
                map.off("styledata", onLoad);
                map.off("load", onLoad);
            };
            map.on("styledata", onLoad);
            map.on("load", onLoad);
            return () => {
                map.off("styledata", onLoad);
                map.off("load", onLoad);
            };
        }

        ensureLayer();
    }, [map, fc, tabozoonState]);

    return null;
}