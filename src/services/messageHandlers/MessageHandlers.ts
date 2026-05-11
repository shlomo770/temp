import { Store } from 'redux';
import { isValidLatLng } from '../../utils/validation';
import {
  addEntity,
  removeEntity,
  confirmEntityCreated,
  setMissionList,
  setActiveMissionName,
  upsertMissionName,
  setMissionEntityIds,
} from '../../store/slices/entitiesSlice';
import { setMyPosition } from '../../store/slices/myPositionSlice';
import { setTmapsParams, type TmapsParamsState } from '../../store/slices/tmapsParamsSlice';
import type { Coordinates } from '../../types';
import { applyTargetsFrame, type Target } from '../../store/slices/targetsSlice';
import { setLOS } from '../../store/slices/losSlice';
import { updateServerValues, setStatus, setRadarNonCoverage, updateParamsValues } from '../../store/slices/radarSlice';
import { setGunStatus, setMissileHealth } from '../../store/slices/gunSlice';
import { setCategorySnapshot } from "../../store/slices/faultsSlice";
import { showPrompt } from "../../store/slices/confirmSlice";
import { mapPayloadToSnapshot } from "../../faults/faultsMapping";
import { setInsStatus } from '../../store/slices/insSlice';
import { upsertMissile } from '../../store/slices/missilesSlice';
import { appendLog } from '../../store/slices/logsSlice';
import { TARGET_CLASSIFICATION_TO_TYPE } from '../../types/targets';
import { ErrorSeverityE, ErrorStateE } from "../../enums/general.enum";
import { InsStatusE, GunStatusE } from "../../enums/statusBar.enum";
import { normalizeRawEntityToStore } from '../entities/serverEntityNormalize';

export interface MessageHandler {
  (data: any, store: Store): void;
}

const __TARGETS_RT = {
  lastUpdate: {} as Record<string, number>,
  seenAt: {} as Record<string, number>,
  stamp: 0,
  cleanupStarted: false,
  lastReconcileAt: 0,
};

/** נרמול רשימת משימות מהשרת + שמירה על המשימה הפעילה ברשימה גם אם השרת עדיין לא החזיר אותה */
function applyMissionsListPayload(data: any, store: Store) {
  if (!data) return;
  let raw: unknown[] = [];
  if (Array.isArray(data)) {
    raw = data;
  } else if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    if (Array.isArray(d.missions)) raw = d.missions as unknown[];
    else if (Array.isArray(d.list)) raw = d.list as unknown[];
    else raw = Object.values(d);
  }
  let list = raw.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
  const active = store.getState().entities.activeMissionName;
  if (active && !list.includes(active)) {
    list = [...list, active];
  }
  list.sort((a, b) => a.localeCompare(b, 'he'));
  store.dispatch(setMissionList(list));
}

function parseMissionEntitiesField(entitiesField: unknown): unknown[] {
  if (entitiesField == null) return [];
  if (Array.isArray(entitiesField)) return entitiesField;
  if (typeof entitiesField === 'string') {
    try {
      const parsed = JSON.parse(entitiesField);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === 'object') return Object.values(parsed as Record<string, unknown>);
    } catch {
      return [];
    }
    return [];
  }
  return [];
}

function applyMissionDataPayload(data: any, store: Store) {
  if (!data) return;
  const entitiesArray = parseMissionEntitiesField(data.entities);
  const mn =
    typeof data.mission_name === 'string' && data.mission_name.trim()
      ? data.mission_name.trim()
      : null;
  if (!mn) return;

  const ids: string[] = [];
  for (const raw of entitiesArray) {
    const entity = normalizeRawEntityToStore(raw);
    if (!entity?.id) continue;
    store.dispatch(addEntity(entity));
    ids.push(entity.id);
  }
  store.dispatch(setMissionEntityIds({ missionName: mn, entityIds: ids }));
  store.dispatch(setActiveMissionName(mn));
  store.dispatch(upsertMissionName(mn));
}

