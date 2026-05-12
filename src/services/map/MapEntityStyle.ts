import { Entity } from "../../types";

export interface CategoryVisual {
    color: string;
    opacity: number;
}

export function getPaintProperties(entity: Entity, categoryVisual?: CategoryVisual) {
    const style = entity.style ?? {};
    const color = categoryVisual?.color;
    const opacity = categoryVisual?.opacity;
    const kind = entity.type.toLowerCase().trim();

    if (kind === "marker" || kind === "target") {
        if (kind === "target") {
            return {
                "circle-radius": 40,
                "circle-color": "#ff0000",
                "circle-stroke-color": "#ffffff",
                "circle-stroke-width": 4
            };
        }
        return {
            "circle-radius": style.radius ?? 8,
            "circle-color": color ?? style.fillColor ?? "#3b82f6",
            "circle-stroke-color": style.strokeColor ?? "#1e40af",
            "circle-stroke-width": style.strokeWidth ?? 2,
            "circle-opacity": opacity ?? 1
        };
    }

    if (kind === "line") {
        return {
            "line-color": color ?? style.strokeColor ?? "#3b82f6",
            "line-width": style.strokeWidth ?? 2,
            "line-opacity": opacity ?? style.strokeOpacity ?? 1
        };
    }

    return {
        "fill-color": color ?? style.fillColor ?? "#3b82f6",
        "fill-opacity": opacity ?? style.fillOpacity ?? 0.3,
        "fill-outline-color": style.strokeColor ?? "#1e40af"
    };
}