import attrib from "./attrib.glsl";
import blendShape_input from "./blendShape_input.glsl";
import brdf from "./brdf.glsl";
import common_vert from "./common_vert.glsl";
import common from "./common.glsl";
import direct_irradiance_frag_define from "./direct_irradiance_frag_define.glsl";
import fog from "./fog.glsl";
import ibl_frag_define from "./ibl_frag_define.glsl";
import light_frag_define from "./light_frag_define.glsl";
import normal_get from "./normal_get.glsl";
import pbr_frag_define from "./pbr_frag_define.glsl";
import pbr_frag from "./pbr_frag.glsl";
import shadow_sample_tent from "./shadow_sample_tent.glsl";
import shadow from "./shadow.glsl";
import transform_declare from "./transform_declare.glsl";
import varying from "./varying.glsl";
import pbr from "./pbr.gs";
import vert_pbr from "./vert_pbr.glsl";
import input from "./input.glsl";
import shading_pbr from "./shading_pbr.glsl";

interface IShaderFragment {
  includeKey: string;
  source: string;
}

const pbr_include_fragment_list: IShaderFragment[] = [
  { source: attrib, includeKey: "attrib.glsl" },
  { source: blendShape_input, includeKey: "blendShape_input.glsl" },
  { source: brdf, includeKey: "brdf.glsl" },
  { source: common_vert, includeKey: "common_vert.glsl" },
  { source: common, includeKey: "common.glsl" },
  { source: direct_irradiance_frag_define, includeKey: "direct_irradiance_frag_define.glsl" },
  { source: fog, includeKey: "fog.glsl" },
  { source: ibl_frag_define, includeKey: "ibl_frag_define.glsl" },
  { source: light_frag_define, includeKey: "light_frag_define.glsl" },
  { source: normal_get, includeKey: "normal_get.glsl" },
  { source: pbr_frag_define, includeKey: "pbr_frag_define.glsl" },
  { source: pbr_frag, includeKey: "pbr_frag.glsl" },
  { source: shadow_sample_tent, includeKey: "shadow_sample_tent.glsl" },
  { source: shadow, includeKey: "shadow.glsl" },
  { source: transform_declare, includeKey: "transform_declare.glsl" },
  { source: varying, includeKey: "varying.glsl" },
  { source: vert_pbr, includeKey: "vert_pbr.glsl" },
  { source: input, includeKey: "input.glsl" },
  { source: shading_pbr, includeKey: "shading_pbr.glsl" }
];
export { pbr as pbrSource, pbr_include_fragment_list };
