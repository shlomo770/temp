import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type DrawMode = "static" | "circle" | "select" | "marker";

interface DrawState {
  mode: DrawMode;
  ready: boolean;
}

const initialState: DrawState = { mode: "static", ready: false };

const drawSlice = createSlice({
  name: "draw",
  initialState,
  reducers: {
    setMode(state, action: PayloadAction<DrawMode>) {
      state.mode = action.payload;
    },
    setReady(state, action: PayloadAction<boolean>) {
      state.ready = action.payload;
    },
  },
});

export const { setMode, setReady } = drawSlice.actions;
export default drawSlice.reducer;