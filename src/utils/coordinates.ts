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
  hemisphere: 'N' | 'S';
}


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


export function utmToWGS84(coords: UTMCoordinates): WGS84Coordinates {
  const utmProj = `+proj=utm +zone=${coords.zone} +datum=WGS84 +units=m +no_defs`;
  const [lng, lat] = proj4(utmProj, WGS84, [coords.easting, coords.northing]);

  return {
    lat,
    lng
  };
}


export function parseUTMString(value: string): UTMCoordinates {

  const cleaned = value
    .replace(/\s+/g, ' ')
    .replace(/·/g, ' ')
    .trim();

  const match = cleaned.match(
    /^(\d{1,2})([NS])\s+E\s*([\d,]+)\s+N\s*([\d,]+)$/i
  );

  if (!match) {
    throw new Error(`Invalid UTM string: ${value}`);
  }

  const [, zoneStr, hemisphereStr, eastingStr, northingStr] = match;

  return {
    zone: Number(zoneStr),
    hemisphere: hemisphereStr.toUpperCase() as 'N' | 'S',
    easting: Number(eastingStr.replace(/,/g, '')),
    northing: Number(northingStr.replace(/,/g, '')),
  };
}


export function formatWGS84(coords: WGS84Coordinates): string {
  const lat = coords.lat.toFixed(6);
  const lng = coords.lng.toFixed(6);
  return `${lat}, ${lng}`;
}


export function formatUTM(coords: UTMCoordinates): string {
  const easting = coords.easting.toLocaleString();
  const northing = coords.northing.toLocaleString();
  const hemi = coords.hemisphere;
  return `${coords.zone}${hemi} · E ${easting} · N ${northing}`;
}


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


export function getUTMZone(lng: number): number {
  return Math.floor((lng + 180) / 6) + 1;
}