/** תומך בגוף ישיר או עטוף (payload / result / data וכו׳) */
function unwrapGetDbPayload(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  const hasTop =
    Array.isArray(d.entities as unknown[]) ||
    Array.isArray(d.Entities as unknown[]) ||
    Array.isArray(d.missions as unknown[]) ||
    Array.isArray(d.Missions as unknown[]);
  if (hasTop) return d;

  const nested =
    d.data ?? d.payload ?? d.result ?? d.body ?? d.db ?? d.GET_DB ?? d.content ?? d.response;
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    const n = nested as Record<string, unknown>;
    const hasNested =
      Array.isArray(n.entities as unknown[]) ||
      Array.isArray(n.Entities as unknown[]) ||
      Array.isArray(n.missions as unknown[]) ||
      Array.isArray(n.Missions as unknown[]);
    if (hasNested) return n;
  }
  return d;
}

function applyGetDbPayload(data: any, store: Store) {
  const unwrapped = unwrapGetDbPayload(data);
  if (!unwrapped) return;
  const d = unwrapped;
  const rawEntities = d.entities ?? d.Entities;
  const rawMissions = d.missions ?? d.Missions;

  if (Array.isArray(rawEntities)) {
    for (const raw of rawEntities) {
      const e = normalizeRawEntityToStore(raw);
      if (e) store.dispatch(addEntity(e));
    }
  }

  if (Array.isArray(rawMissions)) {
    const names: string[] = [];
    for (const m of rawMissions) {
      if (typeof m === 'string') {
        const n = m.trim();
        if (!n) continue;
        names.push(n);
        store.dispatch(upsertMissionName(n));
        continue;
      }
      if (m && typeof m === 'object') {
        const o = m as Record<string, unknown>;
        const name = String(o.name ?? o.mission_name ?? '').trim();
        if (!name) continue;
        names.push(name);
        const idsRaw = o.entityIds ?? o.entity_ids ?? o.ids;
        const entityIds = Array.isArray(idsRaw)
          ? idsRaw.map((x) => String(x)).filter(Boolean)
          : [];
        store.dispatch(setMissionEntityIds({ missionName: name, entityIds }));
        store.dispatch(upsertMissionName(name));
      }
    }
    const uniqueNames = [...new Set(names)].sort((a, b) => a.localeCompare(b, 'he'));
    store.dispatch(setMissionList(uniqueNames));
  }
}

const TARGETS_UPDATE_THROTTLE_MS = 50;
const TARGETS_CLEANUP_MS = 5000;
const TARGETS_RECONCILE_GRACE = 2;
const TARGETS_RECONCILE_EVERY_MS = 350;

function parseTargetFromTARGETS(t: any) {
  if (t?.WCS_Target_Number == null && t?.latitude == null && t?.Latitude == null) return null;
  const lat = Number(t.Latitude ?? t.latitude);
  const lng = Number(t.Longitude ?? t.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  const id = String(t.WCS_Target_Number ?? 'unknown');
  const alt = Number.isFinite(Number(t.Altitude ?? t.altitude)) ? Number(t.Altitude ?? t.altitude) : undefined;
  const vn = Number(t.Velocity_North) || 0;
  const ve = Number(t.Velocity_East) || 0;
  const vup = Number(t.Velocity_Vup);
  const speedMs = Math.sqrt(vn * vn + ve * ve);
  const speedKts = speedMs * 1.943844;
  const headingRad = Math.atan2(ve, vn);
  const headingDeg = ((headingRad * 180) / Math.PI + 360) % 360;
  const classification = Number(t.Target_Classification);
  const type = TARGET_CLASSIFICATION_TO_TYPE[classification] ?? 'unknown';
  return {
    id,
    coordinates: { lat, lng, alt },
    heading: headingDeg,
    speed: speedKts,
    type,
    status: 'active',
    velocityVup: Number.isFinite(vup) ? vup : undefined,
    timeTag: Number.isFinite(Number(t.Time_Tag)) ? Number(t.Time_Tag) : undefined,
    flightMode: Number.isFinite(Number(t.Flight_Mode)) ? Number(t.Flight_Mode) : undefined,
    ellipsisA: Number.isFinite(Number(t.Ellipsis_A)) ? Number(t.Ellipsis_A) : undefined,
    ellipsisC: Number.isFinite(Number(t.Ellipsis_C)) ? Number(t.Ellipsis_C) : undefined,
  };
}

/** נקודת lat/lng/alt מהשרת (gps / tmaps / manual) */
function parseLLA(p: unknown): Coordinates | null {
  if (!p || typeof p !== 'object') return null;
  const o = p as Record<string, unknown>;
  const lat = Number(o.lat);
  const lng = Number(o.lng);
  if (!isValidLatLng({ lat, lng })) return null;
  const altRaw = Number(o.alt);
  const alt = Number.isFinite(altRaw) ? altRaw : 0;
  return { lat, lng, alt };
}

/**
 * נרמול LOS מינימלי: כרגע השרת שולח רק אזימוט.
 */
function parseLosFromPayload(payload: unknown): number | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const p = payload as Record<string, unknown>;
  const src = (p.los && typeof p.los === "object" ? p.los : p) as Record<string, unknown>;
  const keys = [
    "gunAzimut",
    "gun_azimut",
    "gunAzimuth",
    "gun_azimuth",
    "GunAzimut",
    "GunAzimuth",
    "azimuthDeg",
    "azimuth_deg",
    "azimuth",
    "Azimuth",
    "angleDeg",
    "angle_deg",
    "angle",
  ];
  const pick = (obj: Record<string, unknown>): unknown => {
    for (const k of keys) {
      if (obj[k] !== undefined && obj[k] !== null) return obj[k];
    }
    for (const v of Object.values(obj)) {
      if (v && typeof v === "object" && !Array.isArray(v)) {
        const nested = pick(v as Record<string, unknown>);
        if (nested !== undefined) return nested;
      }
    }
    return undefined;
  };
  const raw = pick(src);
  const azimuth = Number(raw);
  if (!Number.isFinite(azimuth)) return undefined;
  return ((azimuth % 360) + 360) % 360;
}

