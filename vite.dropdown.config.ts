import { defineConfig } from "vite";
import renderer from "vite-plugin-electron-renderer";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [renderer()],
  build: {
    outDir: "dist",
    emptyOutDir: false,
    minify: false,
    rollupOptions: {
      input: fileURLToPath(new URL("html/dropdown.html", import.meta.url)),
    },
  },
});
