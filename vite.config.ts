import fs from "node:fs";
import { defineConfig } from "vite";
import electron from "vite-plugin-electron/simple";
import multiple from "vite-plugin-multiple";
import { fileURLToPath } from "node:url";

export default defineConfig(() => {
  fs.rmSync(new URL("dist-electron", import.meta.url), {
    recursive: true,
    force: true,
  });

  return {
    plugins: [
      electron({
        main: {
          entry: "electron/main.ts",
        },
        preload: {
          input: "electron/preload.ts",
        },
      }),
      multiple([
        {
          name: "dropdown",
          config: "vite.dropdown.config.ts",
        },
      ]),
    ],
    build: {
      rollupOptions: {
        input: fileURLToPath(new URL("html/index.html", import.meta.url)),
      },
    },
  };
});
