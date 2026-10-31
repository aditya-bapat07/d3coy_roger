/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FALLBACK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

