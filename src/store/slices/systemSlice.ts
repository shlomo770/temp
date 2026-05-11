import { SelectedModeE, SystemModeE } from '../../enums/general.enum';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SystemState {
  selectedMode: SelectedModeE;
  systemMode: SystemModeE;
}

const initialState: SystemState = {
  selectedMode: SelectedModeE.Mission,
  systemMode: SystemModeE.MANUAL

};

const systemStateSlice = createSlice({
  name: 'systemState',
  initialState,
  reducers: {
    setSelectedMode: (state, action: PayloadAction<SelectedModeE>) => {
      state.selectedMode = action.payload;
    },
    setSystemMode: (state, action: PayloadAction<SystemModeE>) => {
      state.systemMode = action.payload;
    }
  }
});
export const { setSelectedMode, setSystemMode } = systemStateSlice.actions;
export default systemStateSlice.reducer;