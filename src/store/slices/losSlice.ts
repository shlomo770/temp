import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface LosRay {
  angleDeg: number;
  distanceStart: number;
  distanceEnd: number;
  blocked: boolean;
}

export interface LosState {
  center: { lat: number; lng: number } | null;
  radiusMeters: number;
  angleStartDeg: number;
  angleEndDeg: number;
  rays: LosRay[];
}

const initialState: LosState = {
  center: null,
  radiusMeters: 0,
  angleStartDeg: 0,
  angleEndDeg: 0,
  rays: []
};

const losSlice = createSlice({
  name: "los",
  initialState,
  reducers: {
    setLOS(state, action: PayloadAction<LosState>) {
      return action.payload;
    },
    clearLOS() {
      return initialState;
    }
  }
});

export const { setLOS, clearLOS } = losSlice.actions;
export default losSlice.reducer;