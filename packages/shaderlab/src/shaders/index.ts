import blendShape from "./blendShape.glsl";
import common from "./common.glsl";
import fog from "./fog.glsl";
import light from "./light.glsl";
import normal from "./normal.glsl";
import pbrSource from "./pbr.gs";
import shadingPBR from "./shadingPBR";
import shadow from "./shadow.glsl";
import shadowSampleTent from "./shadowSampleTent.glsl";
import skin from "./skin.glsl";
import temp_transformAttributes from "./temp/transformAttributes.glsl";
import temp_transformVaryings from "./temp/transformVaryings.glsl";
import transform from "./transform.glsl";
import vertex from "./vertex.glsl";

interface IShaderFragment {
  includeKey: string;
  source: string;
}

const fragmentList: IShaderFragment[] = [
  { source: blendShape, includeKey: "blendShape.glsl" },
  { source: common, includeKey: "common.glsl" },
  { source: fog, includeKey: "fog.glsl" },
  { source: light, includeKey: "light.glsl" },
  { source: normal, includeKey: "normal.glsl" },
  { source: shadowSampleTent, includeKey: "shadowSampleTent.glsl" },
  { source: shadow, includeKey: "shadow.glsl" },
  { source: transform, includeKey: "transform.glsl" },
  { source: vertex, includeKey: "vertex.glsl" },
  { source: temp_transformAttributes, includeKey: "temp_transformAttributes.glsl" },
  { source: temp_transformVaryings, includeKey: "temp_transformVaryings.glsl" },
  { source: skin, includeKey: "skin.glsl" },

  ...shadingPBR
];
export { fragmentList, pbrSource };
