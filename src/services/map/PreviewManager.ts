import { Coordinates, toLngLatPairs } from "../../utils/geometry";

export class PreviewManager {
    constructor(private map: maplibregl.Map) { }

    // Generic helpers -----------------------------------------------------------

    addOrUpdateFeature(sourceId: string, feature: any) {
        const src = this.map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;
        if (src) src.setData(feature as any);
        else this.map.addSource(sourceId, { type: "geojson", data: feature as any });
    }

    remove(sourceId: string, layerIds: string[] = []) {
        layerIds.forEach(id => { if (this.map.getLayer(id)) this.map.removeLayer(id); });
        if (this.map.getSource(sourceId)) this.map.removeSource(sourceId);
    }

    // Rectangle -----------------------------------------------------------------

    rectangle = {
        source: "rectangle-preview-source",
        fillLayer: "rectangle-preview-fill",
        outlineLayer: "rectangle-preview-outline",
        lineLayer: "rectangle-preview-line",
        pointsSource: "rectangle-preview-points-source",
        pointsLayer: "rectangle-preview-points-layer",
    };

    updateRectangle(coords: Coordinates[]) {
        const { source, fillLayer, outlineLayer, lineLayer } = this.rectangle;
        const isPolygon = coords.length > 2;

        const feature = isPolygon
            ? { type: "Feature", geometry: { type: "Polygon", coordinates: [toLngLatPairs(coords)] }, properties: {} }
            : { type: "Feature", geometry: { type: "LineString", coordinates: toLngLatPairs(coords) }, properties: {} };

        this.addOrUpdateFeature(source, feature);

        if (isPolygon) {
            if (this.map.getLayer(lineLayer)) this.map.removeLayer(lineLayer);

            if (!this.map.getLayer(fillLayer)) {
                this.map.addLayer({
                    id: fillLayer,
                    type: "fill",
                    source,
                    paint: { "fill-color": "#3b82f6", "fill-opacity": 0.2 },
                } as maplibregl.FillLayerSpecification);
            }
            if (!this.map.getLayer(outlineLayer)) {
                this.map.addLayer({
                    id: outlineLayer,
                    type: "line",
                    source,
                    paint: { "line-color": "#1e40af", "line-width": 2 },
                } as maplibregl.LineLayerSpecification);
            }
        } else {
            if (this.map.getLayer(fillLayer)) this.map.removeLayer(fillLayer);
            if (this.map.getLayer(outlineLayer)) this.map.removeLayer(outlineLayer);

            if (!this.map.getLayer(lineLayer)) {
                this.map.addLayer({
                    id: lineLayer,
                    type: "line",
                    source,
                    paint: { "line-color": "#1e40af", "line-width": 2 },
                } as maplibregl.LineLayerSpecification);
            }
        }
    }

    updateRectanglePoints(points: Coordinates[]) {
        const { pointsSource, pointsLayer } = this.rectangle;
        const fc = {
            type: "FeatureCollection",
            features: points.map((p) => ({
                type: "Feature",
                geometry: { type: "Point", coordinates: [p.lng, p.lat] },
                properties: {},
            })),
        };
        this.addOrUpdateFeature(pointsSource, fc);
        if (!this.map.getLayer(pointsLayer)) {
            this.map.addLayer({
                id: pointsLayer,
                type: "circle",
                source: pointsSource,
                paint: {
                    "circle-radius": 6,
                    "circle-color": "#1e40af",
                    "circle-stroke-color": "#fff",
                    "circle-stroke-width": 2,
                },
            } as maplibregl.CircleLayerSpecification);
        }
    }

    clearRectangle() {
        if (!this.map) return;
        const { fillLayer, outlineLayer, lineLayer, source, pointsLayer, pointsSource } = this.rectangle;

        [fillLayer, outlineLayer, lineLayer, pointsLayer].forEach((id) => {
            if (this.map!.getLayer(id)) this.map!.removeLayer(id);
        });

        [source, pointsSource].forEach((id) => {
            if (this.map!.getSource(id)) this.map!.removeSource(id);
        });
    }

    // Circle --------------------------------------------------------------------

