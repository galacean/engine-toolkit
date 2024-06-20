#include "AttributesPBR.glsl"
#include "VaryingsPBR.glsl"
#include "Common.glsl"
#include "Vertex.glsl"
#include "Fog.glsl"

#include "MaterialInputPBR.glsl"
#include "LightDirectPBR.glsl"
#include "LightIndirectPBR.glsl"
#include "EyeFunction.glsl"

float material_ScleraSize;
float material_IrisSize;
vec2 material_PupilSize;
float material_Limbal;
float material_Parallax;
float material_ScleraNormalStrength;
float material_IrisNormalStrength;
vec4 material_ScleraColor;
vec4 material_IrisColor;

#ifdef MATERIAL_HAS_SCLERA_NORMAL
 sampler2D material_ScleraNormal;
#endif

#ifdef MATERIAL_HAS_SCLERA_TEXTURE
 sampler2D material_ScleraTexture;
#endif

#ifdef MATERIAL_HAS_SCLERA_MASK
 sampler2D material_Scleramask;
#endif

#ifdef MATERIAL_HAS_IRIS_TEXTURE
 sampler2D material_IrisTexture;
#endif

#ifdef MATERIAL_HAS_IRIS_NORMAL
 sampler2D material_IrisNormal;
#endif

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

  //sclera uv
	vec2 scleraUV = (v.v_uv * material_ScleraSize) - ((material_ScleraSize-1.0)/2.0);

  //sclera texture
  #ifdef MATERIAL_HAS_SCLERA_TEXTURE  
   vec4 scleraColor = texture2D(material_ScleraTexture, scleraUV);
   scleraColor *= material_ScleraColor;
  #ifndef ENGINE_IS_COLORSPACE_GAMMA
   scleraColor = gammaToLinear(ScleraColor);
  #endif
  #else
   vec4 scleraColor = vec4(1.0,1.0,1.0,1.0);
  #endif

  //iris size for mask
  vec2 irisSizeUV = (v.v_uv * material_IrisSize) - ((material_IrisSize-1.0)/2.0);
  float irisSize  = material_IrisSize * 0.6;

  //pupil size
  float pupilSizeX = mix(mix(0.5,0.2,irisSize/5.0),mix(1.2,0.75,irisSize/5.0),material_PupilSize.x);
  float pupilSizeY = mix(mix(0.5,0.2,irisSize/5.0),mix(1.2,0.75,irisSize/5.0),material_PupilSize.y);
  vec2 pupilSize = vec2(pupilSizeX,pupilSizeY);

  //parallax uv
  vec2 parallaxUV = mix((v.v_uv * 0.75)-((0.75-1.0)/2.0) ,( v.v_uv * pupilSize)-((pupilSize-1.0)/2.0),v.v_uv);

  //get mask
  float h = 0.0;
  #ifdef MATERIAL_HAS_SCLERA_MASK
   float irismasktex = (texture2D(material_Scleramask, irisSizeUV)).r;
   float irisoffsettex = (texture2D(material_Scleramask, irisSizeUV)).g;
   float uvmask =  1.0-(texture2D(material_Scleramask, v.v_uv )).b ;
   h = 1.0 - (texture2D(material_Scleramask, parallaxUV  )).b;
  #else
   float irismasktex = 1.0;
   float irisoffsettex = 1.0;
   float uvmask = 1.0;
   h = 1.0;
  #endif

  //transform viewdirWS to viewdirTS
  vec3 vDir = -normalize(camera_Position - v.v_pos); 
  #ifdef RENDERER_HAS_TANGENT
   mat3 tbn = mat3(surfaceData.tangent, surfaceData.bitangent, surfaceData.normal);
  #else
   mat3 tbn = getTBN(temp_varyings, gl_FrontFacing);
  #endif
  vec3 viewDirInTBN = tbn * vDir;

	vec2 offset = ParallaxOffset(h, material_Parallax, viewDirInTBN) ;

  //iris uv and pupil uv
  vec2 irisUV = (v.v_uv * irisSize) - ((irisSize-1.0)/2.0);
  vec2 pupilUV = irisUV * ((-1.0 + (uvmask * pupilSize)))-( 0.5 *(uvmask * pupilSize)); 
     
  //parallax color
  vec4 parallax = vec4(0,0,0,0);
  #ifdef MATERIAL_HAS_IRIS_TEXTURE
   parallax = texture2D(material_IrisTexture, pupilUV - offset);
  #ifndef ENGINE_IS_COLORSPACE_GAMMA
   parallax = gammaToLinear(parallax);
  #endif
   parallax.rgb *= material_IrisColor.rgb;
  #endif

  vec4 baseColor = mix(ScleraColor,parallax,irismasktex);

  //limbus
  vec4 limbalstrength = (0.0 - (material_Limbal * 10.0 )) * baseColor;
  float limbalRadius =saturate( irisoffsettex  * (1.0-irismasktex));
  baseColor = mix(baseColor,limbalstrength,limbalRadius);

  //normal
  #ifdef MATERIAL_HAS_SCLERA_NORMAL
   vec3 scleraNormal = getNormalByNormalTexture(tbn, material_ScleraNormal, material_ScleraNormalStrength, scleraUV, gl_FrontFacing);
  #else
   vec3 scleraNormal = tbn[2];
  #endif

  #ifdef MATERIAL_HAS_IRIS_NORMAL
   vec3 irisNormal = getNormalByNormalTexture(tbn, material_IrisNormal, material_IrisNormalStrength, irisSizeUV, gl_FrontFacing);
  #else
   vec3 irisNormal =  tbn[2];
  #endif

  surfaceData.albedoColor = baseColor.rgb;
  surfaceData.normal = mix(scleraNormal,irisNormal,irismasktex);
    
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