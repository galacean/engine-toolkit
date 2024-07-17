#ifndef FORWARD_PASS_PBR_INCLUDED
#define FORWARD_PASS_PBR_INCLUDED

#include "AttributesPBR.glsl"
#include "VaryingsPBR.glsl"
#include "Common.glsl"
#include "Vertex.glsl"
#include "Fog.glsl"

#include "MaterialInputPBR.glsl"
#include "LightDirectPBR.glsl"
#include "LightIndirectPBR.glsl"

Varyings PBRVertex(Attributes attributes) {
  Varyings varyings;

  varyings.v_uv = getUV0(attributes);
  #ifdef RENDERER_HAS_UV1
      varyings.v_uv1 = attributes.TEXCOORD_1;
  #endif

  #ifdef RENDERER_ENABLE_VERTEXCOLOR
    varyings.v_color = attributes.COLOR_0;
  #endif

  initTransform(attributes, varyings);

  #if defined(SCENE_SHADOW_CASCADED_COUNT) && (SCENE_SHADOW_CASCADED_COUNT == 1)
      // varyings.v_shadowCoord = getShadowCoord(varyings.v_pos);
  #endif

  return varyings;
}

void PBRFragment(Varyings varyings) {
  SurfaceData surfaceData;
  BRDFData brdfData;

  initSurfaceData(varyings, surfaceData, gl_FrontFacing);
  // Can modify surfaceData here.
  initBRDFData(varyings, surfaceData, brdfData, gl_FrontFacing);

  vec4 color = vec4(0, 0, 0, surfaceData.opacity);

  // Direct Light
  evaluateDirectRadiance(varyings, brdfData, color.rgb);
  // IBL
  evaluateIBL(varyings, brdfData, color.rgb);
  // Emissive
  color.rgb += surfaceData.emissiveColor;


  #if SCENE_FOG_MODE != 0
      color = fog(color, varyings.v_positionVS);
  #endif

  #ifndef ENGINE_IS_COLORSPACE_GAMMA
      color = linearToGamma(color);
  #endif

  gl_FragColor = color;
}


#endif