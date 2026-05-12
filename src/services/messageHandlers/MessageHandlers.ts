import { Store } from 'redux';
import { isValidLatLng } from '../../utils';
import {
  addEntity,
  confirmEntityCreated,
  removeEntity,
  setMissionList,
  setActiveMissionName,
  upsertMissionName,
  setMissionEntityIds,
} from '../../store/slices/entitiesSlice';
import { setMyPosition, updateGunAzimut, updateMyCali } from '../../store/slices/myPositionSlice';
import { updateTarget, setTargetRecommendation, setTargetLineLayer, setTargetIconLayer, markTargetAsDestroyed, removeTarget } from '../../store/slices/targetsSlice';
import { setLOS } from '../../store/slices/losSlice';
import { receiveRadarParamsFromServer, setStatus, setRadarNonCoverage } from '../../store/slices/radarSlice';
import { mapRadarWireStateToStatus, normalizeInboundRadarParamsWire } from '../../store/slices/radarParamsWire';
import { setGunStatus } from '../../store/slices/gunSlice';
import { TargetState, TargetType } from '../../enums/target.enum';
import { setCategorySnapshot } from "../../store/slices/faultsSlice";
import { showPrompt } from "../../store/slices/confirmSlice";
import { mapPayloadToSnapshot } from "../../faults/faultsMapping";
import { setInsStatus } from '../../store/slices/insSlice';
import { WsMessageName } from "../../enums/ws.enum";
import { normalizeRawEntityToStore } from '../entities/serverEntityNormailize';
import type { MessageMap } from '../webSocket/wsTypes';
import { CaliModeE } from '../../enums/general.enum';
import { appendInboundWsMessage } from '../../store/slices/wsInboundSlice';
import { ingestGetDbTypedPayload, isTypedGetDbPayload } from './getDbSpecNormalize';


export interface MessageHandler {
  (data: any, store: Store): void | Promise<void>;
}

const __TARGETS_RT = {
  lastUpdate: {} as Record<string, number>,
  seenAt: {} as Record<string, number>,
  stamp: 0,
  cleanupStarted: false,
  cleanupInterval: null as ReturnType<typeof setInterval> | null
};

/** שמות משימות ממערך מהשרת (מחרוזות או אובייקטים עם name / mission_name) */
function parseMissionNamesFromServerArray(raw: unknown[]): string[] {
  const out: string[] = [];
  for (const x of raw) {
    if (typeof x === 'string') {
      const t = x.trim();
      if (t) out.push(t);
      continue;
    }
    if (x && typeof x === 'object') {
      const o = x as Record<string, unknown>;
      const n = String(o.name ?? o.mission_name ?? '').trim();
      if (n) out.push(n);
    }
  }
  return [...new Set(out)];
}

