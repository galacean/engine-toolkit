#include "AttributesPBR.glsl"
#include "VaryingsPBR.glsl"
#include "Common.glsl"
#include "Vertex.glsl"
#include "Fog.glsl"

#include "MaterialInputPBR.glsl"
#include "ShadingPBR.glsl"


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

  vec4 color = evaluateSurface(temp_varyings, surfaceData);
  gl_FragColor = color;

  #if SCENE_FOG_MODE != 0
      gl_FragColor = fog(gl_FragColor, v.v_positionVS);
  #endif

  #ifndef ENGINE_IS_COLORSPACE_GAMMA
      gl_FragColor = linearToGamma(gl_FragColor);
  #endif
}