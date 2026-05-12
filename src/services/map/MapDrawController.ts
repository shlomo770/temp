import MapboxDraw from "@mapbox/mapbox-gl-draw";
import { Coordinates } from "../../utils/geometry";

export type DrawCallbacks = {
    onCreate?: (type: string, coords: Coordinates[], properties: any) => void;
    onUpdate?: (id: string, coords: Coordinates[]) => void;
    onDelete?: (id: string) => void;
};

export class MapDrawController {
    draw: any;

    constructor(
        private map: maplibregl.Map,
        private callbacks: DrawCallbacks
    ) {
        this.draw = new MapboxDraw({
            displayControlsDefault: false,
            styles: this.getDrawStyles(),
            modes: {
                ...(MapboxDraw as any).modes,
                draw_rectangle: this.placeholderPolygonMode("rectangle"),
                draw_circle: this.placeholderPolygonMode("circle"),
            },
        });
        this.map.addControl(this.draw);
        this.map.doubleClickZoom.disable();
        this.setupEvents();
    }

    /** Very small custom mode that just places a polygon placeholder (we do our own previews externally). */
    private placeholderPolygonMode(shape: "rectangle" | "circle"): any {
        return {
            onSetup: function (): any {
                const poly = (this as any).newFeature({
                    type: "Feature",
                    properties: { shape },
                    geometry: { type: "Polygon", coordinates: [[]] },
                });
                (this as any).addFeature(poly);
                (this as any).clearSelectedFeatures();
                (this as any).setActionableState({ trash: true });
                return poly;
            },
            onClick: function () { },
            onTap: function () { },
        };
    }

    setMode(mode: "draw_polygon" | "draw_line_string" | "draw_point" | "simple_select") {
        this.draw.changeMode(mode);
    }

    getMode(): string {
        return this.draw.getMode();
    }

    getAllFeatures(): any {
        return this.draw.getAll();
    }

    getFeature(id: string) {
        return this.draw.get(id);
    }

    directSelect(id: string) {
        this.draw.changeMode("direct_select", { featureId: id });
    }

    remove(id: string) {
        this.draw.delete(id);
    }

    add(feature: any): string | undefined {
        return this.draw.add(feature);
    }

    getSelected(): any {
        return this.draw.getSelected();
    }

    // Styles for Draw widgets
    private getDrawStyles() {
        return [
            {
                id: "gl-draw-polygon-fill-inactive", type: "fill",
                filter: ["all", ["==", "active", "false"], ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
                paint: { "fill-color": "#3b82f6", "fill-outline-color": "#1e40af", "fill-opacity": 0.3 }
            },
            {
                id: "gl-draw-polygon-fill-active", type: "fill",
                filter: ["all", ["==", "active", "true"], ["==", "$type", "Polygon"]],
                paint: { "fill-color": "#3b82f6", "fill-outline-color": "#1e40af", "fill-opacity": 0.5 }
            },

            {
                id: "gl-draw-polygon-stroke-inactive", type: "line",
                filter: ["all", ["==", "active", "false"], ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
                layout: { "line-cap": "round", "line-join": "round" },
                paint: { "line-color": "#1e40af", "line-width": 2 }
            },
            {
                id: "gl-draw-polygon-stroke-active", type: "line",
                filter: ["all", ["==", "active", "true"], ["==", "$type", "Polygon"]],
                layout: { "line-cap": "round", "line-join": "round" },
                paint: { "line-color": "#1e40af", "line-width": 3 }
            },

            {
                id: "gl-draw-line-inactive", type: "line",
                filter: ["all", ["==", "active", "false"], ["==", "$type", "LineString"], ["!=", "mode", "static"]],
                layout: { "line-cap": "round", "line-join": "round" },
                paint: { "line-color": "#3b82f6", "line-width": 2 }
            },
            {
                id: "gl-draw-line-active", type: "line",
                filter: ["all", ["==", "active", "true"], ["==", "$type", "LineString"]],
                layout: { "line-cap": "round", "line-join": "round" },
                paint: { "line-color": "#1e40af", "line-width": 3 }
            },

            {
                id: "gl-draw-polygon-and-line-vertex-halo-active", type: "circle",
                filter: ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["!=", "mode", "static"]],
                paint: { "circle-radius": 6, "circle-color": "#fff" }
            },
            {
                id: "gl-draw-polygon-and-line-vertex-active", type: "circle",
                filter: ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["!=", "mode", "static"]],
                paint: { "circle-radius": 4, "circle-color": "#1e40af" }
            },
            {
                id: "gl-draw-midpoint", type: "circle",
                filter: ["all", ["==", "$type", "Point"], ["==", "meta", "midpoint"]],
                paint: { "circle-radius": 5, "circle-color": "#fff", "circle-stroke-color": "#3b82f6", "circle-stroke-width": 2 }
            },
        ];
    }

    // Events glue: forward to callbacks
    private setupEvents() {
        this.map.on("draw.create", (e) => {
            const f = e.features?.[0];
            if (!f) return;
            const coords = this.featureToCoordinates(f);
            this.callbacks.onCreate?.(f.geometry?.type, coords, f.properties || {});
            this.draw.changeMode("simple_select");
        });

        this.map.on("draw.update", (e) => {
            const f = e.features?.[0];
            if (!f || !f.id) return;
            const coords = this.featureToCoordinates(f);
            this.callbacks.onUpdate?.(String(f.id), coords);
        });

        this.map.on("draw.delete", (e) => {
            const f = e.features?.[0];
            if (!f || !f.id) return;
            this.callbacks.onDelete?.(String(f.id));
        });
    }

    // Convert Draw feature → app Coordinates[]
    featureToCoordinates(feature: any): Coordinates[] {
        const { type, coordinates } = feature.geometry || {};
        if (type === "Point") return [{ lng: coordinates[0], lat: coordinates[1] }];
        if (type === "LineString") {
            return (coordinates || []).map((c: number[]) => ({ lng: c[0], lat: c[1] }));
        }
        if (type === "Polygon") {
            const ring = (coordinates?.[0] || []);
            return ring.map((c: number[]) => ({ lng: c[0], lat: c[1] }));
        }
        return [];
    }
}