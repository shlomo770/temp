import { useMemo } from 'react';
import { useAppSelector } from './useAppSelector';
import {
  formatCoordinates,
  wgs84ToUTM,
  utmToWGS84,
  parseUtmManualInputToWgs84,
  type UTMCoordinates,
} from '../utils/coordinates';

/**
 * תצוגת קואורדינטות לפי Redux (כמו Status Bar).
 *
 * - **אמת במערכת** תמיד ב־WGS84: `lat` / `lng` (מעלות).
 * - `formatPos` — מחרוזת ל־UI בלבד.
 * - `toUtm` — מ־lat/lng לאובייקט UTM מספרי.
 * - `manualUtmToLatLng` — המשתמש ערך טקסט (מזרח+צפון, או אזור+מזרח+צפון) → `{ lat, lng }`.
 * - `fromUtm` — אובייקט UTM מלא → `{ lat, lng }`.
 */
export function useCoordinateFormat() {
  const isUTM = useAppSelector((s) => s.coordinates.isUTM);
  const utmZone = useAppSelector((s) => s.coordinates.utmZone);

  const formatPos = useMemo(
    () => (lat: number, lng: number) => {
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return '—';
      return formatCoordinates({ lat, lng }, isUTM, utmZone);
    },
    [isUTM, utmZone]
  );

  /** WGS84 → אובייקט UTM (מספרים). לא מחרוזת. */
  const toUtm = useMemo(
    () => (lat: number, lng: number): UTMCoordinates | null => {
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      try {
        return wgs84ToUTM({ lat, lng }, utmZone);
      } catch {
        return null;
      }
    },
    [utmZone]
  );

  /** UTM (אובייקט) → WGS84 — לשליחה לשרת / עדכון store */
  const fromUtm = (utm: UTMCoordinates) => utmToWGS84(utm);

  /** טקסט שהמשתמש ערך (UTM) → lat/lng. משתמש ב־`utmZone` מה־store כברירת מחדל לאזור. */
  const manualUtmToLatLng = useMemo(
    () => (text: string) =>
      parseUtmManualInputToWgs84(text, { defaultZone: utmZone }),
    [utmZone]
  );

  return { isUTM, utmZone, formatPos, toUtm, fromUtm, manualUtmToLatLng };
}
