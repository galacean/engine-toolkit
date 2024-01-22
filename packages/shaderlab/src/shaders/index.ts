import attr_blendShape_input from "./attr_blendShape_input.gsl";
import attr_common_vert from "./attr_common_vert.gsl";
import attrib from "./attrib.gsl";
import begin_normal_vert from "./begin_normal_vert.gsl";
import begin_position_vert from "./begin_position_vert.gsl";
import blendShape_input from "./blendShape_input.gsl";
import blendShape_vert from "./blendShape_vert.gsl";
import brdf from "./brdf.gsl";
import camera_declare from "./camera_declare.gsl";
import color_vert from "./color_vert.gsl";
import common_vert from "./common_vert.gsl";
import common from "./common.gsl";
import direct_irradiance_frag_define from "./direct_irradiance_frag_define.gsl";
import FogFragment from "./FogFragment.gsl";
import FogFragmentDeclaration from "./FogFragmentDeclaration.gsl";
import FogVertex from "./FogVertex.gsl";
import ibl_frag_define from "./ibl_frag_define.gsl";
import light_frag_define from "./light_frag_define.gsl";
import normal_get from "./normal_get.gsl";
import normal_vert from "./normal_vert.gsl";
import pbr_frag_define from "./pbr_frag_define.gsl";
import pbr_frag from "./pbr_frag.gsl";
import pbr_helper from "./pbr_helper.gsl";
import position_vert from "./position_vert.gsl";
import shadow_sample_tent from "./shadow_sample_tent.gsl";
import ShadowCoord from "./ShadowCoord.gsl";
import ShadowFragmentDeclaration from "./ShadowFragmentDeclaration.gsl";
import ShadowVertex from "./ShadowVertex.gsl";
import ShadowVertexDeclaration from "./ShadowVertexDeclaration.gsl";
import skinning_vert from "./skinning_vert.gsl";
import transform_declare from "./transform_declare.gsl";
import uv_vert from "./uv_vert.gsl";
import vary_color_share from "./vary_color_share.gsl";
import vary_FogVertexDeclaration from "./vary_FogVertexDeclaration.gsl";
import vary_normal_share from "./vary_normal_share.gsl";
import vary_ShadowVertexDeclaration from "./vary_ShadowVertexDeclaration.gsl";
import vary_uv_share from "./vary_uv_share.gsl";
import vary_worldpos_share from "./vary_worldpos_share.gsl";
import varying from "./varying.gsl";
import worldpos_vert from "./worldpos_vert.gsl";
import pbr from "./pbr.gsl";

const pbr_include_fragment_list = {
  attr_blendShape_input,
  attr_common_vert,
  attrib,
  begin_normal_vert,
  begin_position_vert,
  blendShape_input,
  blendShape_vert,
  brdf,
  camera_declare,
  color_vert,
  common_vert,
  common,
  direct_irradiance_frag_define,
  FogFragment,
  FogFragmentDeclaration,
  FogVertex,
  ibl_frag_define,
  light_frag_define,
  normal_get,
  normal_vert,
  pbr_frag_define,
  pbr_frag,
  pbr_helper,
  position_vert,
  shadow_sample_tent,
  ShadowCoord,
  ShadowFragmentDeclaration,
  ShadowVertex,
  ShadowVertexDeclaration,
  skinning_vert,
  transform_declare,
  uv_vert,
  vary_color_share,
  vary_FogVertexDeclaration,
  vary_normal_share,
  vary_ShadowVertexDeclaration,
  vary_uv_share,
  vary_worldpos_share,
  varying,
  worldpos_vert
};
export { pbr as pbrSource, pbr_include_fragment_list };
