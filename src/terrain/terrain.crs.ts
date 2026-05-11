import proj4 from "proj4";

function inferEpsgFromImageBBox(image: any): number {
  const bb = image?.getBoundingBox?.();
  if (!bb || bb.length < 4) return 4326;

  const [w, s, e, n] = bb;

  const looksLikeDegrees =
    Number.isFinite(w) &&
    Number.isFinite(s) &&
    Number.isFinite(e) &&
    Number.isFinite(n) &&
    w >= -180 &&
    e <= 180 &&
    s >= -90 &&
    n <= 90 &&
    Math.abs(e - w) < 360 &&
    Math.abs(n - s) < 180;

  if (looksLikeDegrees) {
    return 4326;
  }

  const likelyIsraelITM =
    Number.isFinite(w) &&
    Number.isFinite(s) &&
    Number.isFinite(e) &&
    Number.isFinite(n) &&
    e > w &&
    n > s &&
    w >= 50000 &&
    e <= 500000 &&
    s >= 300000 &&
    n <= 900000;

  if (likelyIsraelITM) {
    return 2039;
  }

  return 4326;
}

export function inferEpsg(image: any): number | null {
  const geoKeys = image?.getGeoKeys?.() ?? {};
  const projected = Number(geoKeys.ProjectedCSTypeGeoKey);
  const geographic = Number(geoKeys.GeographicTypeGeoKey);

  if (Number.isFinite(projected) && projected > 0 && projected !== 32767) {
    return projected;
  }

  if (Number.isFinite(geographic) && geographic > 0) {
    return geographic;
  }

  return inferEpsgFromImageBBox(image);
}

export function transformPoint(
  fromEpsg: number | null,
  toEpsg: number | null,
  x: number,
  y: number
): [number, number] {
  if (!fromEpsg || !toEpsg || fromEpsg === toEpsg) {
    return [x, y];
  }

  return proj4(`EPSG:${fromEpsg}`, `EPSG:${toEpsg}`, [x, y]) as [number, number];
}