/** נרמול רשימת משימות מהשרת + שמירה על המשימה הפעילה ועל משימות שכבר נטענו (למשל מ־GET_DB) */
function applyMissionsListPayload(data: unknown, store: Store) {
  if (data == null) return;
  let raw: unknown[] = [];
  if (Array.isArray(data)) {
    raw = data;
  } else if (typeof data === 'object') {
    const d = data as Record<string, unknown>;
    if (Array.isArray(d.missions)) raw = d.missions as unknown[];
    else if (Array.isArray(d.list)) raw = d.list as unknown[];
    else raw = Object.values(d);
  }
  const fromServer = parseMissionNamesFromServerArray(raw);
  const state = store.getState().entities;
  const active = state.activeMissionName;
  const prev = state.missionsList;

  let list: string[];
  if (fromServer.length === 0) {
    list = prev.length ? [...prev] : [];
    if (active && !list.includes(active)) list = [...list, active];
  } else {
    list = [...new Set([...fromServer, ...prev])];
    if (active && !list.includes(active)) list = [...list, active];
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


function pickExplicitMissionEntityIdList(payload: Record<string, unknown>): string[] | null {
  const keys = [
    "entityIds",
    "entity_ids",
    "ids",
    "mission_entity_ids",
    "member_ids",
    "entities_ids",
  ];
  for (const k of keys) {
    const v = payload[k];
    if (!Array.isArray(v) || v.length === 0) continue;
    const out = v.map((x) => String(x).trim()).filter(Boolean);
    if (out.length) return [...new Set(out)];
  }
  return null;
}

function applyMissionDataPayload(data: any, store: Store) {
  if (!data) return;
  const d = data as Record<string, unknown>;
  const entitiesArray = parseMissionEntitiesField(d.entities);
  const mn =
    typeof d.mission_name === "string" && d.mission_name.trim()
      ? String(d.mission_name).trim()
      : null;
  if (!mn) return;

  const inferredIds: string[] = [];
  for (const raw of entitiesArray) {
    const entity = normalizeRawEntityToStore(raw);
    if (!entity?.id) continue;
    store.dispatch(addEntity(entity));
    inferredIds.push(entity.id);
  }

  const explicitIds = pickExplicitMissionEntityIdList(d);
  const entityIds = explicitIds?.length ? explicitIds : inferredIds;

  store.dispatch(setMissionEntityIds({ missionName: mn, entityIds }));
  store.dispatch(setActiveMissionName(mn));
  store.dispatch(upsertMissionName(mn));
}

function unwrapGetDbPayload(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  const nested =
    d.data ?? d.payload ?? d.result ?? d.body ?? d.db ?? d.GET_DB ?? d.content ?? d.response;
  const inner =
    nested && typeof nested === 'object' && !Array.isArray(nested)
      ? (nested as Record<string, unknown>)
      : null;

  if (inner && isTypedGetDbPayload(inner)) return inner;
  if (isTypedGetDbPayload(d)) return d;

  const hasLegacy = (o: Record<string, unknown>) =>
    Array.isArray(o.entities as unknown[]) ||
    Array.isArray(o.Entities as unknown[]) ||
    Array.isArray(o.missions as unknown[]) ||
    Array.isArray(o.Missions as unknown[]);

  if (hasLegacy(d)) return d;
  if (inner && hasLegacy(inner)) return inner;
  return d;
}

function applyGetDbPayload(data: unknown, store: Store) {
  const unwrapped = unwrapGetDbPayload(data);
  if (!unwrapped) return;
  const d = unwrapped;
  if (isTypedGetDbPayload(d)) {
    ingestGetDbTypedPayload(store, d);
    return;
  }
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
        const idsRaw =
          o.entityIds ??
          o.entity_ids ??
          o.ids ??
          o.member_ids ??
          o.mission_entity_ids ??
          o.entities_ids;
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

export const messageHandlers: Partial<Record<WsMessageName, MessageHandler>> = {

  [WsMessageName.EntityDeleted]: (data, store) => {
    const raw = data ?? {};
    const entityId =
      (typeof (raw as { entityId?: unknown }).entityId === 'string' && (raw as { entityId: string }).entityId) ||
      (typeof (raw as { id?: unknown }).id === 'string' && (raw as { id: string }).id) ||
      null;
    if (!entityId) return;
    store.dispatch(removeEntity(entityId));
  },

  [WsMessageName.MissionsList]: (data, store) => {
    applyMissionsListPayload(data, store);
  },

  [WsMessageName.MissionsListUpdate]: (data, store) => {
    applyMissionsListPayload(data, store);
  },

  [WsMessageName.GetDb]: (data, store) => {
    applyGetDbPayload(data, store);
  },

  [WsMessageName.MissionData]: (data, store) => {
    applyMissionDataPayload(data, store);
  },

  [WsMessageName.MissionDataUpdate]: (data, store) => {
    applyMissionDataPayload(data, store);
  },
  [WsMessageName.EntityCreated]: (data, store) => {
    if (!data) return;
    const serverId = (typeof data.new_id === 'string' && data.new_id) || null;
    const localId = (typeof data.temp_id === 'string' && data.temp_id) || null;
    if (!serverId || !localId) return;
    store.dispatch(confirmEntityCreated({ localId, serverId }));
  },

  [WsMessageName.Position]: (data: MessageMap['TMAPS_PARAMS'], store) => {
    const { gps_pos, tmaps_pos, manual_pos, use_gps, use_manual, zone, fig_of_merit, heading, pitch, roll, distance_travelled } = data ?? {};
    if (!gps_pos && !tmaps_pos && !manual_pos) return;
    const cord = use_manual ? manual_pos : tmaps_pos;
    const hedingData = use_manual ? manual_pos.heading : heading;
    store.dispatch(setMyPosition({
      coordinates: { lat: Number(cord.lat), lng: Number(cord.lng) },
      heading: hedingData,
      gps_pos,
      tmaps_pos,
      manual_pos,
      use_gps,
      use_manual,
      zone,
      fig_of_merit,
      pitch,
      roll,
      distance_travelled
    }));
  },

  [WsMessageName.OdoCaliFinished]: (store) => {
    if (!store) return;
    store.dispatch(updateMyCali(CaliModeE.YES));
  },

  [WsMessageName.TmapsBitStatus]: (data, store) => {
    store.dispatch(appendInboundWsMessage(data));
  },

  [WsMessageName.SaveResult]: () => { },

  [WsMessageName.RecommendAssignment]: (data, store) => {
    if (Array.isArray(data)) {
      data.forEach((id) => { if (typeof id === 'string') store.dispatch(setTargetRecommendation({ id, isRecommended: true })); });
      return;
    }
    const id = data?.targetId || data?.id;
    if (typeof id === 'string') {
      store.dispatch(setTargetRecommendation({ id, isRecommended: true }));
    } else if (Array.isArray(data?.targetId)) {
      data.targetId.forEach((tid: string) => {
        if (typeof tid === 'string') store.dispatch(setTargetRecommendation({ id: tid, isRecommended: true }));
      });
    }
  },

  [WsMessageName.Gun_Params]: (data, store) => {
    const gunAzimut = data?.sight_azimuth;
    store.dispatch(updateGunAzimut({
      sight_azimuth: gunAzimut
    }));
  },

  [WsMessageName.LosResult]: (d, store) => {
    store.dispatch(setLOS({
      center: d.center,
      radiusMeters: d.radiusMeters,
      angleStartDeg: d.angleStartDeg,
      angleEndDeg: d.angleEndDeg,
      rays: d.rays
    }));
  },

  [WsMessageName.TargetsData]: (data, store) => {
    if (!__TARGETS_RT.cleanupStarted) {
      __TARGETS_RT.cleanupInterval = setInterval(() => {
        const now = Date.now();
        for (const id of Object.keys(__TARGETS_RT.lastUpdate)) {
          if (now - __TARGETS_RT.lastUpdate[id] > TARGETS_CLEANUP_MS) {
            delete __TARGETS_RT.lastUpdate[id];
            delete __TARGETS_RT.seenAt[id];
            store.dispatch(removeTarget(id));
          }
        }
        const st = store.getState();
        const allIds: string[] = (st.targets && st.targets.allIds) || [];
        const hasTargets = allIds.length > 0 || Object.keys(__TARGETS_RT.lastUpdate).length > 0;
        if (!hasTargets && __TARGETS_RT.cleanupInterval) {
          clearInterval(__TARGETS_RT.cleanupInterval);
          __TARGETS_RT.cleanupInterval = null;
          __TARGETS_RT.cleanupStarted = false;
        }
      }, 1000);
      __TARGETS_RT.cleanupStarted = true;
    }

    const arr = Array.isArray(data) ? data : [data];
    __TARGETS_RT.stamp++;

    const stamp = __TARGETS_RT.stamp;
    const now = Date.now();

    for (const td of arr) {
      const {
        coordinates,
        heading,
        id,
        range,
        is_recommended_by_tera,
        speed,
        state,
        platform,
        identity,
        risk_level
      } = td ?? {};
      if (!id || !isValidLatLng(coordinates)) continue;

      const last = __TARGETS_RT.lastUpdate[id] || 0;
      if (now - last >= TARGETS_UPDATE_THROTTLE_MS) {
        const target = {
          id,
          coordinates,
          heading: Number.isFinite(heading) ? heading : 0,
          range: range,
          speed: Number.isFinite(speed) ? speed : 0,
          type: TargetType[platform],
          status: TargetState[state],
          friend: !!identity,
          isRecommended: !!is_recommended_by_tera,
          risk_level: risk_level
        };
        store.dispatch(updateTarget(target));
        __TARGETS_RT.lastUpdate[id] = now;
      }
      __TARGETS_RT.seenAt[id] = stamp;
    }

    const st = store.getState();
    const allIds: string[] = (st.targets && st.targets.allIds) || [];
    for (const id of allIds) {
      const seen = __TARGETS_RT.seenAt[id] || 0;
      if (seen < stamp - TARGETS_RECONCILE_GRACE) {
        delete __TARGETS_RT.lastUpdate[id];
        delete __TARGETS_RT.seenAt[id];
        store.dispatch(removeTarget(id));
      }
    }
  },

  [WsMessageName.RadarStatus]: (data, store) => {
    if (Object.keys(normalizeInboundRadarParamsWire(data)).length > 0) {
      store.dispatch(receiveRadarParamsFromServer(data));
    }
    const st = mapRadarWireStateToStatus((data as Record<string, unknown> | undefined)?.state);
    if (st !== undefined) store.dispatch(setStatus(st));
  },

  [WsMessageName.ConfirmPosition]: (store) => {
    if (!store) return;
    store.dispatch(showPrompt(({
      title: "אשר את המיקום של INS",
      message: "אנא אשר שזה המיקום האמתי שלך ",
      confirmText: "מאשר",
      cancelText: "בטל",
    })));
  },

  [WsMessageName.RadarParams]: (data, store) => {
    store.dispatch(receiveRadarParamsFromServer(data));
  },

  [WsMessageName.RadarParamsUpdate]: (data, store) => {
    store.dispatch(receiveRadarParamsFromServer(data));
  },

  [WsMessageName.RadarBitStatus]: async (ev, store) => {
    const DEFAULT_DEVICE = "RADAR"
    let data: any;
    try {
      data = typeof ev === "string" ? JSON.parse(ev) : ev;
    } catch (e) {
      console.error("RADAR_BIT_STATUS parse error:", e);
      return;
    }
    const snap = mapPayloadToSnapshot(DEFAULT_DEVICE, data);
    store.dispatch(setCategorySnapshot({
      category: "RADAR",
      faults: snap.items,
    }));
  },

  [WsMessageName.TargetAssigned]: (data, store) => {
    const targetId = data?.targetId || data?.id;
    if (!targetId) return;
    store.dispatch(setTargetLineLayer({ id: targetId, lineLayerId: `target-line-${targetId}` }));
  },

  [WsMessageName.TargetLock]: (data, store) => {
    const targetId = data?.targetId || data?.id;
    if (!targetId) return;
    store.dispatch(setTargetIconLayer({ id: targetId, iconLayerId: `lock-icon-${targetId}` }));
  },

  [WsMessageName.SystemStatus]: (data, store) => {
    store.dispatch(setGunStatus(data?.gun_status));
    store.dispatch(setInsStatus(data?.tmaps_status));
    store.dispatch(setStatus(data?.radar_status));
    store.dispatch(setRadarNonCoverage({ coverage: data?.radar_non_coverage, range: data.radar_range }));

  },

  [WsMessageName.TargetDestroyed]: (data, store) => {
    const targetId = data?.targetId || data?.id;
    if (!targetId) return;
    store.dispatch(markTargetAsDestroyed(targetId));
  },

  [WsMessageName.GunBitStatus]: (data, store) => {
    const status = data?.status;
    if (!status) return;
    store.dispatch(setGunStatus(status));
  }
};


