#include "AttributesPBR.glsl"
#include "VaryingsPBR.glsl"
#include "Common.glsl"
#include "Vertex.glsl"
#include "Fog.glsl"

#include "MaterialInputPBR.glsl"
float material_Iridescence;
float material_IridescenceThickness;
float material_Eta2;

#include "LightDirectThin.glsl"
#include "LightIndirectThin.glsl"

VertexShader = pbrVert;
FragmentShader = pbrFrag;

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

  // @todo: delete
  Temp_Varyings temp_varyings;
  #include "temp_transformVaryings.glsl"

  initSurfaceData(temp_varyings, surfaceData, gl_FrontFacing);

  vec4 color = vec4(0, 0, 0, surfaceData.opacity);

  // Direct Light
  evaluateDirectRadiance(temp_varyings, surfaceData, color.rgb);
  // IBL
  evaluateIBL(temp_varyings, surfaceData, color.rgb);
  // Emissive
  color.rgb += surfaceData.emissive;

  #if SCENE_FOG_MODE != 0
      color = fog(color, v.v_positionVS);
  #endif

  #ifndef ENGINE_IS_COLORSPACE_GAMMA
      color = linearToGamma(color);
  #endif

  gl_FragColor = color;
}