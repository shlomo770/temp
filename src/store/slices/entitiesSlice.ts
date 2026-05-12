import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { EntityType } from '../../types';
import { EntityCategoryEnum } from '../../enums/entitis.enum';


export interface Entity {
  properties?: any;
  id: string;
  type: EntityType;
  name: string;
  color: string;
  transparency: number;
  category: EntityCategoryEnum;
  visible: boolean;
  geometry: any;
  coordinates?: any;
  createdAt: number;
  updatedAt: number;
}

export type MissionMembership = { entityIds: string[] };

export interface EntitiesState {
  byId: Record<string, Entity>;
  allIds: string[];
  selectedId: string | null;
  isCreating: boolean;
  creationType: Entity['type'] | null;
  drawingMode: Entity['type'] | 'measure' | 'measure-area' | null;
  missionsList: string[];
  /** מזהי ישויות לפי שם משימה — תואם ל־GET_DB / MISSION_DATA מהשרת */
  missionsByName: Record<string, MissionMembership>;
  activeMissionName: string | null;
  /**
   * מונה שמוגדל רק כשבוחרים משימה/מבטלים מהסטטוס־בר.
   * EntitiesSidebar מאזין ומאפס את מסך "עריכת משימה" — סינון מפה בלבד.
   */
  missionListUiResetNonce: number;
  /** ישות שנבחרה בתצוגת משימה לפני שמירה — מוצגת על המפה יחד עם חברי המשימה */
  previewEntityId: string | null;
  selectedMarkerIcon: string | null;
  creationName: string;
  creationCategory: EntityCategoryEnum;
  creationHeight: number;
}

const initialState: EntitiesState = {
  byId: {},
  allIds: [],
  selectedId: null,
  isCreating: false,
  creationType: null,
  drawingMode: null,
  missionsList: [],
  missionsByName: {},
  activeMissionName: null,
  missionListUiResetNonce: 0,
  previewEntityId: null,
  selectedMarkerIcon: null,
  creationName: '',
  creationCategory: EntityCategoryEnum.FREE,
  creationHeight: 0
};

function replaceIdInMissionIds(state: EntitiesState, oldId: string, newId: string) {
  for (const m of Object.keys(state.missionsByName)) {
    const ids = state.missionsByName[m].entityIds;
    state.missionsByName[m] = {
      entityIds: ids.map((x) => (x === oldId ? newId : x)),
    };
  }
}

