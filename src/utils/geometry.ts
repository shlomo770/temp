import { Entity } from "../types";
export type Coordinates = { lng: number; lat: number };
export const R = 6378137;
export const toRad = (deg: number) => (deg * Math.PI) / 180;
export const toDeg = (rad: number) => (rad * 180) / Math.PI;
export interface Point {
  lat: number;
  lng: number;
}

export function calculateDistance(a: Coordinates, b: Coordinates): number {
  const φ1 = toRad(a.lat);
  const φ2 = toRad(b.lat);
  const Δφ = toRad(b.lat - a.lat);
  const Δλ = toRad(b.lng - a.lng);
  const s =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}


export function bearingRad(a: Coordinates, b: Coordinates): number {
  const φ1 = toRad(a.lat);
  const φ2 = toRad(b.lat);
  const Δλ = toRad(b.lng - a.lng);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  return Math.atan2(y, x); // radians, normalized by destination()
}

export function formatDistance(meters: number): string {
  const km = (meters / 1000).toFixed(2);
  return `${km} km`;
}

export function formatArea(squareMeters: number): string {
  if (!Number.isFinite(squareMeters)) return "0 m²";
  if (squareMeters < 1_000_000) {
    return `${squareMeters.toFixed(0)} m²`;
  }
  const km2 = squareMeters / 1_000_000;
  return `${km2.toFixed(2)} km²`;
}

export function calculatePolygonArea(points: Coordinates[]): number {
  if (points.length < 3) return 0;
  const avgLat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
  const avgLng = points.reduce((sum, p) => sum + p.lng, 0) / points.length;
  const { mPerDegLat, mPerDegLng } = metersPerDegree(avgLat);
  const projected = points.map(p => ({
    x: (p.lng - avgLng) * mPerDegLng,
    y: (p.lat - avgLat) * mPerDegLat
  }));
  let area = 0;
  for (let i = 0; i < projected.length; i++) {
    const j = (i + 1) % projected.length;
    area += projected[i].x * projected[j].y - projected[j].x * projected[i].y;
  }
  return Math.abs(area) / 2;
}

export function calculateCenter(coordinates: Coordinates[]): Coordinates {
  if (coordinates.length === 0) {
    return { lat: 0, lng: 0 };
  }
  const sumLat = coordinates.reduce((sum, p) => sum + p.lat, 0);
  const sumLng = coordinates.reduce((sum, p) => sum + p.lng, 0);
  return {
    lat: sumLat / coordinates.length,
    lng: sumLng / coordinates.length
  };
}

export function toLngLatPairs(coords: Coordinates[]): [number, number][] {
  return coords.map((c) => [c.lng, c.lat]);
}


export function destination(
  start: Coordinates,
  distMeters: number,
  bearingRad: number
): Coordinates {
  const δ = distMeters / R;      // angular distance
  const θ = bearingRad;          // bearing
  const φ1 = toRad(start.lat);
  const λ1 = toRad(start.lng);
  const sinφ1 = Math.sin(φ1);
  const cosφ1 = Math.cos(φ1);
  const sinδ = Math.sin(δ);
  const cosδ = Math.cos(δ);
  const sinθ = Math.sin(θ);
  const cosθ = Math.cos(θ);
  const sinφ2 = sinφ1 * cosδ + cosφ1 * sinδ * cosθ;
  const φ2 = Math.asin(sinφ2);
  const y = sinθ * sinδ * cosφ1;
  const x = cosδ - sinφ1 * sinφ2;
  const λ2 = λ1 + Math.atan2(y, x);
  const lng = ((toDeg(λ2) + 540) % 360) - 180;
  const lat = toDeg(φ2);
  return { lat, lng };
}

export function closeRing(coords: Coordinates[]): Coordinates[] {
  if (coords.length === 0) return coords;
  const first = coords[0];
  const last = coords[coords.length - 1];
  if (first.lat !== last.lat || first.lng !== last.lng) {
    return [...coords, { ...first }];
  }
  return coords;
}

