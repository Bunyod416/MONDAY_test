/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADMIN_PASSWORD_HASH?: string;
  readonly VITE_EXAM_SECRET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
