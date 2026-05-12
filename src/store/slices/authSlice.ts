import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AuthState {
  selectedMode: 'Mission' | 'Planning' | 'Training' | null;
}

// Load initial state from localStorage
const loadAuthState = (): AuthState => {
  return {
    selectedMode: null
  };
};

const initialState: AuthState = loadAuthState();
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setMode: (state, action: PayloadAction<'Mission' | 'Planning' | 'Training'>) => {
      state.selectedMode = action.payload;
      try {
        localStorage.setItem('authState', JSON.stringify(state));
      } catch (error) {
        console.warn('Failed to save auth state to localStorage:', error);
      }
    }
  }
});
export const { setMode } = authSlice.actions;
export default authSlice.reducer;