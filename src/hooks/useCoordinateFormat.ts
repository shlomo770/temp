import { useMemo } from 'react';
import { useAppSelector } from './useAppSelector';
import { formatCoordinates } from '../utils/coordinates';

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

  return { isUTM, utmZone, formatPos };
}


