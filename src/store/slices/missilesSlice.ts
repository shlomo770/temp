import { createSlice, PayloadAction } from '@reduxjs/toolkit';
const isValidLatLng = (coords: { lat: number; lng: number }) =>
  Number.isFinite(coords?.lat) &&
  Number.isFinite(coords?.lng) &&
  coords.lat >= -90 &&
  coords.lat <= 90 &&
  coords.lng >= -180 &&
  coords.lng <= 180;

export interface Missile {
  id: string;
  coordinates: { lat: number; lng: number; alt?: number };
  heading?: number;
  speed?: number;
  lastUpdate?: number;
  trail?: { lat: number; lng: number; timestamp: number }[];
  nextCoordinates?: { lat: number; lng: number };
}

export interface MissilesState {
  byId: Record<string, Missile>;
  allIds: string[];
}

const initialState: MissilesState = {
  byId: {},
  allIds: [],
};

const missilesSlice = createSlice({
  name: 'missiles',
  initialState,
  reducers: {
    upsertMissile: (state, action: PayloadAction<Missile>) => {
      const m = action.payload;
      if (!m?.id || !isValidLatLng(m.coordinates)) return;
      const existing = state.byId[m.id];
      const now = Date.now();
      const prevTrail = existing?.trail || [];
      const nextTrail = [
        ...prevTrail,
        { lat: m.coordinates.lat, lng: m.coordinates.lng, timestamp: now }
      ].slice(-25);
      state.byId[m.id] = {
        ...existing,
        ...m,
        trail: nextTrail,
        lastUpdate: now,
      };
      if (!state.allIds.includes(m.id)) state.allIds.push(m.id);
    },
    setMissiles: (state, action: PayloadAction<Missile[]>) => {
      const next: Record<string, Missile> = {};
      const allIds: string[] = [];
      action.payload.forEach((m) => {
        if (!m?.id || !isValidLatLng(m.coordinates)) return;
        next[m.id] = { ...m, lastUpdate: Date.now() };
        allIds.push(m.id);
      });
      state.byId = next;
      state.allIds = allIds;
    },
    clearMissiles: (state) => {
      state.byId = {};
      state.allIds = [];
    },
  },
});

export const { upsertMissile, setMissiles, clearMissiles } = missilesSlice.actions;
export default missilesSlice.reducer;
