import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Agrupa dependências de terceiros por "família" em vez de deixar
        // tudo num único chunk de vendor. Como React, Router, Radix UI e
        // o cliente Supabase mudam de versão bem menos que o código do
        // app, separá-los permite que o navegador reaproveite esse cache
        // entre deploys — só o chunk que realmente mudou é rebaixado.
        manualChunks(id) {
          if (!id.includes("node_modules")) return
          if (/\/node_modules\/(react|react-dom|scheduler)\//.test(id)) return "vendor-react"
          if (/\/node_modules\/(react-router|react-router-dom|@remix-run)\//.test(id)) return "vendor-router"
          if (/\/node_modules\/(@radix-ui|@floating-ui)\//.test(id)) return "vendor-radix"
          if (/\/node_modules\/@supabase\//.test(id)) return "vendor-supabase"
        },
      },
    },
  },
}));
