import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GunStatusE } from '../../enums/statusBar.enum';


export interface GunStatus {
  gunId: string;
  status: GunStatusE;
}

export interface GunState {
  guns: Record<string, GunStatus>;
  status?: GunStatusE;
}

const initialState: GunState = {
  guns: {},
  status: GunStatusE.NO_COMM
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
    }
  }
});

export const { updateGunStatus, clearGunStatus, setGunStatus } = gunSlice.actions;
export default gunSlice.reducer; 