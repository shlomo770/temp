import { Coordinates } from "../types";

export type LatLng = { lat: number; lng: number };

export function calculateDistance(a: Coordinates, b: Coordinates): number {
  const R = 6371000;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters)) return "-";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(2)} km`;
}

export function formatArea(squareMeters: number): string {
  if (!Number.isFinite(squareMeters)) return "-";
  if (squareMeters < 1_000_000) return `${Math.round(squareMeters)} m²`;
  return `${(squareMeters / 1_000_000).toFixed(2)} km²`;
}

export function calculatePolygonArea(points: Coordinates[]): number {
  if (!points || points.length < 3) return 0;
  const avgLat = points.reduce((s, p) => s + p.lat, 0) / points.length;
  const { mPerDegLat, mPerDegLng } = metersPerDegree(avgLat);
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    const xi = points[i].lng * mPerDegLng;
    const yi = points[i].lat * mPerDegLat;
    const xj = points[j].lng * mPerDegLng;
    const yj = points[j].lat * mPerDegLat;
    area += xi * yj - xj * yi;
  }
  return Math.abs(area / 2);
}

export function calculateCenter(coordinates: Coordinates[]): Coordinates {
  if (!coordinates || coordinates.length === 0) return { lat: 0, lng: 0 };
  const sum = coordinates.reduce(
    (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
    { lat: 0, lng: 0 }
  );
  return { lat: sum.lat / coordinates.length, lng: sum.lng / coordinates.length };
}

export function closeRing(coords: Coordinates[]): Coordinates[] {
  if (!coords || coords.length === 0) return [];
  const first = coords[0];
  const last = coords[coords.length - 1];
  if (first.lat === last.lat && first.lng === last.lng) return coords;
  return [...coords, { ...first }];
}

export function createCirclePolygon(
  center: Coordinates,
  edge: Coordinates,
  numPoints: number
): Coordinates[] {
  const radius = calculateDistance(center, edge);
  const { mPerDegLat, mPerDegLng } = metersPerDegree(center.lat);
  const points: Coordinates[] = [];
  for (let i = 0; i < numPoints; i++) {
    const ang = (i / numPoints) * Math.PI * 2;
    const dx = Math.cos(ang) * radius;
    const dy = Math.sin(ang) * radius;
    points.push({
      lat: center.lat + dy / mPerDegLat,
      lng: center.lng + dx / mPerDegLng
    });
  }
  return closeRing(points);
}

export function createEllipsePolygon(
  center: Coordinates,
  edge: Coordinates,
  numPoints: number
): Coordinates[] {
  const radiusX = Math.abs(edge.lng - center.lng);
  const radiusY = Math.abs(edge.lat - center.lat);
  const points: Coordinates[] = [];
  for (let i = 0; i < numPoints; i++) {
    const ang = (i / numPoints) * Math.PI * 2;
    points.push({
      lat: center.lat + Math.sin(ang) * radiusY,
      lng: center.lng + Math.cos(ang) * radiusX
    });
  }
  return closeRing(points);
}

export function createSectorPolygon(
  center: Coordinates,
  startPoint: Coordinates,
  endPoint: Coordinates,
  numPoints: number
): Coordinates[] {
  const radius = calculateDistance(center, startPoint);
  const start = bearing(center, startPoint);
  let end = bearing(center, endPoint);
  if (end < start) end += 360;
  const { mPerDegLat, mPerDegLng } = metersPerDegree(center.lat);
  const pts: Coordinates[] = [{ ...center }];
  for (let i = 0; i <= numPoints; i++) {
    const ang = ((start + ((end - start) * i) / numPoints) * Math.PI) / 180;
    const dx = Math.cos(ang) * radius;
    const dy = Math.sin(ang) * radius;
    pts.push({
      lat: center.lat + dy / mPerDegLat,
      lng: center.lng + dx / mPerDegLng
    });
  }
  pts.push({ ...center });
  return closeRing(pts);
}

export function getEntityAnchor(entity: any): { lat: number; lng: number } {
  if (!entity) return { lat: 0, lng: 0 };
  const coords: Coordinates[] = entity.coordinates || [];
  if (coords.length === 0) return { lat: 0, lng: 0 };
  if (entity.type === "circle" || entity.type === "ellipse") {
    return coords[0];
  }
  return calculateCenter(coords);
}

export function metersPerDegree(latDeg: number) {
  const latRad = (latDeg * Math.PI) / 180;
  const mPerDegLat = 111132.92 - 559.82 * Math.cos(2 * latRad) + 1.175 * Math.cos(4 * latRad);
  const mPerDegLng = 111412.84 * Math.cos(latRad) - 93.5 * Math.cos(3 * latRad);
  return { mPerDegLat, mPerDegLng };
}

export function bearing(a: Coordinates, b: Coordinates): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const toDeg = (v: number) => (v * 180) / Math.PI;
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLng = toRad(b.lng - a.lng);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}
 