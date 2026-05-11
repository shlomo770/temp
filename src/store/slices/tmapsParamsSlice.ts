import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Coordinates } from "../../types";

/** תואם להודעת TMAPS_PARAMS מהשרת */
export interface TmapsParamsState {
  gpsPos: Coordinates | null;
  tmapsPos: Coordinates | null;
  manualPos: Coordinates | null;
  useGps: boolean;
  useManual: boolean;
  zone: number | null;
  figOfMerit: number | null;
  heading: number;
  pitch: number;
  roll: number;
  distanceTravelled: number;
}

const initialState: TmapsParamsState = {
  gpsPos: null,
  tmapsPos: null,
  manualPos: null,
  useGps: false,
  useManual: false,
  zone: null,
  figOfMerit: null,
  heading: 0,
  pitch: 0,
  roll: 0,
  distanceTravelled: 0,
};

const tmapsParamsSlice = createSlice({
  name: "tmapsParams",
  initialState,
  reducers: {
    setTmapsParams: (_state, action: PayloadAction<TmapsParamsState>) => action.payload,
  },
});

export const { setTmapsParams } = tmapsParamsSlice.actions;
export default tmapsParamsSlice.reducer;
