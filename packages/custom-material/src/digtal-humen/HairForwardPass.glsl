#include "AttributesPBR.glsl"
#include "VaryingsPBR.glsl"
#include "Common.glsl"
#include "Vertex.glsl"
#include "Fog.glsl"

  float material_HairFirstWidth;
  float material_HairSecondWidth;
  float material_HairsFirststrength;
  float material_HairsSecondstrength;
  float material_HairFirstOffest;
  float material_HairSecondOffest;
  vec4 material_HairFirstColor;
  vec4 material_HairSecondColor;

 #ifdef MATERIAL_HAS_HAIRANISOTROPY_TEXTURE
  sampler2D material_HairAnisotropyTexture;
 #endif

#include "MaterialInputPBR.glsl"
//#include "LightDirectPBR.glsl"
#include "/hair/HairLightDirect.glsl"
#include "LightIndirectPBR.glsl"

Varyings PBRVertex(Attributes attr) {
  Varyings v;

  // @todo: delete
  Temp_Attributes temp_attributes;
  Temp_Varyings temp_varyings;
  #include "temp_transformAttributes.glsl"
  #include "temp_transformVaryings.glsl"

  // @todo: use initVertex(attr, v);
  initVertex();

  return v;
}

void PBRFragment(Varyings v) {
  SurfaceData surfaceData;
  BRDFData brdfData;

  // @todo: delete
  Temp_Varyings temp_varyings;
  #include "temp_transformVaryings.glsl"

  initSurfaceData(temp_varyings, surfaceData, gl_FrontFacing);
  // Can modify surfaceData here.
  initBRDFData(temp_varyings, surfaceData, brdfData, gl_FrontFacing);

  vec4 color = vec4(0, 0, 0, surfaceData.opacity);

  // Direct Light
  evaluateDirectRadiance(temp_varyings, brdfData, color.rgb);
  // IBL
  evaluateIBL(temp_varyings, brdfData, color.rgb);
  // Emissive
  color.rgb += surfaceData.emissiveColor;


  #if SCENE_FOG_MODE != 0
      color = fog(color, v.v_positionVS);
  #endif

  #ifndef ENGINE_IS_COLORSPACE_GAMMA
      color = linearToGamma(color);
  #endif

  gl_FragColor = color;
}