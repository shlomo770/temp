import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Coordinates } from '../../types';

/** מטרה – רק שדות מהודעת TARGETS (Periodic) + שובל (נבנה ב-reducer). השרת שולח רק Velocity_North, Velocity_East, Velocity_Vup. */
export interface Target {
  id: string;
  coordinates: Coordinates;
  /** מחושב אצלנו מ-Velocity_North ו-Velocity_East (לא מגיע מהשרת) */
  heading?: number;
  /** מחושב אצלנו מ-Velocity_North ו-Velocity_East (לא מגיע מהשרת) */
  speed?: number;
  velocityVup?: number;
  type: string;
  status: string;
  lastUpdate?: number;
  trail?: { lat: number; lng: number; timestamp: number }[];
  timeTag?: number;
  flightMode?: number;
  ellipsisA?: number;
  ellipsisC?: number;
}

export interface TargetsState {
  byId: Record<string, Target>;
  allIds: string[];
}

const initialState: TargetsState = {
  byId: {},
  allIds: []
};

const targetsSlice = createSlice({
  name: 'targets',
  initialState,
  reducers: {
    addTarget: (state, action: PayloadAction<Target>) => {
      const target = action.payload;
      state.byId[target.id] = { ...target, trail: target.trail || [] };
      if (!state.allIds.includes(target.id)) state.allIds.push(target.id);
    },

    updateTarget: (state, action: PayloadAction<Target>) => {
      const target = action.payload;
      const now = Date.now();
      const newTrailPoint = {
        lat: target.coordinates.lat,
        lng: target.coordinates.lng,
        timestamp: now
      };

      if (state.byId[target.id]) {
        const existing = state.byId[target.id];
        const updatedTrail = [...(existing.trail || []), newTrailPoint];
        const filteredTrail = updatedTrail.filter(p => p.timestamp >= now - 30000);
        state.byId[target.id] = {
          ...existing,
          ...target,
          lastUpdate: now,
          trail: filteredTrail,
        };
      } else {
        state.byId[target.id] = {
          ...target,
          lastUpdate: now,
          trail: [newTrailPoint],
        };
        if (!state.allIds.includes(target.id)) state.allIds.push(target.id);
      }

      state.allIds.sort((a, b) => {
        const tA = state.byId[a]?.lastUpdate ?? 0;
        const tB = state.byId[b]?.lastUpdate ?? 0;
        return tB - tA;
      });
    },

    /** הודעת TARGETS שלמה: כל העדכונים + מחיקות ריאון ב־dispatch אחד, מיון allIds פעם אחת */
    applyTargetsFrame: (
      state,
      action: PayloadAction<{ updates: Target[]; removeIds: string[] }>
    ) => {
      const { updates, removeIds } = action.payload;
      const now = Date.now();

      for (const target of updates) {
        const newTrailPoint = {
          lat: target.coordinates.lat,
          lng: target.coordinates.lng,
          timestamp: now
        };
        if (state.byId[target.id]) {
          const existing = state.byId[target.id];
          const updatedTrail = [...(existing.trail || []), newTrailPoint];
          const filteredTrail = updatedTrail.filter(p => p.timestamp >= now - 30000);
          state.byId[target.id] = {
            ...existing,
            ...target,
            lastUpdate: now,
            trail: filteredTrail,
          };
        } else {
          state.byId[target.id] = {
            ...target,
            lastUpdate: now,
            trail: [newTrailPoint],
          };
          if (!state.allIds.includes(target.id)) state.allIds.push(target.id);
        }
      }

      for (const id of removeIds) {
        if (state.byId[id]) delete state.byId[id];
      }
      state.allIds = state.allIds.filter((id) => state.byId[id] != null);

      state.allIds.sort((a, b) => {
        const tA = state.byId[a]?.lastUpdate ?? 0;
        const tB = state.byId[b]?.lastUpdate ?? 0;
        return tB - tA;
      });
    },

    removeTarget: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (state.byId[id]) {
        delete state.byId[id];
        state.allIds = state.allIds.filter(x => x !== id);
      }
    },

    clearTargets: (state) => {
      state.byId = {};
      state.allIds = [];
    },

    markAsDisconnected: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (state.byId[id]) state.byId[id].status = 'disconnected';
    },

    updateTrail: (state, action: PayloadAction<{ id: string; trail: { lat: number; lng: number; timestamp: number }[] }>) => {
      const { id, trail } = action.payload;
      if (state.byId[id]) state.byId[id].trail = trail;
    },

    sortByType: (state) => {
      state.allIds.sort((a, b) => {
        const ta = state.byId[a]?.type ?? "";
        const tb = state.byId[b]?.type ?? "";
        return ta.localeCompare(tb);
      });
    },
  }
});

export const {
  addTarget,
  updateTarget,
  applyTargetsFrame,
  removeTarget,
  clearTargets,
  markAsDisconnected,
  updateTrail,
  sortByType,
} = targetsSlice.actions;

export default targetsSlice.reducer;
