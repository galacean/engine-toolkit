import attributesPBR from "./attributesPBR.glsl";
import brdf from "./brdf.glsl";
import forwardPassPBR from "./forwardPassPBR.glsl";
import lightDirectPBR from "./lightDirectPBR.glsl";
import lightIndirectPBR from "./lightIndirectPBR.glsl";
import materialInputPBR from "./materialInputPBR.glsl";
import shadingPBR from "./shadingPBR.glsl";
import varyingsPBR from "./varyingsPBR.glsl";

export default [
  { source: brdf, includeKey: "brdf.glsl" },
  { source: lightDirectPBR, includeKey: "lightDirectPBR.glsl" },
  { source: lightIndirectPBR, includeKey: "lightIndirectPBR.glsl" },
  { source: shadingPBR, includeKey: "shadingPBR.glsl" },
  { source: materialInputPBR, includeKey: "materialInputPBR.glsl" },
  { source: attributesPBR, includeKey: "attributesPBR.glsl" },
  { source: varyingsPBR, includeKey: "varyingsPBR.glsl" },
  { source: forwardPassPBR, includeKey: "forwardPassPBR.glsl" }
];
