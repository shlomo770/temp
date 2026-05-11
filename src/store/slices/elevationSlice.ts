import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ElevationState {
  elevation: number | null;
  loading: boolean;
  lastCoordinates: { lat: number; lng: number } | null;
}

const initialState: ElevationState = {
  elevation: null,
  loading: false,
  lastCoordinates: null
};

const elevationSlice = createSlice({
  name: 'elevation',
  initialState,
  reducers: {
    setElevation: (state, action: PayloadAction<number | null>) => {
      state.elevation = action.payload;
    },
    setElevationLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setLastCoordinates: (state, action: PayloadAction<{ lat: number; lng: number } | null>) => {
      state.lastCoordinates = action.payload;
    },
    clearElevation: (state) => {
      state.elevation = null;
      state.loading = false;
      state.lastCoordinates = null;
    }
  }
});

export const { setElevation, setElevationLoading, setLastCoordinates, clearElevation } = elevationSlice.actions;
export default elevationSlice.reducer; 