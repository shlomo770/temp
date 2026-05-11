import React, { useEffect } from 'react';

interface MyPositionMarkerProps {
  map: { getLayer?: (id: string) => unknown; removeLayer?: (id: string) => void; getSource?: (id: string) => unknown; removeSource?: (id: string) => void };
}

const SRC_POS = 'my-position';
const LYR_POS = 'my-position-jeep-layer';

/**
 * מיקום "אני" מוצג ב-deck.gl (RealtimeDeckOverlay). נשאר רק ניקוי של שכבות GeoJSON ישנות אם נטענו בעבר.
 */
const MyPositionMarker: React.FC<MyPositionMarkerProps> = ({ map }) => {
  useEffect(() => {
    if (!map?.getLayer || !map.removeLayer || !map.getSource || !map.removeSource) return;
    try {
      if (map.getLayer(LYR_POS)) map.removeLayer(LYR_POS);
      if (map.getSource(SRC_POS)) map.removeSource(SRC_POS);
    } catch {
      /* */
    }
  }, [map]);

  return null;
};

export default MyPositionMarker;
