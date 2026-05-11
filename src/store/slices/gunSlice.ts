import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GunStatusE } from '../../enums/statusBar.enum';


export interface GunStatus {
  gunId: string;
  status: GunStatusE;
}

export interface GunState {
  guns: Record<string, GunStatus>;
  status?: GunStatusE;
  /** MISSILE_STATUS – OK / NOT_OK + optional reason */
  missileHealth?: {
    status: 'OK' | 'NOT_OK';
    reason?: string | null;
  } | null;
}

const initialState: GunState = {
  guns: {},
  status: GunStatusE.NO_COMM,
  missileHealth: null,
};

const gunSlice = createSlice({
  name: 'gun',
  initialState,
  reducers: {
    updateGunStatus: (state, action: PayloadAction<GunStatus>) => {
      const { gunId, status } = action.payload;
      state.guns[gunId] = { gunId, status };
    },
    clearGunStatus: (state, action: PayloadAction<string>) => {
      const gunId = action.payload;
      delete state.guns[gunId];
    },
    setGunStatus: (state, action: PayloadAction<GunStatusE>) => {
      state.status = action.payload;
    },
    setMissileHealth: (
      state,
      action: PayloadAction<{ status: 'OK' | 'NOT_OK'; reason?: string | null }>
    ) => {
      state.missileHealth = {
        status: action.payload.status,
        reason: action.payload.status === 'NOT_OK' ? (action.payload.reason ?? null) : null,
      };
    },
  }
});

export const { updateGunStatus, clearGunStatus, setGunStatus, setMissileHealth } = gunSlice.actions;
export default gunSlice.reducer; 