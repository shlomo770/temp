import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const MAX_LINES = 2000;

export interface LogsState {
  lines: string[];
}

const initialState: LogsState = {
  lines: [],
};

const logsSlice = createSlice({
  name: 'logs',
  initialState,
  reducers: {
    appendLog: (state, action: PayloadAction<string>) => {
      const text = action.payload;
      if (text == null || String(text).trim() === '') return;
      const newLines = String(text).split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      state.lines = [...state.lines, ...newLines].slice(-MAX_LINES);
    },
    clearLogs: (state) => {
      state.lines = [];
    },
  },
});

export const { appendLog, clearLogs } = logsSlice.actions;
export default logsSlice.reducer;
