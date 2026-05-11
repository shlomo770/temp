import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Coordinates, EntityType } from "../../types";

/** ישות במאגר — הרחבה מעבר ל־types בסיסיים (geometry / קטגוריה / נראות וכו׳). */
export interface Entity {
  id: string;
  type: EntityType;
  name: string;
  color: string;
  transparency: number;
  category: string;
  visible: boolean;
  geometry: unknown;
  coordinates: Coordinates[];
  properties?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export type MissionMembership = { entityIds: string[] };

export interface EntitiesState {
  byId: Record<string, Entity>;
  allIds: string[];
  groupedByType: Record<EntityType, string[]>;
  selectedId: string | null;
  drawingMode: EntityType | null;
  creationName: string;
  creationCategory: string;
  creationHeight: number;
  selectedMarkerIcon: string;
  missionsByName: Record<string, MissionMembership>;
  missionsList: string[];
  activeMissionName: string | null;
  previewEntityId: string | null;
}

const emptyGrouped = (): Record<EntityType, string[]> => ({
  polygon: [],
  line: [],
  rectangle: [],
  circle: [],
  marker: [],
  target: [],
  ellipse: [],
  measure: [],
  sector: [],
});

const initialState: EntitiesState = {
  byId: {},
  allIds: [],
  groupedByType: emptyGrouped(),
  selectedId: null,
  drawingMode: null,
  creationName: "",
  creationCategory: "FREE",
  creationHeight: 0,
  selectedMarkerIcon: "E7BA",
  missionsByName: {},
  missionsList: [],
  activeMissionName: null,
  previewEntityId: null,
};

function replaceIdInStringLists(
  map: Record<EntityType, string[]>,
  oldId: string,
  newId: string
) {
  for (const k of Object.keys(map) as EntityType[]) {
    map[k] = map[k].map((x) => (x === oldId ? newId : x));
  }
}

function replaceIdInMissionIds(state: EntitiesState, oldId: string, newId: string) {
  for (const m of Object.keys(state.missionsByName)) {
    const ids = state.missionsByName[m].entityIds;
    state.missionsByName[m] = {
      entityIds: ids.map((x) => (x === oldId ? newId : x)),
    };
  }
}

const entitiesSlice = createSlice({
  name: "entities",
  initialState,
  reducers: {
    addEntity: (state, action: PayloadAction<Entity>) => {
      const entity = action.payload;
      const id = entity.id;
      if (!id) return;

      const prev = state.byId[id];
      if (prev && prev.type !== entity.type) {
        state.groupedByType[prev.type] = state.groupedByType[prev.type].filter((x) => x !== id);
        if (!state.groupedByType[entity.type]) state.groupedByType[entity.type] = [];
        if (!state.groupedByType[entity.type].includes(id)) {
          state.groupedByType[entity.type].push(id);
        }
      } else if (!prev) {
        state.allIds.push(id);
        if (!state.groupedByType[entity.type]) state.groupedByType[entity.type] = [];
        state.groupedByType[entity.type].push(id);
      }

      state.byId[id] = entity;

      const mn = state.activeMissionName;
      if (mn) {
        if (!state.missionsByName[mn]) {
          state.missionsByName[mn] = { entityIds: [] };
        }
        const missionIds = state.missionsByName[mn].entityIds;
        if (!missionIds.includes(id)) {
          missionIds.push(id);
        }
        if (!state.missionsList.includes(mn)) {
          state.missionsList.push(mn);
          state.missionsList.sort((a, b) => a.localeCompare(b, "he"));
        }
      }
    },

    updateEntity: (state, action: PayloadAction<{ id: string; updates: Partial<Entity> }>) => {
      const { id, updates } = action.payload;
      const cur = state.byId[id];
      if (!cur) return;

      if (updates.type !== undefined && updates.type !== cur.type) {
        state.groupedByType[cur.type] = state.groupedByType[cur.type].filter((x) => x !== id);
        const nt = updates.type;
        if (!state.groupedByType[nt]) state.groupedByType[nt] = [];
        if (!state.groupedByType[nt].includes(id)) state.groupedByType[nt].push(id);
      }

      state.byId[id] = { ...cur, ...updates, updatedAt: Date.now() };
    },

    removeEntity: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const entity = state.byId[id];
      if (!entity) return;

      delete state.byId[id];
      state.allIds = state.allIds.filter((x) => x !== id);
      state.groupedByType[entity.type] = state.groupedByType[entity.type].filter((x) => x !== id);

      if (state.selectedId === id) state.selectedId = null;
      if (state.previewEntityId === id) state.previewEntityId = null;

      for (const m of Object.keys(state.missionsByName)) {
        state.missionsByName[m].entityIds = state.missionsByName[m].entityIds.filter(
          (x) => x !== id
        );
      }
    },

    setSelectedEntity: (state, action: PayloadAction<string | null>) => {
      state.selectedId = action.payload;
    },

    setDrawingMode: (state, action: PayloadAction<EntityType | null>) => {
      state.drawingMode = action.payload;
    },

    setCreationForm: (
      state,
      action: PayloadAction<{ name?: string; category?: string; height?: number }>
    ) => {
      const { name, category, height } = action.payload;
      if (name !== undefined) state.creationName = name;
      if (category !== undefined) state.creationCategory = category;
      if (height !== undefined) state.creationHeight = height;
    },

    setSelectedMarkerIcon: (state, action: PayloadAction<string>) => {
      state.selectedMarkerIcon = action.payload;
    },

    toggleEntityVisibility: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const e = state.byId[id];
      if (!e) return;
      e.visible = !e.visible;
      e.updatedAt = Date.now();
    },

    clearEntities: (state) => {
      state.byId = {};
      state.allIds = [];
      state.groupedByType = emptyGrouped();
      state.selectedId = null;
      state.previewEntityId = null;
      state.drawingMode = null;
      for (const m of Object.keys(state.missionsByName)) {
        state.missionsByName[m] = { entityIds: [] };
      }
    },

    setMissionList: (state, action: PayloadAction<string[]>) => {
      const list = [...new Set(action.payload.filter((x) => typeof x === "string" && x.trim()))];
      list.sort((a, b) => a.localeCompare(b, "he"));
      state.missionsList = list;
      const allowed = new Set(list);
      for (const key of Object.keys(state.missionsByName)) {
        if (!allowed.has(key)) delete state.missionsByName[key];
      }
      if (state.activeMissionName && !allowed.has(state.activeMissionName)) {
        state.activeMissionName = null;
        state.previewEntityId = null;
      }
    },

    upsertMissionName: (state, action: PayloadAction<string>) => {
      const n = String(action.payload ?? "").trim();
      if (!n) return;
      if (!state.missionsList.includes(n)) {
        state.missionsList.push(n);
        state.missionsList.sort((a, b) => a.localeCompare(b, "he"));
      }
      if (!state.missionsByName[n]) state.missionsByName[n] = { entityIds: [] };
    },

    renameMission: (
      state,
      action: PayloadAction<{ oldName: string; newName: string }>
    ) => {
      const oldName = String(action.payload.oldName ?? "").trim();
      const newName = String(action.payload.newName ?? "").trim();
      if (!oldName || !newName || oldName === newName) return;
      if (!state.missionsByName[oldName]) return;
      if (state.missionsByName[newName]) return;

      const membership = state.missionsByName[oldName];
      delete state.missionsByName[oldName];
      state.missionsByName[newName] = membership;

      const li = state.missionsList.indexOf(oldName);
      if (li >= 0) state.missionsList[li] = newName;
      else if (!state.missionsList.includes(newName)) state.missionsList.push(newName);

      state.missionsList.sort((a, b) => a.localeCompare(b, "he"));

      if (state.activeMissionName === oldName) state.activeMissionName = newName;
    },

    setMissionEntityIds: (
      state,
      action: PayloadAction<{ missionName: string; entityIds: string[] }>
    ) => {
      const { missionName, entityIds } = action.payload;
      const mn = String(missionName ?? "").trim();
      if (!mn) return;
      state.missionsByName[mn] = { entityIds: [...entityIds] };
    },

    removeMissionMetadata: (state, action: PayloadAction<string>) => {
      const mName = String(action.payload ?? "").trim();
      if (!mName) return;
      delete state.missionsByName[mName];
      state.missionsList = state.missionsList.filter((x) => x !== mName);
      if (state.activeMissionName === mName) {
        state.activeMissionName = null;
        state.previewEntityId = null;
      }
    },

    addEntityToMission: (
      state,
      action: PayloadAction<{ missionName: string; entityId: string }>
    ) => {
      const { missionName, entityId } = action.payload;
      const mn = String(missionName ?? "").trim();
      const eid = String(entityId ?? "").trim();
      if (!mn || !eid) return;
      if (!state.missionsByName[mn]) state.missionsByName[mn] = { entityIds: [] };
      const ids = state.missionsByName[mn].entityIds;
      if (!ids.includes(eid)) ids.push(eid);
    },

    setActiveMissionName: (state, action: PayloadAction<string | null>) => {
      const raw = action.payload;
      const n = raw && String(raw).trim() ? String(raw).trim() : null;
      state.activeMissionName = n;
      state.previewEntityId = null;
    },

    setPreviewEntityId: (state, action: PayloadAction<string | null>) => {
      state.previewEntityId = action.payload;
    },

    confirmEntityCreated: (
      state,
      action: PayloadAction<{ localId: string; serverId: string }>
    ) => {
      const { localId, serverId } = action.payload;
      if (!localId || !serverId || localId === serverId) return;

      const entity = state.byId[localId];
      if (!entity) return;

      delete state.byId[localId];
      state.byId[serverId] = { ...entity, id: serverId, updatedAt: Date.now() };

      state.allIds = state.allIds.map((x) => (x === localId ? serverId : x));
      replaceIdInStringLists(state.groupedByType, localId, serverId);
      replaceIdInMissionIds(state, localId, serverId);

      if (state.selectedId === localId) state.selectedId = serverId;
      if (state.previewEntityId === localId) state.previewEntityId = serverId;
    },
  },
});

export const {
  addEntity,
  updateEntity,
  removeEntity,
  setSelectedEntity,
  setDrawingMode,
  setCreationForm,
  setSelectedMarkerIcon,
  toggleEntityVisibility,
  clearEntities,
  setMissionList,
  upsertMissionName,
  renameMission,
  setMissionEntityIds,
  removeMissionMetadata,
  addEntityToMission,
  setActiveMissionName,
  setPreviewEntityId,
  confirmEntityCreated,
} = entitiesSlice.actions;

export default entitiesSlice.reducer;
