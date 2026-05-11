import { FC, MutableRefObject, useEffect, useMemo, useRef, useState } from 'react';
import type { PickingInfo } from '@deck.gl/core';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { useAppSelector } from '../../../hooks/useAppSelector';
import { buildRealtimeDeckLayers } from './buildRealtimeDeckLayers';

interface RealtimeDeckOverlayProps {
  /** מפת MapLibre (אובייקט runtime מלא) */
  map: any;
  overlayRef?: MutableRefObject<MapboxOverlay | null>;
  onAbortTarget?: (targetId: string) => void;
}

const RealtimeDeckOverlay: FC<RealtimeDeckOverlayProps> = ({ map, overlayRef, onAbortTarget }) => {
  const targets = useAppSelector((s) => s.targets);
  const myPosition = useAppSelector((s) => s.myPosition);
  const [zoom, setZoom] = useState(() => (typeof map?.getZoom === 'function' ? map.getZoom() : 10));

  const overlay = useMemo(
    () =>
      new MapboxOverlay({
        interleaved: true,
        layers: [],
      }),
    []
  );

  const onAbortRef = useRef(onAbortTarget);
  onAbortRef.current = onAbortTarget;

  useEffect(() => {
    if (overlayRef) overlayRef.current = overlay;
    return () => {
      if (overlayRef) overlayRef.current = null;
    };
  }, [overlay, overlayRef]);

  useEffect(() => {
    if (!map?.getZoom) return;
    const syncZoom = () => setZoom(map.getZoom());
    syncZoom();
    map.on('zoom', syncZoom);
    map.on('zoomend', syncZoom);
    return () => {
      map.off('zoom', syncZoom);
      map.off('zoomend', syncZoom);
    };
  }, [map]);

  const layers = useMemo(
    () =>
      buildRealtimeDeckLayers({
        targets,
        myPosition,
        zoom,
      }),
    [
      targets.byId,
      targets.allIds,
      myPosition.coordinates.lat,
      myPosition.coordinates.lng,
      myPosition.coordinates.alt,
      myPosition.heading,
      zoom,
    ]
  );

  useEffect(() => {
    overlay.setProps({
      layers,
      onClick: (info: PickingInfo, _event: unknown) => {
        const o = info.object as { isAbortChip?: boolean; targetId?: string } | null;
        if (o?.isAbortChip && typeof o.targetId === 'string') {
          onAbortRef.current?.(o.targetId);
          return true;
        }
        return false;
      },
    });
  }, [overlay, layers]);

  const addedRef = useRef(false);
  useEffect(() => {
    if (!map) return;
    map.addControl(overlay);
    addedRef.current = true;
    return () => {
      if (!addedRef.current) return;
      addedRef.current = false;
      try {
        if (typeof map.hasControl === 'function' && map.hasControl(overlay)) {
          map.removeControl(overlay);
        } else {
          map.removeControl(overlay);
        }
      } catch {
        try {
          overlay.finalize();
        } catch {
          /* */
        }
      }
    };
  }, [map, overlay]);

  return null;
};

export default RealtimeDeckOverlay;
