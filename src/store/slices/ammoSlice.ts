import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type AmmoStatus = 'red' | 'green' | 'yellow' | 'gray';

export interface AmmoItem {
  id: string;
  status: AmmoStatus;
}

export interface Launcher {
  id: string;
  name: string;
  ammo: AmmoItem[];
}

export interface AmmoState {
  launchers: Launcher[];
}

const createInitialState = (): AmmoState => {
  const statusCycle: AmmoStatus[] = ['green', 'yellow', 'red', 'gray'];
  const launchers: Launcher[] = Array.from({ length: 6 }, (_, i) => {
    const launcherId = `launcher-${i + 1}`;
    const ammo: AmmoItem[] = Array.from({ length: 20 }, (_, j) => ({
      id: `${launcherId}-ammo-${j + 1}`,
      status: statusCycle[(i * 20 + j) % statusCycle.length],
    }));
    return {
      id: launcherId,
      name: `משגר ${i + 1}`,
      ammo,
    };
  });
  return { launchers };
};

const initialState: AmmoState = createInitialState();

const ammoSlice = createSlice({
  name: 'ammo',
  initialState,
  reducers: {
    setLaunchers: (state, action: PayloadAction<Launcher[]>) => {
      state.launchers = action.payload;
    },
    updateAmmoStatus: (
      state,
      action: PayloadAction<{ launcherId: string; ammoId: string; status: AmmoStatus }>
    ) => {
      const { launcherId, ammoId, status } = action.payload;
      const launcher = state.launchers.find(l => l.id === launcherId);
      if (!launcher) return;
      const item = launcher.ammo.find(a => a.id === ammoId);
      if (!item) return;
      item.status = status;
    },
  },
});

export const { setLaunchers, updateAmmoStatus } = ammoSlice.actions;
export default ammoSlice.reducer;
  