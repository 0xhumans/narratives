/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STATIC_DATA: string;
  readonly VITE_PIPELINE_ENABLED: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