const entitiesSlice = createSlice({
  name: 'entities',
  initialState,
  reducers: {
    addEntity: (state, action: PayloadAction<any>) => {
      const entity = action.payload;
      if (!entity?.id) return;

      state.byId[entity.id] = entity;
      state.allIds = state.allIds.filter((id) => id !== entity.id);
      state.allIds.push(entity.id);

      const mn = state.activeMissionName;
      if (mn) {
        if (!state.missionsByName[mn]) {
          state.missionsByName[mn] = { entityIds: [] };
        }
        const missionIds = state.missionsByName[mn].entityIds;
        if (!missionIds.includes(entity.id)) {
          missionIds.push(entity.id);
        }
        if (!state.missionsList.includes(mn)) {
          state.missionsList.push(mn);
          state.missionsList.sort((a, b) => a.localeCompare(b, 'he'));
        }
      }
    },

    updateEntity: (state, action: PayloadAction<Partial<Entity> & { id: string }>) => {
      const { id, ...rest } = action.payload;
      if (!id || !state.byId[id]) return;
      const updates: Partial<Entity> = { ...rest };
      const isTransparencyUpdate = "transparency" in updates && typeof updates.transparency === "number" && !Number.isNaN(updates.transparency);
      if (isTransparencyUpdate) {
        let t = updates.transparency!;
        if (t > 1) t = t / 100;
        if (t < 0) t = 0;
        if (t > 1) t = 1;
        updates.transparency = t;
      }

      state.byId[id] = {
        ...state.byId[id],
        ...updates,
        updatedAt: Date.now()
      };
    },

    confirmEntityCreated: (
      state,
      action: PayloadAction<{ localId: string; serverId: string }>
    ) => {
      const { localId, serverId } = action.payload;
      if (!localId || !serverId || localId === serverId) return;
      const entity = state.byId[localId];
      if (!entity) return;
      const nextEntity: Entity = {
        ...entity,
        id: serverId,
        updatedAt: Date.now(),
      };
      delete state.byId[localId];
      state.byId[serverId] = nextEntity;
      const index = state.allIds.indexOf(localId);
      if (index !== -1) state.allIds[index] = serverId;
      if (state.selectedId === localId) state.selectedId = serverId;
      if (state.previewEntityId === localId) state.previewEntityId = serverId;
      replaceIdInMissionIds(state, localId, serverId);
    },

    removeEntity: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      delete state.byId[id];
      state.allIds = state.allIds.filter(entityId => entityId !== id);
      if (state.selectedId === id) {
        state.selectedId = null;
      }
      if (state.previewEntityId === id) {
        state.previewEntityId = null;
      }
      for (const m of Object.keys(state.missionsByName)) {
        state.missionsByName[m].entityIds = state.missionsByName[m].entityIds.filter((x) => x !== id);
      }
    },

    setSelectedEntity: (state, action: PayloadAction<string | null>) => {
      state.selectedId = action.payload;
    },

    setMissionList: (state, action: PayloadAction<string[]>) => {
      const list = [...new Set(action.payload.filter((x) => typeof x === 'string' && x.trim()))];
      list.sort((a, b) => a.localeCompare(b, 'he'));
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

    setActiveMissionName: (state, action: PayloadAction<string | null>) => {
      const n = action.payload;
      state.activeMissionName = n && String(n).trim() ? String(n).trim() : null;
      state.previewEntityId = null;
    },

    /** נקרא רק מבחירת משימה בסטטוס־בר — סגירת טופס עריכת משימה בסיידבר */
    requestMissionListUiReset: (state) => {
      state.missionListUiResetNonce += 1;
    },

    upsertMissionName: (state, action: PayloadAction<string>) => {
      const n = String(action.payload ?? '').trim();
      if (!n) return;
      if (!state.missionsList.includes(n)) {
        state.missionsList = [...state.missionsList, n].sort((a, b) => a.localeCompare(b, 'he'));
      }
      if (!state.missionsByName[n]) {
        state.missionsByName[n] = { entityIds: [] };
      }
    },

    renameMission: (
      state,
      action: PayloadAction<{ oldName: string; newName: string }>
    ) => {
      const oldName = String(action.payload.oldName ?? '').trim();
      const newName = String(action.payload.newName ?? '').trim();
      if (!oldName || !newName || oldName === newName) return;
      if (!state.missionsByName[oldName]) return;
      if (state.missionsByName[newName]) return;

      const membership = state.missionsByName[oldName];
      delete state.missionsByName[oldName];
      state.missionsByName[newName] = membership;

      const li = state.missionsList.indexOf(oldName);
      if (li >= 0) state.missionsList[li] = newName;
      else if (!state.missionsList.includes(newName)) state.missionsList.push(newName);

      state.missionsList.sort((a, b) => a.localeCompare(b, 'he'));

      if (state.activeMissionName === oldName) state.activeMissionName = newName;
    },

    removeMissionMetadata: (state, action: PayloadAction<string>) => {
      const mName = String(action.payload ?? '').trim();
      if (!mName) return;
      delete state.missionsByName[mName];
      state.missionsList = state.missionsList.filter((x) => x !== mName);
      if (state.activeMissionName === mName) {
        state.activeMissionName = null;
        state.previewEntityId = null;
      }
    },

    setMissionEntityIds: (
      state,
      action: PayloadAction<{ missionName: string; entityIds: string[] }>
    ) => {
      const { missionName, entityIds } = action.payload;
      const mn = String(missionName ?? '').trim();
      if (!mn) return;
      state.missionsByName[mn] = { entityIds: [...entityIds] };
    },

    setPreviewEntityId: (state, action: PayloadAction<string | null>) => {
      state.previewEntityId = action.payload;
    },

    toggleEntityVisibility: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (state.byId[id]) {
        state.byId[id].visible = !state.byId[id].visible;
      }
    },

    setCreationMode: (state, action: PayloadAction<{ isCreating: boolean; type?: Entity['type'] }>) => {
      state.isCreating = action.payload.isCreating;
      state.creationType = action.payload.type || null;
    },

    setEntities: (state, action: PayloadAction<Entity[]>) => {
      state.byId = {};
      state.allIds = [];
      state.missionsByName = {};
      action.payload.forEach(entity => {
        state.byId[entity.id] = entity;
        state.allIds.push(entity.id);
      });
    },
    setDrawingMode: (state, action: PayloadAction<Entity['type'] | 'measure' | 'measure-area' | null>) => {
      state.drawingMode = action.payload;
    },

    setSelectedMarkerIcon: (state, action: PayloadAction<string | null>) => {
      state.selectedMarkerIcon = action.payload;
    },

    setCreationForm: (state, action: PayloadAction<{ name: string; category: EntityCategoryEnum; height?: number }>) => {
      state.creationName = action.payload.name;
      state.creationCategory = action.payload.category;
      if (typeof action.payload.height === 'number' && Number.isFinite(action.payload.height)) {
        state.creationHeight = action.payload.height;
      }
    },

    clearEntities: (state) => {
      state.byId = {};
      state.allIds = [];
      state.selectedId = null;
      state.previewEntityId = null;
      for (const m of Object.keys(state.missionsByName)) {
        state.missionsByName[m] = { entityIds: [] };
      }
      state.isCreating = false;
      state.creationType = null;
      state.drawingMode = null;
      state.selectedMarkerIcon = null;
      state.creationName = '';
      state.creationCategory = EntityCategoryEnum.FREE;
      state.creationHeight = 0;
    }
  }
});

export const {
  addEntity,
  updateEntity,
  removeEntity,
  setSelectedEntity,
  toggleEntityVisibility,
  confirmEntityCreated,
  setCreationMode,
  setDrawingMode,
  setSelectedMarkerIcon,
  setCreationForm,
  setEntities,
  clearEntities,
  setMissionList,
  setActiveMissionName,
  requestMissionListUiReset,
  upsertMissionName,
  renameMission,
  removeMissionMetadata,
  setMissionEntityIds,
  setPreviewEntityId
} = entitiesSlice.actions;

export default entitiesSlice.reducer;