import brdf from "./brdf.glsl";
import light_direct_pbr from "./light_direct_pbr.glsl";
import light_indirect_pbr from "./light_indirect_pbr.glsl";
import material_pbr from "./material_pbr.glsl";
import shading_pbr from "./shading_pbr.glsl";

export default [
  { source: brdf, includeKey: "brdf.glsl" },
  { source: light_direct_pbr, includeKey: "light_direct_pbr.glsl" },
  { source: light_indirect_pbr, includeKey: "light_indirect_pbr.glsl" },
  { source: material_pbr, includeKey: "material_pbr.glsl" },
  { source: shading_pbr, includeKey: "shading_pbr.glsl" }
];
