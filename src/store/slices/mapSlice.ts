import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MapState, Coordinates } from '../../types';

const initialState: MapState = {
  rotation: 0,
  brightness: 0,
  center: { lng: 34.93993624253132, lat: 31.9865223910248 }, // Israel
  zoom: 13,
  selectedMapType: 'carto-light'
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

    setMapType: (state, action: PayloadAction<string>) => {
      state.selectedMapType = action.payload;
    },

    resetMap: (state) => {
      state.rotation = 0;
      state.brightness = 1;
      state.center = { lng: 34.784, lat: 32.055 };
      state.zoom = 15;
      state.selectedMapType = 'carto-light';
    }
  }
});

export const {
  setRotation,
  setBrightness,
  setCenter,
  setZoom,
  setMapType,
  resetMap
} = mapSlice.actions;

export default mapSlice.reducer; 