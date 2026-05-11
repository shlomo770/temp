import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { InsStatusE } from '../../enums/statusBar.enum';


export interface InsStatus {
  status: InsStatusE;
}

const initialState: InsStatus = {
  status: InsStatusE.NO_COMM
};

const insSlice = createSlice({
  name: 'ins',
  initialState,
  reducers: {
  
    setInsStatus: (state, action: PayloadAction<InsStatusE>) => {
      
      state.status = action.payload;
    }
  }
});

export const { setInsStatus } = insSlice.actions;
export default insSlice.reducer; 