import { copyFileSync, renameSync } from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";

const OUT = "dist-demo";

/** A página sai como index.html e leva o vercel.json do projeto de demonstração. */
const finishDemoBundle = (): Plugin => ({
  name: "voxen-demo-finish",
  apply: "build",
  closeBundle() {
    const out = path.resolve(__dirname, OUT);
    renameSync(path.join(out, "voxen-demo.html"), path.join(out, "index.html"));
    copyFileSync(path.resolve(__dirname, "vercel.voxen-demo.json"), path.join(out, "vercel.json"));
  },
});

// Build de demonstração da VOXEN: `npm run build:voxen-demo` → dist-demo/.
export default defineConfig({
  server: { host: "::", port: 8081 },
  plugins: [react(), finishDemoBundle()],
  define: { "import.meta.env.VITE_VOXEN_DEMO": JSON.stringify("1") },
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  build: {
    outDir: OUT,
    emptyOutDir: true,
    rollupOptions: { input: path.resolve(__dirname, "voxen-demo.html") },
  },
});
