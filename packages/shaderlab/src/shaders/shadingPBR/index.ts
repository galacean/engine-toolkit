import AttributesPBR from "./AttributesPBR.glsl";
import BRDF from "./BRDF.glsl";
import LightProbe from "./LightProbe.glsl";
import ForwardPassPBR from "./ForwardPassPBR.glsl";
import FragmentPBR from "./FragmentPBR.glsl";
import LightDirectPBR from "./LightDirectPBR.glsl";
import LightIndirectPBR from "./LightIndirectPBR.glsl";
import ReflectionLobe from "./ReflectionLobe.glsl";
import VaryingsPBR from "./VaryingsPBR.glsl";
import VertexPBR from "./VertexPBR.glsl";
import { IShaderFragment } from "..";

const pathInEditor = "shadingPBR";

const fragments: IShaderFragment[] = [
  { source: ForwardPassPBR, includeKey: "ForwardPassPBR.glsl", pathInEditor },
  { source: AttributesPBR, includeKey: "AttributesPBR.glsl", pathInEditor },
  { source: VaryingsPBR, includeKey: "VaryingsPBR.glsl", pathInEditor },
  { source: FragmentPBR, includeKey: "FragmentPBR.glsl", pathInEditor },
  { source: LightDirectPBR, includeKey: "LightDirectPBR.glsl", pathInEditor },
  { source: LightIndirectPBR, includeKey: "LightIndirectPBR.glsl", pathInEditor },
  { source: VertexPBR, includeKey: "VertexPBR.glsl", pathInEditor },
  { source: BRDF, includeKey: "BRDF.glsl", pathInEditor },
  { source: LightProbe, includeKey: "LightProbe.glsl", pathInEditor },
  { source: ReflectionLobe, includeKey: "ReflectionLobe.glsl", pathInEditor }
];

export default fragments;
