import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MapState, Coordinates } from '../types';

const initialState: MapState = {
  rotation: 0,
  brightness: 1,
  center: { lng: -74.006, lat: 40.7128 }, // New York City
  zoom: 10
};

const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    setRotation: (state, action: PayloadAction<number>) => {
      state.rotation = action.payload;
    },

    setBrightness: (state, action: PayloadAction<number>) => {
      state.brightness = Math.max(0, Math.min(2, action.payload));
    },

    setCenter: (state, action: PayloadAction<Coordinates>) => {
      state.center = action.payload;
    },

    setZoom: (state, action: PayloadAction<number>) => {
      state.zoom = action.payload;
    },

    resetMap: (state) => {
      state.rotation = 0;
      state.brightness = 1;
      state.center = { lng: -74.006, lat: 40.7128 };
      state.zoom = 10;
    }
  }
});

export const {
  setRotation,
  setBrightness,
  setCenter,
  setZoom,
  resetMap
} = mapSlice.actions;

export default mapSlice.reducer; 