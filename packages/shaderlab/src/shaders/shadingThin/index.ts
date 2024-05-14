import brdf from "./brdfThin.glsl";
import forwardPassThin from "./forwardPassThin.glsl";
import lightDirectThin from "./lightDirectThin.glsl";
import lightIndirectThin from "./lightIndirectThin.glsl";
import shadingThin from "./shadingThin.glsl";

export default [
  { source: brdf, includeKey: "brdfThin.glsl" },
  { source: lightDirectThin, includeKey: "lightDirectThin.glsl" },
  { source: lightIndirectThin, includeKey: "lightIndirectThin.glsl" },
  { source: shadingThin, includeKey: "shadingThin.glsl" },
  { source: forwardPassThin, includeKey: "forwardPassThin.glsl" }
];
