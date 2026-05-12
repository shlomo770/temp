import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Coordinates } from '../../types';

export interface Target {
  id: string;
  coordinates: Coordinates;
  heading?: number;
  speed?: number;
  range?: number;
  type: string;
  friend?: boolean;
  lastUpdate?: number;
  status: string;
  trail?: { lat: number; lng: number; timestamp: number }[];
  isRecommended?: boolean;
  isDestroyed?: boolean;
  isAssigned?: boolean;
  isLocked?: boolean;
  lineLayerId?: string;
  iconLayerId?: string;
  risk_level?: number;
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
      const targetWithDefaults: Target = {
        ...target,
        status: target.status,
        trail: target.trail || [],
        isRecommended: target.isRecommended || false,
        isAssigned: target.isAssigned || false,
        isLocked: target.isLocked || false
      };
      state.byId[target.id] = targetWithDefaults;
      if (!state.allIds.includes(target.id)) {
        state.allIds.push(target.id);
      }
    },

    updateTarget: (state, action: PayloadAction<Target>) => {
      const target = action.payload;
      const isAssigned = target.status === 'designated' ? true : false;
      const isLocked = target.status === 'track' || target.status === 'arm' ? true : false;
      const isAllocated = target.status === 'allocated' ? true : false;

      const newTrailPoint = {
        lat: target.coordinates.lat,
        lng: target.coordinates.lng,
        timestamp: Date.now()
      };

      if (state.byId[target.id]) {
        const existing = state.byId[target.id];
        const updatedTrail = [...(existing.trail || []), newTrailPoint];
        const thirtySecondsAgo = Date.now() - 30000;
        const filteredTrail = updatedTrail.filter(p => p.timestamp >= thirtySecondsAgo);

        state.byId[target.id] = {
          ...existing,
          coordinates: target.coordinates,
          heading: target.heading,
          speed: target.speed,
          range: target.range,
          type: target.type,
          friend: target.friend,
          isRecommended: target.isRecommended,
          status: target.status,
          isAssigned,
          isLocked,
          lastUpdate: Date.now(),
          trail: filteredTrail,
          risk_level: target.risk_level
        };
      } else {
        state.byId[target.id] = {
          ...target,
          isAssigned,
          isLocked,
          trail: [newTrailPoint],
          lastUpdate: Date.now(),
          risk_level: target.risk_level
        };
        if (!state.allIds.includes(target.id)) state.allIds.push(target.id);
      }

      state.allIds.sort((a, b) => {
        const riskA = state.byId[a]?.risk_level || 0;
        const riskB = state.byId[b]?.risk_level || 0;
        return riskB - riskA;
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

    setTargetRecommendation: (state, action: PayloadAction<{ id: string; isRecommended: boolean }>) => {
      const { id, isRecommended } = action.payload;
      if (state.byId[id]) state.byId[id].isRecommended = isRecommended;
    },

    clearAllRecommendations: (state) => {
      Object.values(state.byId).forEach(t => { t.isRecommended = false; });
    },

    setTargetAssigned: (state, action: PayloadAction<{ id: string; assigned: boolean }>) => {
      const { id, assigned } = action.payload;
      if (state.byId[id]) state.byId[id].isAssigned = assigned;
    },

    setTargetLocked: (state, action: PayloadAction<{ id: string; locked: boolean }>) => {
      const { id, locked } = action.payload;
      if (state.byId[id]) state.byId[id].isLocked = locked;
    },

    clearTargetAssignment: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (state.byId[id]) {
        state.byId[id].isAssigned = false;
        state.byId[id].isLocked = false;
      }
    },

    setTargetLineLayer: (state, action: PayloadAction<{ id: string; lineLayerId: string }>) => {
      const { id, lineLayerId } = action.payload;
      if (state.byId[id]) state.byId[id].lineLayerId = lineLayerId;
      if (state.byId[id]) state.byId[id].isAssigned = true;
      if (state.byId[id]) state.byId[id].status = 'designated';
      // if (state.byId[id]) state.byId[id].isRecommended = true;
    },

    setTargetIconLayer: (state, action: PayloadAction<{ id: string; iconLayerId: string }>) => {
      const { id, iconLayerId } = action.payload;
      if (state.byId[id]) state.byId[id].iconLayerId = iconLayerId;
      if (state.byId[id]) state.byId[id].isLocked = true;
      if (state.byId[id]) state.byId[id].status = 'designated';
    },

    clearTargetLayers: (state, action: PayloadAction<string>) => {

      const id = action.payload;
      if (state.byId[id]) {
        state.byId[id].lineLayerId = undefined;
        state.byId[id].iconLayerId = undefined;
      }
    },

    markTargetAsDestroyed: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (state.byId[id]) state.byId[id].isDestroyed = true;
    },

    sortByType: (state) => {
      state.allIds.sort((a, b) => {
        const ta = state.byId[a]?.type ?? "";
        const tb = state.byId[b]?.type ?? "";
        return ta.localeCompare(tb);
      })
    }
  }
});

export const {
  addTarget,
  updateTarget,
  removeTarget,
  clearTargets,
  markAsDisconnected,
  updateTrail,
  setTargetRecommendation,
  clearAllRecommendations,
  setTargetAssigned,
  setTargetLocked,
  sortByType,
  clearTargetAssignment,
  setTargetLineLayer,
  setTargetIconLayer,
  clearTargetLayers,
  markTargetAsDestroyed
} = targetsSlice.actions;

export default targetsSlice.reducer;

