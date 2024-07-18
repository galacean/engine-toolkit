#ifndef FORWARD_PASS_PBR_INCLUDED
#define FORWARD_PASS_PBR_INCLUDED

#include "Common.glsl"
#include "Fog.glsl"

#include "./SSSLightDirect.glsl"
#include "LightIndirectPBR.glsl"

#include "AttributesPBR.glsl"
#include "VaryingsPBR.glsl"
#include "VertexPBR.glsl"
#include "FragmentPBR.glsl"


Varyings PBRVertex(Attributes attributes) {
  Varyings varyings;

  varyings.uv = getUV0(attributes);
  #ifdef RENDERER_HAS_UV1
      varyings.uv1 = attributes.TEXCOORD_1;
  #endif

  #ifdef RENDERER_ENABLE_VERTEXCOLOR
    varyings.vertexColor = attributes.COLOR_0;
  #endif


  VertexInputs vertexInputs = getVertexInputs(attributes);

  // positionWS
  varyings.positionWS = vertexInputs.positionWS;

  // positionVS
  #if SCENE_FOG_MODE != 0
	  varyings.positionVS = vertexInputs.positionVS;
	#endif

  // normalWS、tangentWS、bitangentWS
  #ifdef RENDERER_HAS_NORMAL
    varyings.normalWS = vertexInputs.normalWS;
    #ifdef RENDERER_HAS_TANGENT
      varyings.tangentWS = vertexInputs.tangentWS;
      varyings.bitangentWS = vertexInputs.bitangentWS;
    #endif
  #endif

  // ShadowCoord
  #if defined(NEED_CALCULATE_SHADOWS) && (SCENE_SHADOW_CASCADED_COUNT == 1)
      varyings.shadowCoord = getShadowCoord(vertexInputs.positionWS);
  #endif

  gl_Position = renderer_MVPMat * vertexInputs.positionOS;

  return varyings;
}

void PBRFragment(Varyings Varyings) {
  SurfaceData surfaceData;
  BRDFData brdfData;

  initSurfaceData(Varyings, surfaceData, gl_FrontFacing);
  // Can modify surfaceData here.
  initBRDFData(Varyings, surfaceData, brdfData, gl_FrontFacing);

  vec4 color = vec4(0, 0, 0, surfaceData.opacity);

  // Direct Light
  evaluateDirectRadiance(Varyings, brdfData, color.rgb);
  // IBL
  evaluateIBL(Varyings, brdfData, color.rgb);
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
