import brdf from "./brdf.glsl";
import lightDirectPBR from "./lightDirectPBR.glsl";
import lightIndirectPBR from "./lightIndirectPBR.glsl";
import materialInputPBR from "./materialInputPBR.glsl";
import shadingPBR from "./shadingPBR.glsl";
import surfaceDataPBR from "./surfaceDataPBR.glsl";

export default [
  { source: brdf, includeKey: "brdf.glsl" },
  { source: lightDirectPBR, includeKey: "lightDirectPBR.glsl" },
  { source: lightIndirectPBR, includeKey: "lightIndirectPBR.glsl" },
  { source: materialInputPBR, includeKey: "materialInputPBR.glsl" },
  { source: shadingPBR, includeKey: "shadingPBR.glsl" },
  { source: surfaceDataPBR, includeKey: "surfaceDataPBR.glsl" }
];
