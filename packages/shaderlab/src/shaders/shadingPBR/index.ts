import AttributesPBR from "./AttributesPBR.glsl";
import BRDF from "./BRDF.glsl";
import ForwardPassPBR from "./ForwardPassPBR.glsl";
import LightDirectPBR from "./LightDirectPBR.glsl";
import LightIndirectPBR from "./LightIndirectPBR.glsl";
import MaterialInputPBR from "./MaterialInputPBR.glsl";
import VaryingsPBR from "./VaryingsPBR.glsl";

export default [
  { source: ForwardPassPBR, includeKey: "ForwardPassPBR.glsl" },
  { source: AttributesPBR, includeKey: "AttributesPBR.glsl" },
  { source: VaryingsPBR, includeKey: "VaryingsPBR.glsl" },
  { source: MaterialInputPBR, includeKey: "MaterialInputPBR.glsl" },
  { source: LightDirectPBR, includeKey: "LightDirectPBR.glsl" },
  { source: LightIndirectPBR, includeKey: "LightIndirectPBR.glsl" },
  { source: BRDF, includeKey: "BRDF.glsl" }
];
