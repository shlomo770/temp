import { createSlice } from "@reduxjs/toolkit";

const confirmSlice = createSlice({
  name: "confirm",
  initialState: {
    prompt: null, // { title, message, confirmText, cancelText }
  },
  reducers: {
    showPrompt: (state, action) => {
      state.prompt = action.payload;
    },
    closePrompt: (state) => {
      state.prompt = null;
    },
  },
});

export const { showPrompt, closePrompt } = confirmSlice.actions;
export default confirmSlice.reducer;