import { createSlice, PayloadAction, Draft } from "@reduxjs/toolkit";
import { RadarStatusE, RadarStateE } from "../../enums/statusBar.enum";
import type { RadarState, RadarValues } from "./radarModel";
import {
  normalizeInboundRadarParamsWire,
  type RadarParamsPatch,
} from "./radarParamsWire";

export type { RadarState, RadarValues } from "./radarModel";

const deepEqual = (a: unknown, b: unknown): boolean => {
  if (Object.is(a, b)) return true;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (a && b && typeof a === "object" && typeof b === "object") {
    const ak = Object.keys(a as Record<string, unknown>);
    const bk = Object.keys(b as Record<string, unknown>);
    if (ak.length !== bk.length) return false;
    for (const k of ak) {
      if (!deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k])) return false;
    }
    return true;
  }

  return false;
};

const clone = <T>(v: T): T => (v == null ? v : (JSON.parse(JSON.stringify(v)) as T));

const computeMismatches = (
  form: RadarValues | null,
  server: RadarValues | null
): Partial<Record<keyof RadarValues, boolean>> => {
  if (!form || !server) return {};
  const result: Partial<Record<keyof RadarValues, boolean>> = {};
  (Object.keys(form) as (keyof RadarValues)[]).forEach((k) => {
    result[k] = !deepEqual(form[k], server[k]);
  });
  return result;
};

/** סנכרון טיוטה: שדה נשאר כמו בשרת אם המשתמש לא שינה אותו לפני העדכון */
function syncFormAfterServerPatch(
  state: Draft<RadarState>,
  prevServer: RadarValues,
  patchKeys: (keyof RadarValues)[]
): void {
  if (!state.formValues) {
    state.formValues = clone(state.serverValues);
    return;
  }
  for (const key of patchKeys) {
    if (deepEqual(state.formValues[key], prevServer[key])) {
      (state.formValues as RadarValues)[key] = state.serverValues[key];
    }
  }
}

const getInitialState = (): RadarState => ({
  serverValues: {
    state: RadarStatusE.NO_COMM,
    mode: RadarStateE.STANDBY,
    workRoom: 1,
    freqIndex: 0,
    missionCategory: 1,
    min_elevation: 0,
    blanking_sectors: 0,
  },
  formValues: {
    state: RadarStatusE.NO_COMM,
    mode: RadarStateE.STANDBY,
    workRoom: 1,
    freqIndex: 0,
    missionCategory: 1,
    min_elevation: 0,
    blanking_sectors: 0,
  },
  mismatches: {},
  isFormOpen: false,
  status: RadarStatusE.NO_COMM,
  radarNonCoverage: [],
  radarRange: 5000,
});

const initialState: RadarState = getInitialState();

type FormField = keyof RadarValues;
type FormValue = RadarValues[FormField];

const radarSlice = createSlice({
  name: "radar",
  initialState,
  reducers: {
    /**
     * מיזוג ישיר ל־serverValues (מפתחות מסוג RadarValues).
     * מסנכרן לטופס רק שדות שהמשתמש לא שינה מהערך הקודם בשרת.
     */
    updateServerValues: (state, action: PayloadAction<Partial<RadarValues>>) => {
      const incoming = action.payload;
      const keys = Object.keys(incoming) as (keyof RadarValues)[];
      if (keys.length === 0) return;

      const prev = clone(state.serverValues);
      state.serverValues = { ...state.serverValues, ...incoming };

      if (!state.formValues) {
        state.formValues = clone(state.serverValues);
      } else {
        syncFormAfterServerPatch(state, prev, keys);
      }
      state.mismatches = computeMismatches(state.formValues, state.serverValues);
    },

    /** נרמול wire מהשרת (radar_mode, mission_category, …) ועדכון serverValues + טיוטה חכמה */
    receiveRadarParamsFromServer: (state, action: PayloadAction<unknown>) => {
      const patch = normalizeInboundRadarParamsWire(action.payload) as Partial<RadarParamsPatch>;
      const keys = Object.keys(patch) as (keyof RadarParamsPatch)[];
      if (keys.length === 0) return;

      const prev = clone(state.serverValues);
      state.serverValues = { ...state.serverValues, ...patch };

      if (!state.formValues) {
        state.formValues = clone(state.serverValues);
      } else {
        syncFormAfterServerPatch(state, prev, keys);
      }
      state.mismatches = computeMismatches(state.formValues, state.serverValues);
    },

    updateFormValue: (state: Draft<RadarState>, action: PayloadAction<{ field: FormField; value: FormValue }>) => {
      const { field, value } = action.payload;
      if (!state.formValues) return;
      (state.formValues as Record<FormField, FormValue>)[field] = value;
      state.mismatches = computeMismatches(state.formValues, state.serverValues);
    },

    compareWithServer: (state) => {
      state.mismatches = computeMismatches(state.formValues, state.serverValues);
    },

    resetRadarState: () => getInitialState(),

    setFormOpen: (state, action: PayloadAction<boolean>) => {
      state.isFormOpen = action.payload;

      if (action.payload && !state.formValues && state.serverValues) {
        state.formValues = clone(state.serverValues);
        state.mismatches = computeMismatches(state.formValues, state.serverValues);
      }
    },

    setStatus: (state, action: PayloadAction<RadarState["status"]>) => {
      state.status = action.payload;
    },

    setRadarNonCoverage: (state, action: PayloadAction<{ coverage?: string[] | null; range?: number }>) => {
      state.radarNonCoverage = action.payload.coverage ?? null;
      state.radarRange = action.payload.range ?? state.radarRange;
    },

    hydrateFormFromServer: (state) => {
      if (!state.serverValues) return;
      state.formValues = clone(state.serverValues);
      state.mismatches = {};
    },
  },
});

export const {
  updateServerValues,
  receiveRadarParamsFromServer,
  updateFormValue,
  compareWithServer,
  resetRadarState,
  setFormOpen,
  setStatus,
  setRadarNonCoverage,
  hydrateFormFromServer,
} = radarSlice.actions;

export default radarSlice.reducer;
