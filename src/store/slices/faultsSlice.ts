import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ErrorSeverityE, ErrorStateE } from "../../enums/general.enum";

export type ServerFault = {
  code: number;
  description: string;
  severity: ErrorSeverityE;
  state: ErrorStateE;
};

export type Fault = ServerFault & {
  category: string;
  id: string;
  lastSeen: number;
};

type FiltersState = {
  selectedCategories: string[];
  severity: ErrorSeverityE | "ALL";
  showInactive: boolean;
};

type UIState = {
  acknowledged: Record<string, true>;
  dismissedUntil: Record<string, number>;
  popupCursor: number;
};

export type FaultsState = {
  byCategory: Record<string, Fault[]>;
  filters: FiltersState;
  ui: UIState;
};

const initialState: FaultsState = {
  byCategory: {},
  filters: {
    selectedCategories: [],
    severity: "ALL",
    showInactive: false,
  },
  ui: {
    acknowledged: {},
    dismissedUntil: {},
    popupCursor: 0,
  },
};

const nowMs = () => Date.now();
const makeId = (category: string, code: number) => `${category}:${code}`;

const isActiveState = (s: ErrorStateE) =>
  s === ErrorStateE.EXISTS || s === ErrorStateE.REPEATED;

const isCritical = (f: Fault) =>
  f.severity === ErrorSeverityE.SEVERE && isActiveState(f.state);

export function getBadge(f: Fault) {
  if (!isActiveState(f.state)) return { label: "INACTIVE", color: "neutral" as const };
  if (f.severity === ErrorSeverityE.SEVERE) return { label: "CRITICAL", color: "amber" as const };
  return { label: "ACTIVE", color: "cyan" as const };
}

function flattenAll(byCategory: Record<string, Fault[]>) {
  return Object.values(byCategory).flat();
}

function applyFilters(list: Fault[], filters: FiltersState) {
  const selectedSet =
    filters.selectedCategories.length > 0 ? new Set(filters.selectedCategories) : null;

  return list.filter((f) => {
    if (selectedSet && !selectedSet.has(f.category)) return false;
    if (!filters.showInactive && !isActiveState(f.state)) return false;
    if (filters.severity !== "ALL" && f.severity !== filters.severity) return false;
    return true;
  });
}

function sortForList(a: Fault, b: Fault) {
  const aa = isActiveState(a.state) ? 0 : 1;
  const bb = isActiveState(b.state) ? 0 : 1;
  if (aa !== bb) return aa - bb;
  if (a.severity !== b.severity) return b.severity - a.severity;
  if (a.category !== b.category) return a.category.localeCompare(b.category);
  return a.code - b.code;
}

const faultsSlice = createSlice({
  name: "faults",
  initialState,
  reducers: {
    setCategorySnapshot(
      state,
      action: PayloadAction<{ category: string; faults: ServerFault[]; receivedAt?: number }>
    ) {
      const { category, faults, receivedAt } = action.payload;
      const ts = receivedAt ?? nowMs();

      state.byCategory[category] = faults.map((sf) => ({
        ...sf,
        category,
        id: makeId(category, sf.code),
        lastSeen: ts,
      }));
    },

    clearAllFaults() {
      return initialState;
    },

    setSelectedCategories(state, action: PayloadAction<string[]>) {
      state.filters.selectedCategories = action.payload;
    },

    setSeverityFilter(state, action: PayloadAction<ErrorSeverityE | "ALL">) {
      state.filters.severity = action.payload;
    },

    setShowInactive(state, action: PayloadAction<boolean>) {
      state.filters.showInactive = action.payload;
    },

    acknowledgeAll(state) {
      const all = flattenAll(state.byCategory);
      for (const f of all) state.ui.acknowledged[f.id] = true;
    },

    acknowledgeOne(state, action: PayloadAction<string>) {
      state.ui.acknowledged[action.payload] = true;
    },

    dismissPopup(state, action: PayloadAction<{ id: string; ttlMs: number }>) {
      state.ui.dismissedUntil[action.payload.id] = nowMs() + action.payload.ttlMs;
    },

    popNextPopup(state) {
      state.ui.popupCursor++;
    },
  },
});

export const {
  setCategorySnapshot,
  clearAllFaults,
  setSelectedCategories,
  setSeverityFilter,
  setShowInactive,
  acknowledgeAll,
  acknowledgeOne,
  dismissPopup,
  popNextPopup,
} = faultsSlice.actions;

export default faultsSlice.reducer;

export const selectCategories = (s: any) =>
  Object.keys((s.faults as FaultsState).byCategory);

export const selectAllFaultsFlat = (s: any) => {
  const st = s.faults as FaultsState;
  return flattenAll(st.byCategory);
};

export const selectFilteredFaults = (s: any) => {
  const st = s.faults as FaultsState;
  const all = flattenAll(st.byCategory);
  return applyFilters(all, st.filters).sort(sortForList);
};

export const selectMasterCautionOn = (s: any) => {
  const st = s.faults as FaultsState;
  const all = flattenAll(st.byCategory);
  return all.some((f) => isCritical(f) && !st.ui.acknowledged[f.id]);
};

export const selectPopupQueue = (s: any) => {
  const st = s.faults as FaultsState;
  const all = flattenAll(st.byCategory);
  const t = nowMs();

  const candidates = all.filter((f) => {
    if (!isActiveState(f.state)) return false;
    if (st.ui.acknowledged[f.id]) return false;
    const until = st.ui.dismissedUntil[f.id];
    if (until && until > t) return false;
    return true;
  });

  candidates.sort((a, b) => {
    const ac = isCritical(a) ? 0 : 1;
    const bc = isCritical(b) ? 0 : 1;
    if (ac !== bc) return ac - bc;
    if (a.severity !== b.severity) return b.severity - a.severity;
    return b.lastSeen - a.lastSeen;
  });

  return candidates;
};