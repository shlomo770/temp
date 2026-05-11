import { Coordinates } from "../../types";
import { closeRing } from "../../utils/geometry";
import { MapLayerManager } from "./MapLayerManager";

export class MapMeasurementService {
  private map: maplibregl.Map;
  private layerManager: MapLayerManager;

  constructor(map: maplibregl.Map, layerManager: MapLayerManager) {
    this.map = map;
    this.layerManager = layerManager;
  }

  public renderMeasurement(points: Coordinates[]) {
    if (!this.map) return;

    this.layerManager.removeLayerAndSource("measure-line");
    this.layerManager.removeLayerAndSource("measure-points");

    if (points.length > 0) {
      this.map.addSource("measure-points", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: points.map((pt, index) => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [pt.lng, pt.lat] },
            properties: { index }
          }))
        }
      });
      this.map.addLayer({
        id: "measure-points",
        type: "circle",
        source: "measure-points",
        paint: {
          "circle-radius": 6,
          "circle-color": "#f59e42",
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 2
        }
      });
    }

    if (points.length >= 2) {
      this.map.addSource("measure-line", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: points.map(pt => [pt.lng, pt.lat])
          }
        }
      });
      this.map.addLayer({
        id: "measure-line",
        type: "line",
        source: "measure-line",
        paint: {
          "line-color": "#f59e42",
          "line-width": 4
        }
      });
    }
  }

  public renderMeasurementPreview(start: Coordinates, current: Coordinates) {
    if (!this.map) return;

    const previewLine = {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [start.lng, start.lat],
          [current.lng, current.lat]
        ]
      },
      properties: {}
    };

    const sourceId = "measure-line-preview";
    const layerId = "measure-line-preview";
    const source = this.map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;
    if (source) {
      source.setData(previewLine as any);
    } else {
      this.map.addSource(sourceId, {
        type: "geojson",
        data: previewLine as any
      });
      this.map.addLayer({
        id: layerId,
        type: "line",
        source: sourceId,
        paint: {
          "line-color": "#f59e42",
          "line-width": 2,
          "line-opacity": 0.6,
          "line-dasharray": [2, 2]
        }
      });
    }
  }

  public clearMeasurementPreview() {
    this.layerManager.removeLayerAndSource("measure-line-preview");
  }

  public renderAreaMeasurement(points: Coordinates[]) {
    if (!this.map) return;

    this.layerManager.removeLayerAndSource("measure-area-fill");
    this.layerManager.removeLayerAndSource("measure-area-line");
    this.layerManager.removeLayerAndSource("measure-area-points");

    if (points.length > 0) {
      this.map.addSource("measure-area-points", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: points.map((pt, index) => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [pt.lng, pt.lat] },
            properties: { index }
          }))
        }
      });
      this.map.addLayer({
        id: "measure-area-points",
        type: "circle",
        source: "measure-area-points",
        paint: {
          "circle-radius": 6,
          "circle-color": "#f59e42",
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 2
        }
      });
    }

    if (points.length >= 3) {
      const ring = closeRing(points);
      this.map.addSource("measure-area-line", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: points.map(pt => [pt.lng, pt.lat])
          }
        }
      });
      this.map.addLayer({
        id: "measure-area-line",
        type: "line",
        source: "measure-area-line",
        paint: {
          "line-color": "#f59e42",
          "line-width": 3
        }
      });

      this.map.addSource("measure-area-fill", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [ring.map(pt => [pt.lng, pt.lat])]
          }
        }
      });
      this.map.addLayer({
        id: "measure-area-fill",
        type: "fill",
        source: "measure-area-fill",
        paint: {
          "fill-color": "#f59e42",
          "fill-opacity": 0.2
        }
      });
    }
  }

  public renderAreaMeasurementPreview(points: Coordinates[], current: Coordinates) {
    if (!this.map || points.length === 0) return;

    const previewPoints = [...points, current];
    const lineCoords = previewPoints.map(pt => [pt.lng, pt.lat]);

    const lineSourceId = "measure-area-preview-line";
    const lineLayerId = "measure-area-preview-line";
    const lineSource = this.map.getSource(lineSourceId) as maplibregl.GeoJSONSource | undefined;
    const lineData = {
      type: "Feature",
      geometry: { type: "LineString", coordinates: lineCoords },
      properties: {}
    };
    if (lineSource) {
      lineSource.setData(lineData as any);
    } else {
      this.map.addSource(lineSourceId, { type: "geojson", data: lineData as any });
      this.map.addLayer({
        id: lineLayerId,
        type: "line",
        source: lineSourceId,
        paint: {
          "line-color": "#f59e42",
          "line-width": 2,
          "line-opacity": 0.6,
          "line-dasharray": [2, 2]
        }
      });
    }

    if (previewPoints.length >= 3) {
      const ring = closeRing(previewPoints);
      const fillSourceId = "measure-area-preview-fill";
      const fillLayerId = "measure-area-preview-fill";
      const fillSource = this.map.getSource(fillSourceId) as maplibregl.GeoJSONSource | undefined;
      const fillData = {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [ring.map(pt => [pt.lng, pt.lat])]
        },
        properties: {}
      };
      if (fillSource) {
        fillSource.setData(fillData as any);
      } else {
        this.map.addSource(fillSourceId, { type: "geojson", data: fillData as any });
        this.map.addLayer({
          id: fillLayerId,
          type: "fill",
          source: fillSourceId,
          paint: {
            "fill-color": "#f59e42",
            "fill-opacity": 0.15
          }
        });
      }
    }
  }

  public clearAreaMeasurementPreview() {
    this.layerManager.removeLayerAndSource("measure-area-preview-line");
    this.layerManager.removeLayerAndSource("measure-area-preview-fill");
  }

  public clearMeasurement() {
    this.clearMeasurementPreview();
    this.layerManager.removeLayerAndSource("measure-line");
    this.layerManager.removeLayerAndSource("measure-points");
  }

  public clearAreaMeasurement() {
    this.clearAreaMeasurementPreview();
    this.layerManager.removeLayerAndSource("measure-area-fill");
    this.layerManager.removeLayerAndSource("measure-area-line");
    this.layerManager.removeLayerAndSource("measure-area-points");
  }
}
