import proj4 from 'proj4';

const WGS84 = '+proj=longlat +datum=WGS84 +no_defs';

export interface WGS84Coordinates {
  lat: number;
  lng: number;
}

export interface UTMCoordinates {
  easting: number;
  northing: number;
  zone: number;
  /** N = צפון המשווה, S = דרום */
  hemisphere: 'N' | 'S';
}

/**
 * Convert WGS84 coordinates to UTM (אזור קבוע — חייב להתאים לאזור הגאוגרפי של הנקודה)
 */
export function wgs84ToUTM(coords: WGS84Coordinates, zone: number = 36): UTMCoordinates {
  const utmProj = `+proj=utm +zone=${zone} +datum=WGS84 +units=m +no_defs`;
  const [easting, northing] = proj4(WGS84, utmProj, [coords.lng, coords.lat]);

  return {
    easting: Math.round(easting),
    northing: Math.round(northing),
    zone,
    hemisphere: coords.lat >= 0 ? 'N' : 'S',
  };
}

/**
 * Convert UTM coordinates to WGS84
 */
export function utmToWGS84(coords: UTMCoordinates): WGS84Coordinates {
  const utmProj = `+proj=utm +zone=${coords.zone} +datum=WGS84 +units=m +no_defs`;
  const [lng, lat] = proj4(utmProj, WGS84, [coords.easting, coords.northing]);
  
  return {
    lat,
    lng
  };
}

/**
 * Format WGS84 coordinates for display
 */
export function formatWGS84(coords: WGS84Coordinates): string {
  const lat = coords.lat.toFixed(6);
  const lng = coords.lng.toFixed(6);
  return `${lat}, ${lng}`;
}

/**
 * מחרוזת לתצוגה בלבד. לחישובים — השתמש ב־`wgs84ToUTM` / `utmToWGS84` עם `UTMCoordinates`.
 * לא מומלץ לפרסר את המחרוזת חזרה (תלוי locale ופורמט).
 */
export function formatUTM(coords: UTMCoordinates): string {
  const easting = coords.easting.toLocaleString();
  const northing = coords.northing.toLocaleString();
  const hemi = coords.hemisphere;
  return `${coords.zone}${hemi} · E ${easting} · N ${northing}`;
}

/**
 * Format coordinates based on current system
 */
export function formatCoordinates(
  coords: WGS84Coordinates,
  isUTM: boolean,
  zone: number = 36
): string {
  if (!coords || !Number.isFinite(coords.lat) || !Number.isFinite(coords.lng)) {
    return '—';
  }

  if (isUTM) {
    try {
      const utmCoords = wgs84ToUTM(coords, zone);
      return formatUTM(utmCoords);
    } catch {
      return formatWGS84(coords);
    }
  }
  return formatWGS84(coords);
}

/**
 * Auto-detect UTM zone from longitude
 */
export function getUTMZone(lng: number): number {
  return Math.floor((lng + 180) / 6) + 1;
}

/**
 * קלט ידני (מחרוזת אחת) → WGS84.
 * מחלץ מספרים מהטקסט (מתעלם מטקסט/סימנים).
 *
 * פורמטים נתמכים:
 * - שני מספרים: מזרח, צפון — האזור מגיע מ־`defaultZone`.
 * - שלושה מספרים: אזור (1–60), מזרח, צפון.
 *
 * אחרי ההמרה בודקים ש־lat/lng בטווח תקין.
 */
export function parseUtmManualInputToWgs84(
  raw: string,
  options: { defaultZone: number; hemisphere?: 'N' | 'S' }
): WGS84Coordinates | null {
  const hemisphere = options.hemisphere ?? 'N';
  const nums =
    raw.match(/\d+/g)?.map((s) => parseInt(s, 10)) ?? [];
  if (nums.length < 2) return null;

  let zone = options.defaultZone;
  let easting: number;
  let northing: number;

  if (
    nums.length >= 3 &&
    nums[0] >= 1 &&
    nums[0] <= 60 &&
    nums[1] >= 100_000 &&
    nums[1] <= 999_999
  ) {
    zone = nums[0];
    easting = nums[1];
    northing = nums[2];
  } else {
    easting = nums[0];
    northing = nums[1];
  }

  if (!Number.isFinite(easting) || !Number.isFinite(northing)) return null;

  try {
    const out = utmToWGS84({ easting, northing, zone, hemisphere });
    if (
      out.lat < -90 ||
      out.lat > 90 ||
      out.lng < -180 ||
      out.lng > 180 ||
      Number.isNaN(out.lat) ||
      Number.isNaN(out.lng)
    ) {
      return null;
    }
    return out;
  } catch {
    return null;
  }
}

/**
 * שלושה מספרים נפרדים (מומלץ בטופס) → WGS84.
 */
export function utmPartsToWgs84(
  easting: number,
  northing: number,
  zone: number,
  hemisphere: 'N' | 'S' = 'N'
): WGS84Coordinates | null {
  if (!Number.isFinite(easting) || !Number.isFinite(northing) || !Number.isFinite(zone)) {
    return null;
  }
  try {
    const out = utmToWGS84({
      easting: Math.round(easting),
      northing: Math.round(northing),
      zone: Math.round(zone),
      hemisphere,
    });
    if (
      out.lat < -90 ||
      out.lat > 90 ||
      out.lng < -180 ||
      out.lng > 180 ||
      Number.isNaN(out.lat) ||
      Number.isNaN(out.lng)
    ) {
      return null;
    }
    return out;
  } catch {
    return null;
  }
} 