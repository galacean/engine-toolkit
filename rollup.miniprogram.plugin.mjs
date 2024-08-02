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

const regStr = [`"@galacean/engine"`, `'@galacean/engine-xr'`].join("|");

export default [
  inject(adapterVars),
  modify({
    find: new RegExp(regStr, "g"),
    replace: (match, moduleName) => {
      return `${match.substr(0, match.length - 1)}/dist/miniprogram"`;
    }
  })
];
