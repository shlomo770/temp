import { SelectedModeE, SystemModeE } from '../../enums/general.enum';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SystemState {
  /** null = טרם נבחר מצב במסך הפתיחה */
  selectedMode: SelectedModeE | null;
  systemMode: SystemModeE;
}

const initialState: SystemState = {
  selectedMode: null,
  systemMode: SystemModeE.MANUAL,
};

const systemStateSlice = createSlice({
  name: 'systemState',
  initialState,
  reducers: {
    setSelectedMode: (state, action: PayloadAction<SelectedModeE>) => {
      state.selectedMode = action.payload;
    },
    clearModeSelection: (state) => {
      state.selectedMode = null;
    },
    setSystemMode: (state, action: PayloadAction<SystemModeE>) => {
      state.systemMode = action.payload;
    }
  }
});
export const { setSelectedMode, setSystemMode, clearModeSelection } = systemStateSlice.actions;
export default systemStateSlice.reducer;