function coordsToLngLatPairs(coords: Coordinates[]): [number, number][] {
  return coords.map((c) => [c.lng, c.lat]);
}

export function createCirclePolygon(center: Coordinates, edge: Coordinates, numPoints: number): Coordinates[] {
  const dLat = toRad(edge.lat - center.lat);
  const dLng = toRad(edge.lng - center.lng);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(center.lat)) * Math.cos(toRad(edge.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const radius = R * c;
  const coords: Coordinates[] = [];
  for (let i = 0; i <= numPoints; i++) {
    const angle = 2 * Math.PI * i / numPoints;
    const dx = radius * Math.cos(angle);
    const dy = radius * Math.sin(angle);
    const lat = center.lat + (dy / R) * (180 / Math.PI);
    const lng = center.lng + (dx / (R * Math.cos(Math.PI * center.lat / 180))) * (180 / Math.PI);
    coords.push({ lng, lat });
  }
  return coords;
}

export function createEllipsePolygon(center: Coordinates, edge: Coordinates, numPoints: number): Coordinates[] {
  const dLat = toRad(edge.lat - center.lat);
  const dLng = toRad(edge.lng - center.lng);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(center.lat)) * Math.cos(toRad(edge.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const majorRadius = R * c;
  const minorRadius = majorRadius * 0.6; // Minor axis is 60% of major axis
  const angle = Math.atan2(dLat, dLng);
  const coords: Coordinates[] = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = 2 * Math.PI * i / numPoints;
    const x = majorRadius * Math.cos(t);
    const y = minorRadius * Math.sin(t);
    const rotatedX = x * Math.cos(angle) - y * Math.sin(angle);
    const rotatedY = x * Math.sin(angle) + y * Math.cos(angle);
    const lat = center.lat + (rotatedY / R) * (180 / Math.PI);
    const lng = center.lng + (rotatedX / (R * Math.cos(Math.PI * center.lat / 180))) * (180 / Math.PI);
    coords.push({ lng, lat });
  }

  if (coords.length > 0) {
    coords.push(coords[0]);
  }

  return coords;
}

export function createSectorPolygon(
  center: Coordinates,
  startPoint: Coordinates,
  endPoint: Coordinates,
  numPoints: number = 32
): Coordinates[] {
  const radius = calculateDistance(center, startPoint);
  const startAngle = bearingRad(center, startPoint);
  const endAngle = bearingRad(center, endPoint);
  let angleDiff = endAngle - startAngle;
  if (angleDiff > Math.PI) {
    angleDiff -= 2 * Math.PI;
  } else if (angleDiff < -Math.PI) {
    angleDiff += 2 * Math.PI;
  }

  const coords: Coordinates[] = [];
  coords.push({ ...center });
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const angle = startAngle + angleDiff * t;
    const point = destination(center, radius, angle);
    coords.push(point);
  }
  coords.push({ ...center });
  return coords;
}

export function createRectangleMode(): any {
  return {
    onSetup: function (): any {
      const polygon = (this as any).newFeature({
        type: 'Feature',
        properties: { shape: 'rectangle' },
        geometry: {
          type: 'Polygon',
          coordinates: [[]]
        }
      });
      (this as any).addFeature(polygon);
      (this as any).clearSelectedFeatures();
      (this as any).updateUIClasses({ mouse: 'add' });
      (this as any).activateUIButton('Polygon');
      (this as any).setActionableState({
        trash: true
      });
      return polygon;
    },
    onClick: function () {
      (this as any).updateUIClasses({ mouse: 'add' });
      const currentVertex = (this as any).getCurrent();
      if (currentVertex && currentVertex.properties.active !== 'true') {
        (this as any).updateUIClasses({ mouse: 'pointer' });
        (this as any).changeMode('simple_select', { featureIds: [currentVertex.id] });
      }
    },
    onTap: function (state: any, e: any) {
      this.onClick(state, e);
    }
  };
}

