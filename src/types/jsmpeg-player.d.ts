declare module "@cycjimmy/jsmpeg-player" {
    export default class JSMpeg {
      static Player: any;
      constructor(url: string | WebSocket, options: any);
      destroy(): void;
      play(): void;
      pause(): void;
      stop(): void;
    }
  
    export class Player {
      constructor(url: string | WebSocket, options: any);
      destroy(): void;
      play(): void;
      pause(): void;
      stop(): void;
    }
  }