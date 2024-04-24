import attrib from "./attrib.glsl";
import begin_normal_vert from "./begin_normal_vert.glsl";
import begin_position_vert from "./begin_position_vert.glsl";
import blendShape_input from "./blendShape_input.glsl";
import blendShape_vert from "./blendShape_vert.glsl";
import brdf from "./brdf.glsl";
import camera_declare from "./camera_declare.glsl";
import color_vert from "./color_vert.glsl";
import common_vert from "./common_vert.glsl";
import common from "./common.glsl";
import direct_irradiance_frag_define from "./direct_irradiance_frag_define.glsl";
import fog from "./fog.glsl";
import FogVertex from "./FogVertex.glsl";
import ibl_frag_define from "./ibl_frag_define.glsl";
import light_frag_define from "./light_frag_define.glsl";
import normal_get from "./normal_get.glsl";
import normal_vert from "./normal_vert.glsl";
import pbr_frag_define from "./pbr_frag_define.glsl";
import pbr_frag from "./pbr_frag.glsl";
import pbr_helper from "./pbr_helper.glsl";
import position_vert from "./position_vert.glsl";
import shadow_sample_tent from "./shadow_sample_tent.glsl";
import ShadowCoord from "./ShadowCoord.glsl";
import ShadowFragmentDeclaration from "./ShadowFragmentDeclaration.glsl";
import ShadowVertex from "./ShadowVertex.glsl";
import ShadowVertexDeclaration from "./ShadowVertexDeclaration.glsl";
import skinning_vert from "./skinning_vert.glsl";
import transform_declare from "./transform_declare.glsl";
import uv_vert from "./uv_vert.glsl";
import varying from "./varying.glsl";
import worldpos_vert from "./worldpos_vert.glsl";
import pbr from "./pbr.gs";
import pbr_vert1 from "./pbr_vert1.glsl";
import pbr_vert2 from "./pbr_vert2.glsl";
import input from "./input.glsl";

interface IShaderFragment {
  includeKey: string;
  source: string;
}

const pbr_include_fragment_list: IShaderFragment[] = [
  { source: attrib, includeKey: "attrib.glsl" },
  { source: begin_normal_vert, includeKey: "begin_normal_vert.glsl" },
  { source: begin_position_vert, includeKey: "begin_position_vert.glsl" },
  { source: blendShape_input, includeKey: "blendShape_input.glsl" },
  { source: blendShape_vert, includeKey: "blendShape_vert.glsl" },
  { source: brdf, includeKey: "brdf.glsl" },
  { source: camera_declare, includeKey: "camera_declare.glsl" },
  { source: color_vert, includeKey: "color_vert.glsl" },
  { source: common_vert, includeKey: "common_vert.glsl" },
  { source: common, includeKey: "common.glsl" },
  { source: direct_irradiance_frag_define, includeKey: "direct_irradiance_frag_define.glsl" },
  { source: fog, includeKey: "fog.glsl" },
  { source: FogVertex, includeKey: "FogVertex.glsl" },
  { source: ibl_frag_define, includeKey: "ibl_frag_define.glsl" },
  { source: light_frag_define, includeKey: "light_frag_define.glsl" },
  { source: normal_get, includeKey: "normal_get.glsl" },
  { source: normal_vert, includeKey: "normal_vert.glsl" },
  { source: pbr_frag_define, includeKey: "pbr_frag_define.glsl" },
  { source: pbr_frag, includeKey: "pbr_frag.glsl" },
  { source: pbr_helper, includeKey: "pbr_helper.glsl" },
  { source: position_vert, includeKey: "position_vert.glsl" },
  { source: shadow_sample_tent, includeKey: "shadow_sample_tent.glsl" },
  { source: ShadowCoord, includeKey: "ShadowCoord.glsl" },
  { source: ShadowFragmentDeclaration, includeKey: "ShadowFragmentDeclaration.glsl" },
  { source: ShadowVertex, includeKey: "ShadowVertex.glsl" },
  { source: ShadowVertexDeclaration, includeKey: "ShadowVertexDeclaration.glsl" },
  { source: skinning_vert, includeKey: "skinning_vert.glsl" },
  { source: transform_declare, includeKey: "transform_declare.glsl" },
  { source: uv_vert, includeKey: "uv_vert.glsl" },
  { source: varying, includeKey: "varying.glsl" },
  { source: worldpos_vert, includeKey: "worldpos_vert.glsl" },
  { source: pbr_vert1, includeKey: "pbr_vert1.glsl" },
  { source: pbr_vert2, includeKey: "pbr_vert2.glsl" },
  { source: input, includeKey: "input.glsl" }
];
export { pbr as pbrSource, pbr_include_fragment_list };