export function createRectangleCoordinates(
  center: Coordinates,
  handle: Coordinates
): Coordinates[] {
  const { mPerDegLat, mPerDegLng } = metersPerDegree(center.lat);
  const dx = (handle.lng - center.lng) * mPerDegLng; // east-west (m)
  const dy = (handle.lat - center.lat) * mPerDegLat; // north-south (m)
  const hw = Math.abs(dx);
  const hh = Math.abs(dy);
  const cornersEN: Array<{ x: number; y: number }> = [
    { x: -hw, y: +hh }, // top-left
    { x: +hw, y: +hh }, // top-right
    { x: +hw, y: -hh }, // bottom-right
    { x: -hw, y: -hh }, // bottom-left
  ];

  const corners = cornersEN.map(({ x, y }) => {
    const brg = Math.atan2(x, y); // radians from north
    const dist = Math.hypot(x, y);
    return destination(center, dist, brg);
  });

  return closeRing(corners);
}


export function createCircleMode(): any {
  return {
    onSetup: function (): any {
      const circle = (this as any).newFeature({
        type: 'Feature',
        properties: { shape: 'circle' },
        geometry: {
          type: 'Polygon',
          coordinates: [[]]
        }
      });
      (this as any).addFeature(circle);
      (this as any).clearSelectedFeatures();
      (this as any).updateUIClasses({ mouse: 'add' });
      (this as any).activateUIButton('Polygon');
      (this as any).setActionableState({
        trash: true
      });
      return circle;
    },
    onClick: function () {
      (this as any).updateUIClasses({ mouse: 'add' });
      const currentVertex = (this as any).getCurrent();
      if (currentVertex && currentVertex.properties.active !== 'true') {
        (this as any).updateUIClasses({ mouse: 'pointer' });
        (this as any).changeMode('simple_select', { featureIds: [currentVertex.id] });
      }
    },
    onTap: function (state: any, e: any) {
      this.onClick(state, e);
    }
  };
}

export function metersPerDegree(latDeg: number) {
  const φ = toRad(latDeg);
  const mPerDegLat =
    111132.92 - 559.82 * Math.cos(2 * φ) + 1.175 * Math.cos(4 * φ);
  const mPerDegLng =
    111412.84 * Math.cos(φ) - 93.5 * Math.cos(3 * φ);
  return { mPerDegLat, mPerDegLng };
}

export type LatLng = { lat: number; lng: number, alt: number };
export type LatLngMenual = { lat: number; lng: number, alt: number, heading: number };
export const isValidLatLng = (c: any): c is LatLng =>
  c &&
  Number.isFinite(c.lat) &&
  Number.isFinite(c.lng) &&
  c.lat >= -90 && c.lat <= 90 &&
  c.lng >= -180 && c.lng <= 180;

export const kmBetween = (a: LatLng, b: LatLng) => {
  const R = 6371; // km
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const s1 = Math.sin(dLat / 2), s2 = Math.sin(dLng / 2);
  const c = Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180);
  return 2 * R * Math.asin(Math.sqrt(s1 * s1 + c * s2 * s2));
};

type GeoJSONPoint = { type: "Coordinates"; coordinates: [number, number] };
type GeoJSONLineString = { type: "LineString"; coordinates: [number, number][] };
type GeoJSONPolygon = { type: "Polygon"; coordinates: [[number, number][]] };

type GeoJSONFeature = {
  type: "Feature";
  id?: string | number;
  properties: Record<string, any>;
  geometry: GeoJSONPoint | GeoJSONLineString | GeoJSONPolygon;
};

type GeoJSONFeatureCollection = {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
};

