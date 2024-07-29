import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
// eslint-disable-next-line import/no-unresolved
import electron from "vite-plugin-electron/simple";
import multiple from "vite-plugin-multiple";

export default defineConfig(() => {
  fs.rmSync(path.join(__dirname, "dist-electron"), {
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
          input: path.join(__dirname, "electron/preload.ts"),
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
        input: path.join(__dirname, "html/index.html"),
      },
    },
  };
});