    circle = {
        source: "circle-preview-source",
        layer: "circle-preview-layer",
        pointsSource: "circle-preview-points-source",
        pointsLayer: "circle-preview-points-layer",
    };

    updateCircle(ring: Coordinates[]) {
        const { source, layer } = this.circle;
        const feature = { type: "Feature", geometry: { type: "Polygon", coordinates: [toLngLatPairs(ring)] }, properties: {} };
        this.addOrUpdateFeature(source, feature);
        if (!this.map.getLayer(layer)) {
            this.map.addLayer({
                id: layer,
                type: "fill",
                source,
                paint: { "fill-color": "#3b82f6", "fill-opacity": 0.2, "fill-outline-color": "#1e40af" },
            });
        }
    }

    updateCirclePoints(points: Coordinates[]) {
        const { pointsSource, pointsLayer } = this.circle;
        const fc = {
            type: "FeatureCollection",
            features: points.map((p, i) => ({ type: "Feature", geometry: { type: "Point", coordinates: [p.lng, p.lat] }, properties: { index: i } })),
        };
        this.addOrUpdateFeature(pointsSource, fc);
        if (!this.map.getLayer(pointsLayer)) {
            this.map.addLayer({
                id: pointsLayer,
                type: "circle",
                source: pointsSource,
                paint: {
                    "circle-radius": 4,
                    "circle-color": ["case", ["==", ["get", "index"], 0], "#1e40af", "#3b82f6"],
                    "circle-stroke-color": ["case", ["==", ["get", "index"], 0], "#fff", "#1e40af"],
                    "circle-stroke-width": 1.5,
                    "circle-opacity": ["case", ["==", ["get", "index"], 0], 1, 0.7],
                },
            });
        }
    }

    clearCircle() {
        if (this.map.getLayer(this.circle.layer)) this.map.removeLayer(this.circle.layer);
        if (this.map.getSource(this.circle.source)) this.map.removeSource(this.circle.source);
        if (this.map.getLayer(this.circle.pointsLayer)) this.map.removeLayer(this.circle.pointsLayer);
        if (this.map.getSource(this.circle.pointsSource)) this.map.removeSource(this.circle.pointsSource);
    }

    // Ellipse -------------------------------------------------------------------

    ellipse = {
        source: "ellipse-preview-source",
        layer: "ellipse-preview-layer",
        pointsSource: "ellipse-preview-points-source",
        pointsLayer: "ellipse-preview-points-layer",
    };

    updateEllipse(ring: Coordinates[]) {
        const { source, layer } = this.ellipse;
        const feature = { type: "Feature", geometry: { type: "Polygon", coordinates: [toLngLatPairs(ring)] }, properties: {} };
        this.addOrUpdateFeature(source, feature);
        if (!this.map.getLayer(layer)) {
            this.map.addLayer({
                id: layer,
                type: "fill",
                source,
                paint: { "fill-color": "#3b82f6", "fill-opacity": 0.2, "fill-outline-color": "#1e40af" },
            });
        }
    }

    updateEllipsePoints(points: Coordinates[]) {
        const { pointsSource, pointsLayer } = this.ellipse;
        const fc = {
            type: "FeatureCollection",
            features: points.map((p) => ({ type: "Feature", geometry: { type: "Point", coordinates: [p.lng, p.lat] }, properties: {} })),
        };
        this.addOrUpdateFeature(pointsSource, fc);
        if (!this.map.getLayer(pointsLayer)) {
            this.map.addLayer({
                id: pointsLayer,
                type: "circle",
                source: pointsSource,
                paint: { "circle-radius": 6, "circle-color": "#1e40af", "circle-stroke-color": "#fff", "circle-stroke-width": 2 },
            });
        }
    }

    clearEllipse() {
        if (this.map.getLayer(this.ellipse.layer)) this.map.removeLayer(this.ellipse.layer);
        if (this.map.getSource(this.ellipse.source)) this.map.removeSource(this.ellipse.source);
        if (this.map.getLayer(this.ellipse.pointsLayer)) this.map.removeLayer(this.ellipse.pointsLayer);
        if (this.map.getSource(this.ellipse.pointsSource)) this.map.removeSource(this.ellipse.pointsSource);
    }
}