#include "attributesPBR.glsl"
#include "varyingsPBR.glsl"
#include "common.glsl"
#include "vertex.glsl"
#include "fog.glsl"

#include "materialInputPBR.glsl"
#include "shadingThin.glsl"


VertexShader = pbrVert;
FragmentShader = pbrFrag;

Varyings pbrVert(Attributes attr) {
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

void pbrFrag(Varyings v) {
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