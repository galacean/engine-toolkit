#ifndef FORWARD_PASS_PBR_INCLUDED
#define FORWARD_PASS_PBR_INCLUDED

#include "Common.glsl"
#include "Fog.glsl"

#include "LightDirectPBR.glsl"
#include "LightIndirectPBR.glsl"

#include "AttributesPBR.glsl"
#include "VaryingsPBR.glsl"
#include "VertexPBR.glsl"
#include "FragmentPBR.glsl"



Varyings PBRVertex(Attributes attributes) {
  Varyings varyings;

  varyings.v_uv = getUV0(attributes);
  #ifdef RENDERER_HAS_UV1
      varyings.v_uv1 = attributes.TEXCOORD_1;
  #endif

  #ifdef RENDERER_ENABLE_VERTEXCOLOR
    varyings.v_color = attributes.COLOR_0;
  #endif


  VertexInputs vertexInputs = getVertexInputs(attributes);

  // positionWS
  varyings.v_pos = vertexInputs.positionWS;

  // positionVS
  #if SCENE_FOG_MODE != 0
	  varyings.v_positionVS = vertexInputs.positionVS;
	#endif

  // normalWS、tangentWS、bitangentWS
  #ifdef RENDERER_HAS_NORMAL
    varyings.v_normal = vertexInputs.normalWS;
    #ifdef RENDERER_HAS_TANGENT
      varyings.v_tangent = vertexInputs.tangentWS;
      varyings.v_bitangent = vertexInputs.bitangentWS;
    #endif
  #endif

  // ShadowCoord
  #if defined(NEED_CALCULATE_SHADOWS) && (SCENE_SHADOW_CASCADED_COUNT == 1)
      varyings.v_shadowCoord = getShadowCoord(vertexInputs.positionWS);
  #endif

  gl_Position = renderer_MVPMat * vertexInputs.positionOS;

  return varyings;
}

void PBRFragment(Varyings varyings) {
  SurfaceData surfaceData = getSurfaceData(varyings, gl_FrontFacing);

  BRDFData brdfData;
  // Can modify surfaceData here.
  initBRDFData(varyings, surfaceData, brdfData, gl_FrontFacing);

  vec4 color = vec4(0, 0, 0, surfaceData.opacity);

  // Get shadow attenuation
  float shadowAttenuation = 1.0;
  #if defined(SCENE_DIRECT_LIGHT_COUNT) && defined(NEED_CALCULATE_SHADOWS)
    #if SCENE_SHADOW_CASCADED_COUNT == 1
      vec3 shadowCoord = varyings.v_shadowCoord;
    #else
      vec3 shadowCoord = getShadowCoord(varyings.v_pos);
    #endif
    shadowAttenuation *= sampleShadowMap(varyings.v_pos, shadowCoord);
  #endif

  // Evaluate direct lighting
  evaluateDirectRadiance(shadowAttenuation, brdfData, color.rgb);

  // IBL
  evaluateIBL(brdfData, color.rgb);

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