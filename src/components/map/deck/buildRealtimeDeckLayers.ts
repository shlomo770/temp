import { IconLayer, PathLayer, PolygonLayer, ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import type { Layer } from '@deck.gl/core';
import { PathStyleExtension } from '@deck.gl/extensions';
import { bezierSpline, lineString } from '@turf/turf';
import type { Target } from '../../../store/slices/targetsSlice';
import type { MyPosition } from '../../../types';
import { buildUzEllipseFeatures } from './buildUzEllipseFeatures';

export const REALTIME_TARGET_ICON_LAYER_ID = 'realtime-target-icons';
export const REALTIME_TARGET_ABORT_LAYER_ID = 'realtime-target-abort';

/** dash + highPrecisionDash — נדרש לקו מעוקל ארוך; אחרת ה־shader מתנהג כמעט כרציף */
const TRAIL_PATH_DASH_EXT = new PathStyleExtension({
  dash: true,
  offset: false,
  highPrecisionDash: true,
});

const ICON_HEADING_OFFSET_DEG = -90;

const typeToIconName: Record<string, string> = {
  airplane: 'airplaneMedium_hostile',
  drone: 'droneMedium_hostile',
  helicopter: 'helicopter_hostile',
  human: 'unknown_hostile',
  vehicle: 'unknown_hostile',
  quadcopter: 'droneMedium_hostile',
  fighter: 'airplaneMedium_hostile',
};

function iconSizePx(zoom: number): number {
  if (!Number.isFinite(zoom)) return 32;
  const t = Math.max(0, Math.min(1, (zoom - 5) / 10));
  return 22 + t * 26;
}

function ringRadiusPx(zoom: number): number {
  if (!Number.isFinite(zoom)) return 28;
  const t = Math.max(0, Math.min(1, (zoom - 5) / 10));
  return 20 + t * 20;
}

function ringLinePx(zoom: number): number {
  if (!Number.isFinite(zoom)) return 3;
  const t = Math.max(0, Math.min(1, (zoom - 5) / 10));
  return 2.5 + t * 2;
}

function isAssignedLikeStatus(status: string | undefined): boolean {
  return (
    status === 'allocated' ||
    status === 'designated' ||
    status === 'track' ||
    status === 'arm'
  );
}

function polygonFromTurfFeature(f: GeoJSON.Feature): number[][] | null {
  const g = f.geometry;
  if (!g || g.type !== 'Polygon') return null;
  const ring = g.coordinates[0];
  if (!ring?.length) return null;
  return ring.map((c) => [c[0], c[1]]);
}

/** שובל מעוקל (Bézier spline) — לא פוליגון שבור בין נקודות דגימה */
function smoothTrailLngLatPath(trail: { lng: number; lat: number }[]): [number, number][] {
  const raw = trail.map((p) => [p.lng, p.lat] as [number, number]);
  if (raw.length < 2) return raw;
  if (raw.length === 2) return raw;
  try {
    const curved = bezierSpline(lineString(raw), {
      resolution: Math.max(3200, 11000 - raw.length * 400),
      sharpness: 0.58,
    });
    const coords = curved.geometry?.coordinates;
    if (!coords || coords.length < 2) return raw;
    return coords.map((c) => [c[0], c[1]] as [number, number]);
  } catch {
    return raw;
  }
}

export interface RealtimeDeckBuildInput {
  targets: { byId: Record<string, Target>; allIds: string[] };
  myPosition: MyPosition;
  zoom: number;
}

export function buildRealtimeDeckLayers(input: RealtimeDeckBuildInput): Layer[] {
  const { targets, myPosition, zoom } = input;
  const layers: Layer[] = [];

  const uzA: { polygon: number[][]; id: string }[] = [];
  const uzC: { polygon: number[][]; id: string }[] = [];
  const trailRows: { id: string; path: [number, number][] }[] = [];
  const markerRows: {
    id: string;
    lng: number;
    lat: number;
    iconRotation: number;
    iconUrl: string;
    destroyed: boolean;
  }[] = [];
  const labelRows: { id: string; lng: number; lat: number; text: string; destroyed: boolean }[] = [];
  const abortRows: { targetId: string; lng: number; lat: number; isAbortChip: true }[] = [];
  const ringRows: { lng: number; lat: number }[] = [];

  for (const id of targets.allIds) {
    const t = targets.byId[id];
    if (!t?.coordinates) continue;
    const lat = Number(t.coordinates.lat);
    const lng = Number(t.coordinates.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    const heading = t.heading ?? 0;
    const { a, c } = buildUzEllipseFeatures(lng, lat, heading, t.ellipsisA, t.ellipsisC, id);
    for (const f of a) {
      const polygon = polygonFromTurfFeature(f);
      if (polygon) uzA.push({ polygon, id });
    }
    for (const f of c) {
      const polygon = polygonFromTurfFeature(f);
      if (polygon) uzC.push({ polygon, id });
    }

    if (t.trail && t.trail.length >= 2) {
      trailRows.push({
        id,
        path: smoothTrailLngLatPath(t.trail),
      });
    }

    const destroyed = t.status === 'destroyed';
    const base = (t.type || 'unknown').toLowerCase();
    const iconName = typeToIconName[base] || 'unknown_hostile';
    const iconRotation = ((heading + ICON_HEADING_OFFSET_DEG + 360) % 360);
    const iconUrl = destroyed ? '/icons/x.png' : `/icons/targets/${iconName}.png`;
    markerRows.push({
      id,
      lng,
      lat,
      iconRotation,
      iconUrl,
      destroyed,
    });

    if (!destroyed) {
      const altStr = t.coordinates.alt != null ? String(t.coordinates.alt) : '';
      const text = altStr ? `${t.id}\n${altStr}` : t.id;
      labelRows.push({ id, lng, lat, text, destroyed: false });
    }

    if (isAssignedLikeStatus(t.status)) {
      ringRows.push({ lng, lat });
      abortRows.push({ targetId: id, lng, lat, isAbortChip: true });
    }
  }

  /** אנכית מתחת לאייקון + לייבל (אותו anchor כמו הלייבלים) */
  const abortPixelOffsetY = Math.round(iconSizePx(zoom) * 0.52 + 18 + 12 + 12 + 6);

  if (uzA.length) {
    layers.push(
      new PolygonLayer({
        id: 'realtime-uz-a-fill',
        data: uzA,
        getPolygon: (d) => d.polygon,
        getFillColor: [56, 189, 248, 46],
        stroked: false,
        filled: true,
        pickable: false,
      })
    );
  }
  if (uzC.length) {
    layers.push(
      new PolygonLayer({
        id: 'realtime-uz-c-fill',
        data: uzC,
        getPolygon: (d) => d.polygon,
        getFillColor: [251, 146, 60, 46],
        stroked: false,
        filled: true,
        pickable: false,
      })
    );
  }

  if (trailRows.length) {
    layers.push(
      new PathLayer({
        id: 'realtime-target-trails',
        data: trailRows,
        extensions: [TRAIL_PATH_DASH_EXT],
        getPath: (d) => d.path,
        getColor: [255, 255, 255, 230],
        getWidth: 3,
        widthUnits: 'pixels',
        capRounded: true,
        jointRounded: true,
        pickable: false,
        /** אורך מקווקו ורווח — מכפילי עובי הקו (רואים בבירור מקווקו) */
        getDashArray: [4, 3],
        /** justified על path ארוך/מעוקל לפעמים מכתיב יחידה אחת לכל הקו ונראה רציף */
        dashJustified: false,
      })
    );
  }

  if (ringRows.length) {
    const r = ringRadiusPx(zoom);
    const lw = ringLinePx(zoom);
    layers.push(
      new ScatterplotLayer({
        id: 'realtime-target-rings',
        data: ringRows,
        getPosition: (d) => [d.lng, d.lat],
        getRadius: r,
        radiusUnits: 'pixels',
        stroked: true,
        filled: false,
        getLineColor: [221, 65, 65, 230],
        getLineWidth: lw,
        lineWidthUnits: 'pixels',
        billboard: true,
        pickable: false,
      })
    );
  }

  if (markerRows.length) {
    const px = iconSizePx(zoom);
    layers.push(
      new IconLayer({
        id: REALTIME_TARGET_ICON_LAYER_ID,
        data: markerRows,
        pickable: true,
        sizeUnits: 'pixels',
        sizeScale: 1,
        getPosition: (d) => [d.lng, d.lat],
        getIcon: (d) => ({
          url: d.iconUrl,
          width: 128,
          height: 128,
        }),
        getSize: (d) => (d.destroyed ? px * 0.55 : px),
        getAngle: (d) => (d.destroyed ? 0 : d.iconRotation),
        loadOptions: { image: { type: 'image' } },
      })
    );
  }

  if (labelRows.length) {
    layers.push(
      new TextLayer({
        id: 'realtime-target-labels',
        data: labelRows,
        getPosition: (d) => [d.lng, d.lat],
        getText: (d) => d.text,
        getColor: [255, 255, 255, 255],
        getSize: 12,
        sizeUnits: 'pixels',
        getAlignmentBaseline: 'top',
        getPixelOffset: [0, 18],
        outlineColor: [0, 0, 0, 200],
        outlineWidth: 2,
        fontFamily: 'Arial, Helvetica, sans-serif',
        pickable: false,
        billboard: true,
      })
    );
  }

  if (abortRows.length) {
    layers.push(
      new TextLayer({
        id: REALTIME_TARGET_ABORT_LAYER_ID,
        data: abortRows,
        pickable: true,
        billboard: true,
        characterSet: 'auto',
        getPosition: (d) => [d.lng, d.lat],
        getText: () => 'ביטול',
        getAlignmentBaseline: 'top',
        getTextAnchor: 'middle',
        getPixelOffset: [0, abortPixelOffsetY],
        getSize: 12,
        sizeUnits: 'pixels',
        getColor: [255, 255, 255, 255],
        background: true,
        getBackgroundColor: [220, 38, 38, 250],
        getBorderWidth: 0,
        backgroundPadding: [8, 4],
        backgroundBorderRadius: 6,
        fontFamily: 'Arial, Helvetica, sans-serif',
      })
    );
  }

  const selfLat = Number(myPosition?.coordinates?.lat);
  const selfLng = Number(myPosition?.coordinates?.lng);
  const selfHeading = Number(myPosition?.heading ?? 0);
  if (Number.isFinite(selfLat) && Number.isFinite(selfLng)) {
    layers.push(
      new IconLayer({
        id: 'realtime-self-position',
        data: [{ lng: selfLng, lat: selfLat, heading: selfHeading }],
        pickable: false,
        sizeUnits: 'pixels',
        getPosition: (d) => [d.lng, d.lat],
        getIcon: () => ({
          url: '/icons/123.png',
          width: 128,
          height: 128,
        }),
        getSize: iconSizePx(zoom) * 1.1,
        getAngle: (d) => ((d.heading % 360) + 360) % 360,
        loadOptions: { image: { type: 'image' } },
      })
    );
  }

  return layers;
}