function applyLosAzimuthToMyPosition(payload: unknown, store: Store) {
  const gunAzimut = parseLosFromPayload(payload);
  if (!Number.isFinite(gunAzimut)) return;
  const m = store.getState().myPosition;
  store.dispatch(setMyPosition({
    coordinates: m.coordinates,
    heading: m.heading ?? 0,
    gunAzimut,
    los: m.los,
  }));
}

/**
 * הודעת TMAPS_PARAMS החדשה: שומר את כל השדות ב-slice ייעודי,
 * ומעדכן את מיקום המפה (myPosition) לפי עדיפות: manual (אם use_manual) → gps (אם use_gps) → tmaps → כל מה שקיים.
 */
function applyTmapsParamsFromPayload(data: unknown, store: Store) {
  const d = (data ?? {}) as Record<string, unknown>;
  const gps = parseLLA(d.gps_pos);
  const tmaps = parseLLA(d.tmaps_pos);
  const manual = parseLLA(d.manual_pos);
  const useGps = Boolean(d.use_gps);
  const useManual = Boolean(d.use_manual);
  const heading = Number.isFinite(Number(d.heading)) ? Number(d.heading) : 0;
  const pitch = Number.isFinite(Number(d.pitch)) ? Number(d.pitch) : 0;
  const roll = Number.isFinite(Number(d.roll)) ? Number(d.roll) : 0;
  const dist = Number.isFinite(Number(d.distance_travelled)) ? Number(d.distance_travelled) : 0;
  const zoneRaw = Number(d.zone);
  const zone = Number.isFinite(zoneRaw) ? zoneRaw : null;
  const figRaw = Number(d.fig_of_merit);
  const fig = Number.isFinite(figRaw) ? figRaw : null;

  const tmapsState: TmapsParamsState = {
    gpsPos: gps,
    tmapsPos: tmaps,
    manualPos: manual,
    useGps,
    useManual,
    zone,
    figOfMerit: fig,
    heading,
    pitch,
    roll,
    distanceTravelled: dist,
  };
  store.dispatch(setTmapsParams(tmapsState));

  let coords: Coordinates | null = null;
  if (useManual && manual) coords = manual;
  else if (useGps && gps) coords = gps;
  else if (tmaps) coords = tmaps;
  else coords = manual ?? gps ?? tmaps;

  if (!coords) return;

  const prev = store.getState().myPosition;
  store.dispatch(setMyPosition({
    coordinates: coords,
    heading,
    gunAzimut: prev.gunAzimut,
    los: prev.los,
  }));
}

