import { FC, memo, useState, useEffect, useMemo, useCallback } from 'react';

interface TargetLabelProps {
  target: {
    id: string;
    name?: string;
    coordinates: { lat: number; lng: number };
    type: string;
    speed: number;
    heading: number;
  };
  map: any;
  onClose?: () => void;
  hasOverlap?: boolean;
}

const TargetLabel: FC<TargetLabelProps> = memo(({ target, map, hasOverlap = false }) => {
  if (!map) return null;

  const [throttledPosition, setThrottledPosition] = useState(() => ({
    lng: target.coordinates.lng,
    lat: target.coordinates.lat
  }));

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const positionChanged =
        Math.abs(throttledPosition.lat - target.coordinates.lat) > 0.00001 ||
        Math.abs(throttledPosition.lng - target.coordinates.lng) > 0.00001;

      if (positionChanged) {
        setThrottledPosition({
          lng: target.coordinates.lng,
          lat: target.coordinates.lat
        });
      }
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [target.coordinates.lng, target.coordinates.lat, throttledPosition]);

  const [pixel, setPixel] = useState(() =>
    map.project([throttledPosition.lng, throttledPosition.lat])
  );

  const updatePixelPosition = useCallback(() => {
    const newPixel = map.project([throttledPosition.lng, throttledPosition.lat]);
    setPixel(newPixel);
  }, [map, throttledPosition.lng, throttledPosition.lat]);

  useEffect(() => {
    if (!map) return;
    updatePixelPosition();
    map.on('move', updatePixelPosition);
    map.on('zoom', updatePixelPosition);
    return () => {
      map.off('move', updatePixelPosition);
      map.off('zoom', updatePixelPosition);
    };
  }, [map, updatePixelPosition]);

  const positioning = useMemo(() => {
    const zoom = map?.getZoom() ?? 10;
    const baseOffset = 42;
    const zoomOffset = baseOffset + (zoom * 2);
    return {
      left: pixel.x + zoomOffset,
      top: Math.max(10, pixel.y + 12),
      transform: 'none',
      isLeftSide: false,
      isTopSide: true
    };
  }, [pixel.x, pixel.y, map]);

  return (
    <div
      className="fixed pointer-events-none z-50 max-w-xs"
      style={{
        left: positioning.left,
        top: positioning.top,
        transform: positioning.transform,
      }}
    >
      <div className="text-center">
        {!hasOverlap && (
          <>
            <div className="text-sm font-bold text-white" style={{
              textShadow: '2px 2px 4px rgba(0,0,0,1), -2px -2px 4px rgba(0,0,0,1), 2px -2px 4px rgba(0,0,0,1), -2px 2px 4px rgba(0,0,0,1), 0px 0px 8px rgba(0,0,0,0.8)'
            }}>
              {target.id}
            </div>

            <div className="text-xs text-white" style={{
              textShadow: '2px 2px 4px rgba(0,0,0,1), -2px -2px 4px rgba(0,0,0,1), 2px -2px 4px rgba(0,0,0,1), -2px 2px 4px rgba(0,0,0,1), 0px 0px 8px rgba(0,0,0,0.8)'
            }}>
              {target.heading.toFixed(0)}° | {target.speed.toFixed(1)} kts
            </div>
          </>
        )}
      </div>

    </div>
  );
}, (prevProps, nextProps) => {
  const POSITION_TOLERANCE = 0.0001;
  const SPEED_TOLERANCE = 0.1;
  const HEADING_TOLERANCE = 1;

  const positionChanged =
    Math.abs(prevProps.target.coordinates.lat - nextProps.target.coordinates.lat) > POSITION_TOLERANCE ||
    Math.abs(prevProps.target.coordinates.lng - nextProps.target.coordinates.lng) > POSITION_TOLERANCE;

  const speedChanged =
    Math.abs(prevProps.target.speed - nextProps.target.speed) > SPEED_TOLERANCE;

  const headingChanged =
    Math.abs(prevProps.target.heading - nextProps.target.heading) > HEADING_TOLERANCE;

  return (
    prevProps.target.id === nextProps.target.id &&
    (prevProps.target.name ?? '') === (nextProps.target.name ?? '') &&
    !positionChanged &&
    prevProps.target.type === nextProps.target.type &&
    !speedChanged &&
    !headingChanged &&
    prevProps.map === nextProps.map
  );
});

TargetLabel.displayName = 'TargetLabel';
export default TargetLabel;
