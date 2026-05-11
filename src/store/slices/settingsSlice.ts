import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CategoryVisual {
  color: string;
  opacity: number;
}

export interface SettingsState {
  // Timer settings
  inactiveTargetTimeoutSec: number;
  disconnectedTargetTimeoutSec: number;
  destroyedTargetRemoveDelaySec: number;
  
  // Visual settings
  losSectorColor: string;
  categoryVisuals: {
    [categoryName: string]: CategoryVisual;
  };
  

}

const initialState: SettingsState = {
  // Timer defaults
  inactiveTargetTimeoutSec: 30,
  disconnectedTargetTimeoutSec: 60,
  destroyedTargetRemoveDelaySec: 15,
  
  // Visual defaults
  losSectorColor: '#3d7fe0ff',
  categoryVisuals: {}
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    // Timer actions
    setInactiveTargetTimeout: (state, action: PayloadAction<number>) => {
      state.inactiveTargetTimeoutSec = action.payload;
    },
    
    setDisconnectedTargetTimeout: (state, action: PayloadAction<number>) => {
      state.disconnectedTargetTimeoutSec = action.payload;
    },
    
    setDestroyedTargetDelay: (state, action: PayloadAction<number>) => {
      state.destroyedTargetRemoveDelaySec = action.payload;
    },
    
    // Visual actions
    setLosSectorColor: (state, action: PayloadAction<string>) => {
      state.losSectorColor = action.payload;
    },
    
    setCategoryColor: (state, action: PayloadAction<{ category: string; color: string }>) => {
      const { category, color } = action.payload;
      if (!state.categoryVisuals[category]) {
        state.categoryVisuals[category] = { color: '#4185e3', opacity: 0.4 };
      }
      state.categoryVisuals[category].color = color;
    },
    
    setCategoryOpacity: (state, action: PayloadAction<{ category: string; opacity: number }>) => {
      const { category, opacity } = action.payload;
      if (!state.categoryVisuals[category]) {
        state.categoryVisuals[category] = { color: '#4185e3', opacity: 0.4 };
      }
      state.categoryVisuals[category].opacity = opacity;
    },
    
    // Initialize category with defaults
    initializeCategory: (state, action: PayloadAction<string>) => {
      const category = action.payload;
      if (!state.categoryVisuals[category]) {
        state.categoryVisuals[category] = { color: '#4185e3', opacity: 0.4 };
      }
    },
    

    
    // Reset to defaults
    resetToDefaults: (state) => {
      state.inactiveTargetTimeoutSec = 30;
      state.disconnectedTargetTimeoutSec = 60;
      state.destroyedTargetRemoveDelaySec = 15;
      state.losSectorColor = '#00ff00';
      state.categoryVisuals = {};
    }
  }
});

export const {
  setInactiveTargetTimeout,
  setDisconnectedTargetTimeout,
  setDestroyedTargetDelay,
  setLosSectorColor,
  setCategoryColor,
  setCategoryOpacity,
  initializeCategory,
  resetToDefaults
} = settingsSlice.actions;

export default settingsSlice.reducer; 