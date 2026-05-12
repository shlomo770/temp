import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { nanoid } from "nanoid";

export interface WsInboundEntry {
  id: string;
  ts: number;
  name: string;
  payload: unknown;
}

export const WS_INBOUND_MAX_ENTRIES = 400;
export const WS_INBOUND_LOG_MESSAGE_NAME = "BIT_STATUS";

export interface WsInboundState {
  entries: WsInboundEntry[];
}

const initialState: WsInboundState = {
  entries: [],
};

const wsInboundSlice = createSlice({
  name: "wsInbound",
  initialState,
  reducers: {
    appendInboundWsMessage: (
      state,
      action: PayloadAction<{ name: string; payload: unknown }>
    ) => {
      state.entries = [{
        id: nanoid(),
        ts: Date.now(),
        name: action.payload.name,
        payload: action.payload.payload,
      }];
      // if (state.entries.length > WS_INBOUND_MAX_ENTRIES) {
      //   state.entries.length = WS_INBOUND_MAX_ENTRIES;
      // }
    },
    clearInboundWsMessages: (state) => {
      state.entries = [];
    },
  },
});

export const { appendInboundWsMessage, clearInboundWsMessages } =
  wsInboundSlice.actions;

export default wsInboundSlice.reducer;