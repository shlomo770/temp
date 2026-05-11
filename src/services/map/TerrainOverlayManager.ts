import type { GeoJSONSource, Map } from "maplibre-gl";
import type { CoverageBlockedFeatureProps, LonLat, TerrainBBoxWgs84 } from "../../terrain/terrain.types";

const LOS_LINE_SOURCE = "terrain-los-lines-source";
const LOS_LINE_LAYER = "terrain-los-lines-layer";
const LOS_POINT_SOURCE = "terrain-los-points-source";
const LOS_POINT_LAYER = "terrain-los-points-layer";

const COVERAGE_SOURCE = "terrain-coverage-source";
const COVERAGE_FILL_LAYER = "terrain-coverage-fill-layer";
const COVERAGE_LINE_LAYER = "terrain-coverage-line-layer";
const COVERAGE_OUTLINE_SOURCE = "terrain-coverage-outline-source";
const COVERAGE_OUTLINE_LAYER = "terrain-coverage-outline-layer";

const DRAFT_SOURCE = "terrain-draft-source";
const DRAFT_LINE_LAYER = "terrain-draft-line-layer";
const DRAFT_POINT_LAYER = "terrain-draft-point-layer";

export class TerrainOverlayManager {
  constructor(private map: Map) {}

  private setDraftFeatures(features: GeoJSON.Feature[]): void {
    const data = { type: "FeatureCollection", features } as GeoJSON.FeatureCollection;
    if (!this.map.getSource(DRAFT_SOURCE)) {
      this.map.addSource(DRAFT_SOURCE, { type: "geojson", data });
      this.map.addLayer({
        id: DRAFT_LINE_LAYER,
        type: "line",
        source: DRAFT_SOURCE,
        filter: ["==", ["geometry-type"], "LineString"],
        paint: {
          "line-color": "#2563eb",
          "line-width": 2,
          "line-dasharray": [2, 2],
        },
      });
      this.map.addLayer({
        id: DRAFT_POINT_LAYER,
        type: "circle",
        source: DRAFT_SOURCE,
        filter: ["==", ["geometry-type"], "Point"],
        paint: {
          "circle-radius": 5,
          "circle-color": "#2563eb",
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 1.2,
        },
      });
      return;
    }
    (this.map.getSource(DRAFT_SOURCE) as GeoJSONSource).setData(data as any);
  }

