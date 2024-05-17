import BRDF from "./BRDFThin.glsl";
import ForwardPassThin from "./ForwardPassThin.glsl";
import LightDirectThin from "./LightDirectThin.glsl";
import LightIndirectThin from "./LightIndirectThin.glsl";

export default [
  { source: ForwardPassThin, includeKey: "ForwardPassThin.glsl" },
  { source: BRDF, includeKey: "BRDFThin.glsl" },
  { source: LightDirectThin, includeKey: "LightDirectThin.glsl" },
  { source: LightIndirectThin, includeKey: "LightIndirectThin.glsl" }
];
