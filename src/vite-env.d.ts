/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SAVE_MISSION_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