  setLosDraft(observer: LonLat, target: LonLat): void {
    this.setDraftFeatures([
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: [observer.lng, observer.lat] },
        properties: { role: "observer" },
      } as GeoJSON.Feature,
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: [target.lng, target.lat] },
        properties: { role: "target" },
      } as GeoJSON.Feature,
      {
        type: "Feature",
        geometry: { type: "LineString", coordinates: [[observer.lng, observer.lat], [target.lng, target.lat]] },
        properties: {},
      } as GeoJSON.Feature,
    ]);
  }

  setCoverageDraft(observer: LonLat, bounds: TerrainBBoxWgs84 | null): void {
    const features: GeoJSON.Feature[] = [
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: [observer.lng, observer.lat] },
        properties: {},
      } as GeoJSON.Feature,
    ];
    if (bounds) {
      features.push({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [
            [bounds.west, bounds.south],
            [bounds.east, bounds.south],
            [bounds.east, bounds.north],
            [bounds.west, bounds.north],
            [bounds.west, bounds.south],
          ],
        },
        properties: {},
      } as GeoJSON.Feature);
    }
    this.setDraftFeatures(features);
  }

  clearDraft(): void {
    if (this.map.getLayer(DRAFT_LINE_LAYER)) this.map.removeLayer(DRAFT_LINE_LAYER);
    if (this.map.getLayer(DRAFT_POINT_LAYER)) this.map.removeLayer(DRAFT_POINT_LAYER);
    if (this.map.getSource(DRAFT_SOURCE)) this.map.removeSource(DRAFT_SOURCE);
  }

  setLos(observer: LonLat, target: LonLat, blockPoint: LonLat | null): void {
    this.clearLos();

    const lineFeatures: GeoJSON.Feature[] = [];
    if (blockPoint) {
      lineFeatures.push({
        type: "Feature",
        geometry: { type: "LineString", coordinates: [[observer.lng, observer.lat], [blockPoint.lng, blockPoint.lat]] },
        properties: { segment: "visible" },
      } as GeoJSON.Feature);
      lineFeatures.push({
        type: "Feature",
        geometry: { type: "LineString", coordinates: [[blockPoint.lng, blockPoint.lat], [target.lng, target.lat]] },
        properties: { segment: "blocked" },
      } as GeoJSON.Feature);
    } else {
      lineFeatures.push({
        type: "Feature",
        geometry: { type: "LineString", coordinates: [[observer.lng, observer.lat], [target.lng, target.lat]] },
        properties: { segment: "visible" },
      } as GeoJSON.Feature);
    }

    const pointFeatures: GeoJSON.Feature[] = [
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: [observer.lng, observer.lat] },
        properties: { role: "observer" },
      } as GeoJSON.Feature,
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: [target.lng, target.lat] },
        properties: { role: "target" },
      } as GeoJSON.Feature,
    ];

    if (blockPoint) {
      pointFeatures.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: [blockPoint.lng, blockPoint.lat] },
        properties: { role: "block" },
      } as GeoJSON.Feature);
    }

    this.map.addSource(LOS_LINE_SOURCE, {
      type: "geojson",
      data: { type: "FeatureCollection", features: lineFeatures },
    });

    this.map.addLayer({
      id: LOS_LINE_LAYER,
      type: "line",
      source: LOS_LINE_SOURCE,
      paint: {
        "line-color": ["match", ["get", "segment"], "blocked", "#ef4444", "#22c55e"],
        "line-width": 3,
        "line-dasharray": ["match", ["get", "segment"], "blocked", ["literal", [2, 2]], ["literal", [1, 0]]],
      },
    });

    this.map.addSource(LOS_POINT_SOURCE, {
      type: "geojson",
      data: { type: "FeatureCollection", features: pointFeatures },
    });

    this.map.addLayer({
      id: LOS_POINT_LAYER,
      type: "circle",
      source: LOS_POINT_SOURCE,
      paint: {
        "circle-radius": ["match", ["get", "role"], "block", 5, 4],
        "circle-color": ["match", ["get", "role"], "observer", "#3b82f6", "target", "#f59e0b", "#ef4444"],
        "circle-stroke-width": 1.5,
        "circle-stroke-color": "#ffffff",
      },
    });
  }

  clearLos(): void {
    if (this.map.getLayer(LOS_LINE_LAYER)) this.map.removeLayer(LOS_LINE_LAYER);
    if (this.map.getLayer(LOS_POINT_LAYER)) this.map.removeLayer(LOS_POINT_LAYER);
    if (this.map.getSource(LOS_LINE_SOURCE)) this.map.removeSource(LOS_LINE_SOURCE);
    if (this.map.getSource(LOS_POINT_SOURCE)) this.map.removeSource(LOS_POINT_SOURCE);
  }

  setCoverageFeatures(
    features: GeoJSON.Feature<GeoJSON.Polygon, CoverageBlockedFeatureProps>[],
    bounds: TerrainBBoxWgs84
  ): void {
    this.clearCoverage();
    this.map.addSource(COVERAGE_SOURCE, {
      type: "geojson",
      data: { type: "FeatureCollection", features },
    });

    this.map.addLayer({
      id: COVERAGE_FILL_LAYER,
      type: "fill",
      source: COVERAGE_SOURCE,
      paint: {
        "fill-color": "#d22e2e",
        "fill-opacity": 0.6,
      },
    });

    this.map.addLayer({
      id: COVERAGE_LINE_LAYER,
      type: "line",
      source: COVERAGE_SOURCE,
      paint: { "line-color": "#7f1d1d", "line-width": 0.8, "line-opacity": 0.9 },
    });

    this.setCoverageOutline(bounds);
  }

  setCoverageOutline(corners: TerrainBBoxWgs84): void {
    const feature: GeoJSON.Feature = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [[
          [corners.west, corners.south],
          [corners.east, corners.south],
          [corners.east, corners.north],
          [corners.west, corners.north],
          [corners.west, corners.south],
        ]],
      },
      properties: {},
    };

    if (!this.map.getSource(COVERAGE_OUTLINE_SOURCE)) {
      this.map.addSource(COVERAGE_OUTLINE_SOURCE, { type: "geojson", data: feature });
      this.map.addLayer({
        id: COVERAGE_OUTLINE_LAYER,
        type: "line",
        source: COVERAGE_OUTLINE_SOURCE,
        paint: { "line-color": "#eab308", "line-width": 2 },
      });
      return;
    }

    (this.map.getSource(COVERAGE_OUTLINE_SOURCE) as GeoJSONSource).setData(feature as any);
  }

  clearCoverage(): void {
    if (this.map.getLayer(COVERAGE_FILL_LAYER)) this.map.removeLayer(COVERAGE_FILL_LAYER);
    if (this.map.getLayer(COVERAGE_LINE_LAYER)) this.map.removeLayer(COVERAGE_LINE_LAYER);
    if (this.map.getLayer(COVERAGE_OUTLINE_LAYER)) this.map.removeLayer(COVERAGE_OUTLINE_LAYER);
    if (this.map.getSource(COVERAGE_SOURCE)) this.map.removeSource(COVERAGE_SOURCE);
    if (this.map.getSource(COVERAGE_OUTLINE_SOURCE)) this.map.removeSource(COVERAGE_OUTLINE_SOURCE);
  }

  clearAllTerrainOverlays(): void {
    this.clearDraft();
    this.clearLos();
    this.clearCoverage();
  }
}