export const messageHandlers: Record<string, MessageHandler> = {
  ENTITY_CREATED: (data, store) => {
    if (!data) return;
    const serverId = (typeof data.new_id === 'string' && data.new_id) || null;
    const localId = (typeof data.temp_id === 'string' && data.temp_id) || null;
    if (!serverId || !localId) return;
    store.dispatch(confirmEntityCreated({ localId, serverId }));
  },

  ENTITY_DELETED: (data, store) => {
    const { entityId } = data ?? {};
    if (!entityId) return;
    store.dispatch(removeEntity(entityId));
  },

  MISSIONS_LIST: (data, store) => applyMissionsListPayload(data, store),

  MISSIONS_LIST_UPDATE: (data, store) => applyMissionsListPayload(data, store),

  GET_DB: (data, store) => applyGetDbPayload(data, store),

  MISSION_DATA: (data, store) => applyMissionDataPayload(data, store),

  MISSION_DATA_UPDATE: (data, store) => applyMissionDataPayload(data, store),

  /** פרוטוקול חדש — מחליף את POSITION */
  TMAPS_PARAMS: (data, store) => applyTmapsParamsFromPayload(data, store),

  /** תאימות לאחור: POSITION ישנה — מיקום/heading בלבד (LOS מגיע בהודעה ייעודית). */
  POSITION: (data, store) => {
    const { valid, heading } = (data ?? {}) as Record<string, unknown>;
    if (!valid || typeof valid !== 'object') return;
    const v = valid as Record<string, unknown>;
    const lat = Number(v.lat);
    const lng = Number(v.lng);
    if (!isValidLatLng({ lat, lng })) return;
    const altRaw = Number(v.alt);
    const alt = Number.isFinite(altRaw) ? altRaw : 0;
    const h = Number.isFinite(Number(heading)) ? Number(heading) : 0;

    applyTmapsParamsFromPayload({
      gps_pos: { lat, lng, alt },
      tmaps_pos: { lat, lng, alt },
      use_gps: true,
      use_manual: false,
      heading: h,
      pitch: 0,
      roll: 0,
      distance_travelled: 0,
    }, store);

  },

  SAVE_RESULT: () => { },

  RECOMMEND_ASSIGNMENT: () => { },

  LOS_RESULT: (d, store) => {
    // Some integrations send azimuth in LOS_RESULT; update gun azimuth when present.
    applyLosAzimuthToMyPosition(d, store);
    store.dispatch(setLOS({
      center: d.center,
      radiusMeters: d.radiusMeters,
      angleStartDeg: d.angleStartDeg,
      angleEndDeg: d.angleEndDeg,
      rays: d.rays
    }));
  },

  LOS_UPDATE: (d, store) => {
    applyLosAzimuthToMyPosition(d, store);
  },

  TARGETS: (data, store) => {
    if (!__TARGETS_RT.cleanupStarted) {
      setInterval(() => {
        const now = Date.now();
        const removeIds: string[] = [];
        for (const id of Object.keys(__TARGETS_RT.lastUpdate)) {
          if (now - __TARGETS_RT.lastUpdate[id] > TARGETS_CLEANUP_MS) {
            delete __TARGETS_RT.lastUpdate[id];
            delete __TARGETS_RT.seenAt[id];
            removeIds.push(id);
          }
        }
        if (removeIds.length > 0) {
          store.dispatch(applyTargetsFrame({ updates: [], removeIds }));
        }
      }, 1000);
      __TARGETS_RT.cleanupStarted = true;
    }
    const arr = Array.isArray(data) ? data : [data];
    __TARGETS_RT.stamp++;
    const stamp = __TARGETS_RT.stamp;
    const now = Date.now();
    const stateNow = store.getState();
    const currentById: Record<string, unknown> = (stateNow.targets && stateNow.targets.byId) || {};
    const updates: Target[] = [];
    for (const td of arr) {
      const parsed = parseTargetFromTARGETS(td);
      if (!parsed) continue;
      const id = parsed.id;
      const last = __TARGETS_RT.lastUpdate[id] || 0;
      const isNewInRedux = currentById[id] == null;
      // חשוב: מטרה חדשה חייבת להיכנס מיד ל-Redux, גם אם cache throttle ישן נשאר בזיכרון.
      if (isNewInRedux || now - last >= TARGETS_UPDATE_THROTTLE_MS) {
        updates.push(parsed);
        __TARGETS_RT.lastUpdate[id] = now;
      }
      __TARGETS_RT.seenAt[id] = stamp;
    }
    const removeIds: string[] = [];
    const shouldReconcile = now - __TARGETS_RT.lastReconcileAt >= TARGETS_RECONCILE_EVERY_MS;
    if (shouldReconcile) {
      __TARGETS_RT.lastReconcileAt = now;
      const preState = store.getState();
      const allIdsPrev: string[] = (preState.targets && preState.targets.allIds) || [];
      for (const id of allIdsPrev) {
        const seen = __TARGETS_RT.seenAt[id] || 0;
        if (seen < stamp - TARGETS_RECONCILE_GRACE) {
          delete __TARGETS_RT.lastUpdate[id];
          delete __TARGETS_RT.seenAt[id];
          removeIds.push(id);
        }
      }
    }
    if (updates.length > 0 || removeIds.length > 0) {
      store.dispatch(applyTargetsFrame({ updates, removeIds }));
    }
  },

  /** באותו פרויקט – רק פורמט TARGETS (Periodic) עם השדות מהמפרט. TARGETS_DATA מפנה לאותה לוגיקה. */
  TARGETS_DATA: (data, store) => {
    messageHandlers.TARGETS(data, store);
  },

  RADAR_STATUS: (data, store) => {
    const { state, mission_category, radar1_status, radar2_status, radar3_status, radar4_status, freq_index, hfl1_status, hfl2_status, hfl3_status, hfl4_status } = data ?? {};
    const radarValues = {
      state: state || 'ACTIVE',
      mission_category: mission_category || '',
      radar1_status: radar1_status,
      radar2_status: radar2_status,
      radar3_status: radar3_status,
      radar4_status: radar4_status,
      freq_index: freq_index,
      hfl1_status: hfl1_status,
      hfl2_status: hfl2_status,
      hfl3_status: hfl3_status,
      hfl4_status: hfl4_status,
    };
    store.dispatch(updateServerValues(radarValues));
  },

  CONFIRM_POSITION: (_data, store) => {
    store.dispatch(showPrompt(({
      title: "אשר את המיקום של INS",
      message: "אנא אשר שזה המיקום האמתי שלך ",
      confirmText: "מאשר",
      cancelText: "בטל",
    })));
  },

  RADAR_PARAMS: (data, store) => {
    const { radar_mode, mission_category, freq_index } = data;

    const radarValues = {
      mode: radar_mode,
      freqIndex: freq_index,
      missionCategory: mission_category,
    };

    store.dispatch(updateParamsValues(radarValues));
  },

  RADAR_BIT_STATUS: async (ev, store) => {
    const DEFAULT_DEVICE = "RADAR"
    const data = typeof ev === "string" ? JSON.parse(ev) : ev;
    const snap = mapPayloadToSnapshot(DEFAULT_DEVICE, data);
    store.dispatch(setCategorySnapshot({
      category: "RADAR",
      faults : snap.items,
    }));
  },

  /** תצוגה בפאנל סיידבר BIT — ללא לוגיקה נוספת (או הרחבה לפי מפרט) */
  BIT_STATUS: () => { },

  TARGET_Assigned: () => { },
  TARGET_LOCK: () => { },

  SYSTEM_STATUS: (data, store) => {
    store.dispatch(setGunStatus(data?.gun_status));
    store.dispatch(setInsStatus(data?.tmaps_status));
    store.dispatch(setStatus(data?.radar_status));
    store.dispatch(setRadarNonCoverage({ coverage: data?.radar_non_coverage, range: data.radar_range }));

  },

  TARGET_DESTROYED: () => { },

  GUN_BIT_STATUS: (data, store) => {
    const status = data?.status;
    if (!status) return;
    store.dispatch(setGunStatus(status));
  },

  MISSILE_STATUS: (data, store) => {
    const status = data?.status;
    if (status !== 'OK' && status !== 'NOT_OK') return;

    // עדכון צבע ה‑GUN ב‑Status Bar
    store.dispatch(setGunStatus(status === 'OK' ? GunStatusE.READY : GunStatusE.FAIL));

    // שמירת סטטוס ורייזן עבור ה‑Popup בלחיצה על GUN
    store.dispatch(
      setMissileHealth({
        status,
        reason: typeof data?.reason === 'string' ? data.reason : null,
      })
    );
  },

  GPS_STATUS: (data, store) => {
    const status = data?.status;
    if (status === 'OK') {
      store.dispatch(setInsStatus(InsStatusE.OK));
    } else if (status === 'NOT_OK') {
      store.dispatch(setInsStatus(InsStatusE.FAIL));
    }
  },

  ACK_FAILED: (data, store) => {
    const msg: string | undefined =
      (typeof data?.pop_up_message === 'string' && data.pop_up_message.trim()) || undefined;
    if (!msg) return;
    // נשתמש ב‑confirmSlice כ‑Popup מודרני חד‑פעמי עם כפתור סגירה אחד
    store.dispatch(
      showPrompt({
        title: "ACK FAILED",
        message: msg,
        confirmText: "אישור",
        cancelText: undefined,
        kind: "ACK_FAILED",
      })
    );
  },

  MISSILE_WARNINGS: (data, store) => {
    if (!data) return;
    const arr = Array.isArray(data) ? data : [data];

    // קיבוץ לפי FailureDisplayGroup כך שכל קבוצה תופיע כקטגוריה נפרדת בטופס התקלות
    const byGroup: Record<string, { code: number; description: string; severity: ErrorSeverityE; state: ErrorStateE; }[]> = {};

    arr.forEach((raw: any, idx: number) => {
      if (!raw) return;
      const group: string = String(raw.FailureDisplayGroup || "MISSILE").trim() || "MISSILE";
      const code = Number(raw.code ?? idx);
      const desc: string = String(raw.GCU_Display_name || raw.description || `Missile warning ${code}`).slice(0, 80);
      const sevNum = Number(raw.Severity);
      const severity: ErrorSeverityE =
        sevNum in ErrorSeverityE ? (sevNum as ErrorSeverityE) : ErrorSeverityE.WARNING;
      const state: ErrorStateE = ErrorStateE.EXISTS;

      if (!byGroup[group]) byGroup[group] = [];
      byGroup[group].push({ code, description: desc, severity, state });
    });

    const now = Date.now();
    Object.entries(byGroup).forEach(([group, faults]) => {
      store.dispatch(setCategorySnapshot({
        category: group,
        faults,
        receivedAt: now,
      }));
    });
  },

  SYSTEM_LOG: (data, store) => {
    const logData = data?.log_data;
    if (logData != null) store.dispatch(appendLog(String(logData)));
  },

  MISSILE_POSITION: (data, store) => {
    const arr = Array.isArray(data) ? data : [data];
    arr.forEach((m) => {
      const coords = m?.coordinates ?? {
        lat: Number(m?.lat ?? m?.latitude ?? m?.msl_latitude),
        lng: Number(m?.lng ?? m?.lon ?? m?.longitude ?? m?.msl_longitude),
        alt: Number(m?.alt ?? m?.altitude ?? m?.msl_altitude),
      };
      if (!isValidLatLng(coords)) return;
      const id = m?.id ?? m?.missileId ?? 'missile-1';
      const nextLat = Number(m?.nextCoordinates?.lat ?? m?.NextWp_latitude ?? m?.nextWp_latitude ?? m?.NextWpLatitude ?? m?.next_wp_lat ?? m?.nextWpLatitude);
      const nextLng = Number(m?.nextCoordinates?.lng ?? m?.NextWp_Longitude ?? m?.nextWp_longitude ?? m?.NextWpLongitude ?? m?.next_wp_lon ?? m?.nextWpLongitude);
      const nextCoords = Number.isFinite(nextLat) && Number.isFinite(nextLng) && nextLat >= -90 && nextLat <= 90 && nextLng >= -180 && nextLng <= 180
        ? { lat: nextLat, lng: nextLng }
        : undefined;
      store.dispatch(upsertMissile({
        id: String(id),
        coordinates: { lat: Number(coords.lat), lng: Number(coords.lng), alt: Number.isFinite(coords.alt) ? coords.alt : undefined },
        heading: Number.isFinite(m?.heading ?? m?.msl_heading) ? (m.heading ?? m.msl_heading) : undefined,
        speed: Number.isFinite(m?.speed ?? m?.msl_groundspeed) ? (m.speed ?? m.msl_groundspeed) : undefined,
        nextCoordinates: nextCoords ?? undefined,
      }));
    });
  }
};


