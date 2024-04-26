import blendShape_input from "./blendShape_input.glsl";
import common from "./common.glsl";
import fog from "./fog.glsl";
import light from "./light.glsl";
import normal_get from "./normal_get.glsl";
import shadow_sample_tent from "./shadow_sample_tent.glsl";
import shadow from "./shadow.glsl";
import transform from "./transform.glsl";
import pbr from "./pbr.gs";
import vert from "./vert.glsl";
import input from "./input.glsl";
import shading_pbr from "./shading_pbr";
import temp_transformAttributes from "./temp/transformAttributes.glsl";
import temp_transformVaryings from "./temp/transformVaryings.glsl";

interface IShaderFragment {
  includeKey: string;
  source: string;
}

const pbr_include_fragment_list: IShaderFragment[] = [
  { source: blendShape_input, includeKey: "blendShape_input.glsl" },
  { source: common, includeKey: "common.glsl" },
  { source: fog, includeKey: "fog.glsl" },
  { source: light, includeKey: "light.glsl" },
  { source: normal_get, includeKey: "normal_get.glsl" },
  { source: shadow_sample_tent, includeKey: "shadow_sample_tent.glsl" },
  { source: shadow, includeKey: "shadow.glsl" },
  { source: transform, includeKey: "transform.glsl" },
  { source: vert, includeKey: "vert.glsl" },
  { source: input, includeKey: "input.glsl" },
  { source: temp_transformAttributes, includeKey: "temp_transformAttributes.glsl" },
  { source: temp_transformVaryings, includeKey: "temp_transformVaryings.glsl" },

  ...shading_pbr
];
export { pbr as pbrSource, pbr_include_fragment_list };
