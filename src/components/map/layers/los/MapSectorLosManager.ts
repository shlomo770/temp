import type { Map } from "maplibre-gl";
import type { LosState } from "../../../../store/slices/losSlice";
import {
  createSectorPolygonCoords,
  rayToLineCoords
} from "./losGeo";

export function clearMapLOS(map: Map) {
  if (!map?.getStyle()) return;

  map.getStyle().layers.forEach((layer) => {
    if (layer.id.startsWith("los-ray-layer-")) {
      if (map.getLayer(layer.id)) map.removeLayer(layer.id);
    }
  });

  Object.keys((map as any).style.sourceCaches).forEach((id) => {
    if (id.startsWith("los-ray-source-")) {
      if (map.getSource(id)) map.removeSource(id);
    }
  });

  if (map.getLayer("los-sector-layer")) map.removeLayer("los-sector-layer");
  if (map.getSource("los-sector-source")) map.removeSource("los-sector-source");
}

export function drawLOS(map: Map, los: LosState) {
  clearMapLOS(map);

  if (!los.center || !los.radiusMeters) return;

  const sectorCoords = createSectorPolygonCoords(los);
  if (sectorCoords.length >= 3) {
    map.addSource("los-sector-source", {
      type: "geojson",
      data: {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [sectorCoords.map((p) => [p.lng, p.lat])]
        }
      }
    });

    map.addLayer({
      id: "los-sector-layer",
      type: "fill",
      source: "los-sector-source",
      paint: {
        "fill-color": "#00ffff",
        "fill-opacity": 0.22,
        "fill-outline-color": "#00ffff"
      }
    });
  }

  los.rays
    .filter((r) => r.blocked)
    .forEach((ray, i) => {
      const srcId = `los-ray-source-${i}`;
      const layerId = `los-ray-layer-${i}`;

      const lineCoords = rayToLineCoords(los.center!, ray ,los.radiusMeters);

      map.addSource(srcId, {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: lineCoords
          }
        }
      });

      map.addLayer({
        id: layerId,
        type: "line",
        source: srcId,
        paint: {
          "line-color": "red",
          "line-width": 3,
          "line-opacity": 1
        }
      });
    });
}