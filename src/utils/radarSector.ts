import destination from "@turf/destination";
import { point } from "@turf/helpers";
import type { Position } from "geojson";

export function buildRadarSectors(
    center: Position,
    radiusMeters: number,
    angles: string[] | null,
    stepDeg: number
): GeoJSON.FeatureCollection<GeoJSON.Polygon> {

    if (!angles || !angles.length) {
        return { type: "FeatureCollection", features: [] };
    }

    const norm = (a: number) => ((a % 360) + 360) % 360;
    const km = radiusMeters / 1000;
    const polys: GeoJSON.Feature<GeoJSON.Polygon>[] = [];
    const segs: Array<[number, number]> = [];

    for (const raw of angles) {
        const [aStr, bStr] = raw.split("-");
        const a = Number(aStr);
        const b = Number(bStr);
        if (!Number.isFinite(a) || !Number.isFinite(b)) continue;

        const rawSpan = Math.abs(b - a);

        if (rawSpan >= 360) {
            segs.push([0, 360]);
            continue;
        }

        const A = norm(a);
        const B = norm(b);

        if (A === B) continue;
        // const A = norm(a);
        // const B = norm(b);
        // if (A === B) continue;
        if (A < B) segs.push([A, B]);
        else {
            segs.push([A, 360]);
            segs.push([0, B]);
        }
    }

    for (const [a0, a1] of segs) {
        const ring: Position[] = [];
        ring.push(center);

        const span = a1 - a0;
        const steps = Math.max(1, Math.ceil(span / stepDeg));

        for (let i = 0; i <= steps; i++) {
            const bearing = a0 + (span * i) / steps;
            const pt = destination(point(center), km, bearing);
            ring.push(pt.geometry.coordinates as Position);
        }

        ring.push(center);

        polys.push({
            type: "Feature",
            properties: {},
            geometry: { type: "Polygon", coordinates: [ring] },
        });
    }

    return { type: "FeatureCollection", features: polys };
}

/** Returns [center, startPoint, endPoint] for a sector entity from center (lng/lat), radius in meters, and two angles (0–360). */
export function sectorCoordinatesFromAngles(
    center: { lng: number; lat: number },
    radiusMeters: number,
    angleFrom: number,
    angleTo: number
): Array<{ lng: number; lat: number }> {
    const km = radiusMeters / 1000;
    const pos: Position = [center.lng, center.lat];
    const start = destination(point(pos), km, angleFrom);
    const end = destination(point(pos), km, angleTo);
    const startCoord = start.geometry.coordinates as Position;
    const endCoord = end.geometry.coordinates as Position;
    return [
        { lng: center.lng, lat: center.lat },
        { lng: startCoord[0], lat: startCoord[1] },
        { lng: endCoord[0], lat: endCoord[1] },
    ];
}