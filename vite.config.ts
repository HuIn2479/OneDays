import { defineConfig, type Plugin } from "vite";
import { resolve } from "path";
import { readFileSync, writeFileSync } from "fs";

function readVersionFromPkg(): string {
  try {
    const content = readFileSync(resolve(__dirname, "package.json"), "utf-8");
    return JSON.parse(content).version || "dev";
  } catch {
    return "dev";
  }
}

function versionJsonPlugin(version: string): Plugin {
  return {
    name: "generate-version-json",
    closeBundle() {
      writeFileSync(
        resolve(__dirname, "dist/version.json"),
        JSON.stringify({ version }, null, 2) + "\n",
      );
      console.log(`  version.json generated (${version})`);
    },
  };
}

const version = readVersionFromPkg();

export default defineConfig({
  root: ".",
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  plugins: [versionJsonPlugin(version)],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
    },
  },
  server: {
    open: true,
  },
  json: {
    stringify: true,
  },
});
