import type { LosState, LosRay } from "../../../../store/slices/losSlice";

export function moveMeters(
    center: { lat: number; lng: number },
    distanceMeters: number,
    angleDeg: number
) {
    const R = 111320;
    const rad = (angleDeg * Math.PI) / 180;

    const dx = Math.sin(rad) * distanceMeters;
    const dy = Math.cos(rad) * distanceMeters;

    const lat = center.lat + dy / R;
    const lng = center.lng + dx / (R * Math.cos((center.lat * Math.PI) / 180));

    return { lat, lng };
}

export function createSectorPolygonCoords(
    los: LosState,
    steps = 64
): { lng: number; lat: number }[] {
    if (!los.center || !los.radiusMeters) return [];

    const { center, radiusMeters } = los;

    const coords: { lng: number; lat: number }[] = [];
    const norm = (a: number) => ((a % 360) + 360) % 360;

    let start = norm(los.angleStartDeg);
    let end = norm(los.angleEndDeg);

    let sweep = end - start;
    if (sweep <= 0) sweep += 360;

    coords.push({ lng: center.lng, lat: center.lat });

    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const bearing = start + sweep * t;
        const p = moveMeters(center, radiusMeters, bearing);
        coords.push({ lng: p.lng, lat: p.lat });
    }

    coords.push({ lng: center.lng, lat: center.lat });

    return coords;
}

export function rayToLineCoords(
    center: { lat: number; lng: number },
    ray: LosRay,
    radiusMeters: any
): [number, number][] {
    const p1 = moveMeters(center, ray.distanceStart, ray.angleDeg);
    const p2 = moveMeters(center, radiusMeters, ray.angleDeg);
    return [
        [p1.lng, p1.lat],
        [p2.lng, p2.lat]
    ];
}