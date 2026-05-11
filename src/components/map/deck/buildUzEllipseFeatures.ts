import ellipse from '@turf/ellipse';

/** מינימום למניעת אליפסה בלתי נראית כשהשרת שולח 0 */
const UZ_MIN_SEMI_M = 12;

/**
 * UZ מהשרת: Ellipsis_A = אורך חיפוש אנכי/רוחב צלב־מסלול (מסובב 90° מכיוון הטיסה).
 * Ellipsis_C = מרחק אופקי בכיוון הטיסה (ציר ארוך בכיוון heading).
 */
export function buildUzEllipseFeatures(
  lng: number,
  lat: number,
  headingDeg: number,
  ellipsisA: number | undefined,
  ellipsisC: number | undefined,
  targetId: string
): { a: GeoJSON.Feature[]; c: GeoJSON.Feature[] } {
  const center: [number, number] = [lng, lat];
  const h = ((headingDeg % 360) + 360) % 360;
  const outA: GeoJSON.Feature[] = [];
  const outC: GeoJSON.Feature[] = [];

  if (Number.isFinite(ellipsisA) && ellipsisA! > 0) {
    const major = Math.max(ellipsisA! / 2, UZ_MIN_SEMI_M);
    const minor = Math.max(ellipsisA! / 8, UZ_MIN_SEMI_M * 0.5);
    try {
      outA.push(
        ellipse(center, major, minor, {
          units: 'meters',
          angle: h + 90,
          steps: 48,
          properties: { id: targetId, uzKind: 'A' },
        })
      );
    } catch {
      /* invalid geometry at pole etc. */
    }
  }

  if (Number.isFinite(ellipsisC) && ellipsisC! > 0) {
    const major = Math.max(ellipsisC! / 2, UZ_MIN_SEMI_M);
    const minor = Math.max(ellipsisC! / 8, UZ_MIN_SEMI_M * 0.5);
    try {
      outC.push(
        ellipse(center, major, minor, {
          units: 'meters',
          angle: h,
          steps: 48,
          properties: { id: targetId, uzKind: 'C' },
        })
      );
    } catch {
      /* */
    }
  }

  return { a: outA, c: outC };
}