export function convertEntitiesToGeoJSON(entities: Entity[]): GeoJSONFeatureCollection {
  const features: GeoJSONFeature[] = entities.map((entity) => {
    const kind = entity.type.toLowerCase().trim();
    let geometry: GeoJSONFeature["geometry"];

    switch (kind) {
      case "polygon": {
        const ring = closeRing(entity.coordinates);
        geometry = { type: "Polygon", coordinates: [coordsToLngLatPairs(ring)] };
        break;
      }

      case "rectangle": {
        // If your app stores the rectangle ring in `entity.coordinates`, this works.
        // If you instead store {center, handle}, build it first via createRectangleCoordinates().
        const ring = closeRing(entity.coordinates);
        geometry = { type: "Polygon", coordinates: [coordsToLngLatPairs(ring)] };
        break;
      }

      case "line":
      case "polyline": {
        const line = entity.coordinates;
        if (line.length < 2) {
          throw new Error(`Line entity ${entity.id} must have at least 2 points`);
        }
        geometry = { type: "LineString", coordinates: coordsToLngLatPairs(line) };
        break;
      }

      case "circle": {
        const pts = entity.coordinates;
        if (pts.length >= 2) {
          const center = pts[0];
          const edge = pts[1];
          const ring = createCirclePolygon(center, edge, 2);
          geometry = { type: "Polygon", coordinates: [coordsToLngLatPairs(ring)] };
        } else if (pts.length === 1) {
          const p = pts[0];
          geometry = { type: "Coordinates", coordinates: [p.lng, p.lat] };
        } else {
          throw new Error(`Circle entity ${entity.id} requires at least center`);
        }
        break;
      }

      case "ellipse": {
        const pts = entity.coordinates;
        if (pts.length >= 2) {
          const center = pts[0];
          const edge = pts[1];
          const ring = createEllipsePolygon(center, edge, 2);
          geometry = { type: "Polygon", coordinates: [coordsToLngLatPairs(ring)] };
        } else {
          throw new Error(`Ellipse entity ${entity.id} requires center & edge`);
        }
        break;
      }

      case "marker":
      case "Coordinates": {
        if (entity.coordinates.length === 0) {
          throw new Error(`Marker entity ${entity.id} has no coordinates`);
        }
        const p = entity.coordinates[0];
        geometry = { type: "Coordinates", coordinates: [p.lng, p.lat] };
        break;
      }

      default:
        throw new Error(`Unsupported entity type: ${entity.type}`);
    }

    return {
      type: "Feature",
      id: entity.id,
      geometry,
      properties: {
        id: entity.id,
        type: entity.type,
        ...(entity as any).properties, // keep any extra style/meta your app attaches
      },
    };
  });

  return { type: "FeatureCollection", features };
}

export function calculateBoundingBox(coordinates: Coordinates[]): {
  north: number;
  south: number;
  east: number;
  west: number;
} {
  if (coordinates.length === 0) {
    return { north: 0, south: 0, east: 0, west: 0 };
  }

  const lats = coordinates.map(p => p.lat);
  const lngs = coordinates.map(p => p.lng);

  return {
    north: Math.max(...lats),
    south: Math.min(...lats),
    east: Math.max(...lngs),
    west: Math.min(...lngs)
  };
}

export function destPoint(lng: number, lat: number, bearingDeg: number, distanceM: number): [number, number] {
  const brng = (bearingDeg * Math.PI) / 180;
  const φ1 = (lat * Math.PI) / 180;
  const λ1 = (lng * Math.PI) / 180;
  const δ = distanceM / R;

  const sinφ1 = Math.sin(φ1), cosφ1 = Math.cos(φ1);
  const sinδ = Math.sin(δ), cosδ = Math.cos(δ);
  const sinφ2 = sinφ1 * cosδ + cosφ1 * sinδ * Math.cos(brng);
  const φ2 = Math.asin(sinφ2);
  const y = Math.sin(brng) * sinδ * cosφ1;
  const x = cosδ - sinφ1 * sinφ2;
  const λ2 = λ1 + Math.atan2(y, x);

  return [(λ2 * 180) / Math.PI, (φ2 * 180) / Math.PI];
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