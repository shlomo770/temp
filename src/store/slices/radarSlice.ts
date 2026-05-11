import { createSlice, PayloadAction, Draft } from "@reduxjs/toolkit";
import { RadarStatusE, FaultNormalE, RadarStateE } from '../../enums/statusBar.enum';
import { OffOnE } from "../../enums/general.enum";

// ─────────────────────────────── types ───────────────────────────────
export interface RadarValues {
  state: RadarStatusE;
  mode: RadarStateE;
  workRoom: number;
  missionCategory: number;
  radar1_status: FaultNormalE;
  radar2_status: FaultNormalE;
  radar3_status: FaultNormalE;
  radar4_status: FaultNormalE;
  tx?: OffOnE;
  freqIndex?: number;
  faults?: string[];
}

export interface RadarState {
  serverValues: RadarValues | null;
  formValues: RadarValues | null;
  mismatches: Partial<Record<keyof RadarValues, boolean>>;
  isFormOpen: boolean;
  status: RadarStatusE | null;
  radarNonCoverage: string[] | null;
  radarRange: number;
}

// ─────────────────────────────── utils ───────────────────────────────
const deepEqual = (a: unknown, b: unknown): boolean => {
  if (Object.is(a, b)) return true;
  if (typeof a !== typeof b) return false;

  // arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  // objects
  if (a && b && typeof a === "object" && typeof b === "object") {
    const ak = Object.keys(a as Record<string, unknown>);
    const bk = Object.keys(b as Record<string, unknown>);
    if (ak.length !== bk.length) return false;
    for (const k of ak) {
      if (!deepEqual((a as any)[k], (b as any)[k])) return false;
    }
    return true;
  }

  return false;
};

const clone = <T>(v: T): T => (v == null ? v : JSON.parse(JSON.stringify(v)) as T);

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

// ─────────────────────────────── initial state ───────────────────────────────
const getInitialState = (): RadarState => ({
  serverValues: {
    state: RadarStatusE.NO_COMM,
    mode: RadarStateE.STANDBY,
    workRoom: 1,
    missionCategory: 1,
    radar1_status: FaultNormalE.NORMAL,
    radar2_status: FaultNormalE.NORMAL,
    radar3_status: FaultNormalE.NORMAL,
    radar4_status: FaultNormalE.NORMAL,
    faults: [],
  },
  formValues: null,
  mismatches: {},
  isFormOpen: false,
  status: RadarStatusE.NO_COMM,
  radarNonCoverage: [],
  radarRange: 5000
});

const initialState: RadarState = getInitialState();

// ─────────────────────────────── slice ───────────────────────────────
type FormField = keyof RadarValues;
type FormValue = RadarValues[FormField];

const radarSlice = createSlice({
  name: "radar",
  initialState,
  reducers: {

    updateServerValues: (state, action: PayloadAction<Partial<RadarValues>>) => {
      const incoming = action.payload;

      if (!state.serverValues) {
        state.serverValues = clone(incoming as RadarValues);
        if (!state.formValues) state.formValues = clone(state.serverValues);
        state.mismatches = computeMismatches(state.formValues, state.serverValues);
        return;
      }

      state.serverValues = { ...state.serverValues, ...incoming };

      if (!state.formValues) {
        state.formValues = clone(state.serverValues);
      }

      state.mismatches = computeMismatches(state.formValues, state.serverValues);
    },


    updateParamsValues: (state, action: PayloadAction<{
      mode?: RadarValues["mode"];
      missionCategory?: RadarValues["missionCategory"];
      freqIndex?: RadarValues["freqIndex"];
    }>) => {
      const data = action.payload;

      const sv = state.serverValues ?? (state.serverValues = {
        mode: undefined as any,
        missionCategory: undefined as any,
        freqIndex: undefined as any,
      } as Draft<RadarValues>);

      if (data.mode !== undefined) sv.mode = data.mode;
      if (data.missionCategory !== undefined) sv.missionCategory = data.missionCategory;
      if (data.freqIndex !== undefined) sv.freqIndex = data.freqIndex;

      state.mismatches = computeMismatches(state.formValues, state.serverValues);
    },

    updateFormValue: (state: Draft<RadarState>, action: PayloadAction<{ field: FormField; value: FormValue }>) => {
      const { field, value } = action.payload;
      if (!state.formValues) return;
      state.formValues = { ...state.formValues, [field]: value };
      if (state.serverValues) {
        const isDiff = !deepEqual(value, state.serverValues[field]); state.mismatches = { ...state.mismatches, [field]: isDiff };
      }
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

    setRadarNonCoverage: (state, action: PayloadAction<any>) => {
      state.radarNonCoverage = action.payload.coverage;
      state.radarRange = action.payload.range;
    },

    hydrateFormFromServer: (state) => {
      if (!state.serverValues) return;
      state.formValues = clone(state.serverValues);
      state.mismatches = {};
    },
  },
});

// ─────────────────────────────── exports ───────────────────────────────
export const {
  updateServerValues,
  updateParamsValues,
  updateFormValue,
  compareWithServer,
  resetRadarState,
  setFormOpen,
  setStatus,
  setRadarNonCoverage,
  hydrateFormFromServer,
} = radarSlice.actions;

export default radarSlice.reducer;