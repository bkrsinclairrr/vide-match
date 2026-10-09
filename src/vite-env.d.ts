/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_UTMIFY_PIXEL_ID: string
  /** "1" só no build de demonstração da VOXEN (vite.demo.config.ts). */
  readonly VITE_VOXEN_DEMO?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
