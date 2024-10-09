import path from "path";
import fs from "fs";
import { defineConfig } from "vite";

const templateStr = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const platforms = fs.readdirSync(path.join(__dirname, "cases"));
const outputDirectory = path.join(__dirname, "pages");
if (!fs.existsSync(outputDirectory)) {
  fs.mkdirSync(outputDirectory);
}

platforms.forEach((page) => {
  const outputCode = templateStr.replace("$$src$$", `../cases/${page}`);
  const basename = path.basename(page, ".ts");
  fs.writeFileSync(path.join(outputDirectory, `${basename}.html`), outputCode, "utf-8");
});

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 1237
  },
  clearScreen: false,
  resolve: {
    dedupe: ["@galacean/engine"]
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "esnext",
      // Node.js global to browser globalThis
      define: {
        global: "globalThis"
      },
      supported: {
        bigint: true
      }
    },
    exclude: [
      "@galacean/engine",
      "@galacean/engine-draco",
      "@galacean/engine-lottie",
      "@galacean/engine-spine",
      "@galacean/tools-baker",
      "@galacean/engine-toolkit",
      "@galacean/engine-toolkit-auxiliary-lines",
      "@galacean/engine-toolkit-controls",
      "@galacean/engine-toolkit-framebuffer-picker",
      "@galacean/engine-toolkit-gizmo",
      "@galacean/engine-toolkit-lines",
      "@galacean/engine-toolkit-outline",
      "@galacean/engine-toolkit-planar-shadow-material",
      "@galacean/engine-toolkit-skeleton-viewer",
      "@galacean/engine-toolkit-grid-material",
      "@galacean/engine-toolkit-navigation-gizmo",
      "@galacean/engine-toolkit-geometry-sketch",
      "@galacean/engine-toolkit-stats"
    ]
  }
});
