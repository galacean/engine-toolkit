import inject from "@rollup/plugin-inject";
import modify from "rollup-plugin-modify";

const module = "@galacean/engine-miniprogram-adapter";

function register(name) {
  return [module, name];
}

const adapterArray = [
  "btoa",
  "URL",
  "Blob",
  "window",
  "atob",
  "devicePixelRatio",
  "document",
  "Element",
  "Event",
  "EventTarget",
  "HTMLCanvasElement",
  "HTMLElement",
  "HTMLMediaElement",
  "HTMLVideoElement",
  "Image",
  "navigator",
  "Node",
  "requestAnimationFrame",
  "cancelAnimationFrame",
  "screen",
  "XMLHttpRequest",
  "performance",
  "WebGLRenderingContext",
  "WebGL2RenderingContext",
  "ImageData",
  "location",
  "OffscreenCanvas"
];
const adapterVars = {};

adapterArray.forEach((name) => {
  adapterVars[name] = register(name);
});

// Only `@galacean/engine` ships a dedicated miniprogram build whose specifier must be
// redirected to `<pkg>/dist/miniprogram`; other @galacean peers (e.g. @galacean/engine-xr)
// have no such entry and are externalized at their normal package name (see rollup.config.mjs).
//
// The previous implementation matched `@galacean/engine` with double quotes but
// `@galacean/engine-xr` with single quotes; the transpiled source uses double quotes, so the
// `@galacean/engine-xr` import was never matched, fell through to bundling, and dragged
// @galacean/engine-math in with it — bloating dist/miniprogram.js by ~2MB. Matching either
// quote and redirecting only the package that actually has a miniprogram build avoids both.
const redirectModules = ["@galacean/engine"];
const moduleAlternation = redirectModules.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");

export default [
  inject(adapterVars),
  modify({
    // Match the specifier in single OR double quotes, anchored by a back-reference so
    // `@galacean/engine` does not partially match `@galacean/engine-xr`.
    find: new RegExp(`(['"])(${moduleAlternation})\\1`, "g"),
    replace: (_match, quote, name) => `${quote}${name}/dist/miniprogram${quote}`
  })
];
