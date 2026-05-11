import type { MapboxOverlay } from '@deck.gl/mapbox';
import {
  REALTIME_TARGET_ABORT_LAYER_ID,
  REALTIME_TARGET_ICON_LAYER_ID,
} from './buildRealtimeDeckLayers';

type PickObj = { isAbortChip?: boolean; targetId?: string; id?: string } | null;

export function pickRealtimeTargetIdsAtPoint(
  overlay: MapboxOverlay | null | undefined,
  x: number,
  y: number,
  radius = 22
): string[] {
  if (!overlay) return [];
  try {
    const picks = overlay.pickMultipleObjects({
      x,
      y,
      radius,
      layerIds: [REALTIME_TARGET_ABORT_LAYER_ID, REALTIME_TARGET_ICON_LAYER_ID],
      depth: 24,
    });
    if (!picks?.length) return [];
    const ids: string[] = [];
    for (const p of picks) {
      const o = p.object as PickObj;
      const id =
        o?.isAbortChip && typeof o.targetId === 'string'
          ? o.targetId
          : typeof o?.id === 'string'
            ? o.id
            : null;
      if (typeof id === 'string' && !ids.includes(id)) ids.push(id);
    }
    return ids;
  } catch {
    return [];
  }
}
