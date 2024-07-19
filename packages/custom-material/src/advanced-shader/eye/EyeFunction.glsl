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

vec2 parallaxOffset( float heighttex, float height, vec3 viewDir )
   {
     float heightTex = heighttex * height- height/2.0;
     vec3 s = viewDir;
     s.z -= 0.42;
     s.y -= s.y;
     return  heightTex * (s.xy / s.z);
   }

vec3 calculateEyeColor(Varyings varyings, mat3 tbn)
{
  // Sclera UV
  vec2 scleraUV = (varyings.uv * material_ScleraSize)-((material_ScleraSize-1.0)/2.0);

  // Sclera Texture
  #ifdef MATERIAL_HAS_SCLERA_TEXTURE  
   vec4 scleraColor = texture2D(material_ScleraTexture, scleraUV);
   scleraColor *= material_ScleraColor;
  #ifndef ENGINE_IS_COLORSPACE_GAMMA
   scleraColor = gammaToLinear(scleraColor);
  #endif
  #else
   vec4 scleraColor = vec4(1.0);
  #endif

  // Iris Size For Mask
  vec2 irisSizeUV = (varyings.uv  * material_IrisSize) - ((material_IrisSize-1.0)/2.0);
  float irisSize  = material_IrisSize * 0.6;

  // Pupil Size
  vec2 pupilSize = mix(vec2(mix(0.5,0.2,irisSize/5.0)),vec2(mix(1.2,0.75,irisSize/5.0)),material_PupilSize.xy);
  
  // Parallax UV
  vec2 parallaxUV = mix((varyings.uv * 0.75)-((0.75-1.0)/2.0) ,(varyings.uv  * pupilSize)-((pupilSize-1.0)/2.0),varyings.uv );

  // Get Mask
  float heighttexture = 0.0;
  #ifdef MATERIAL_HAS_SCLERA_MASK
   vec3 irismasktex = (texture2D(material_Scleramask, irisSizeUV)).rgb;
   float uvmask = 1.0 - (texture2D(material_Scleramask, varyings.uv )).b;
   heighttexture = 1.0 - (texture2D(material_Scleramask, parallaxUV)).b;
  #else
   vec3 irismasktex = vec3(1.0);
   float uvmask = 1.0;
   heighttexture = 1.0;
  #endif

  // Transform ViewdirWS To ViewdirTS
  vec3 vDir = normalize(camera_Position - varyings.positionWS); 
  vec3 viewDirInTBN = tbn * vDir;

  vec2 offset = parallaxOffset(heighttexture, material_Parallax, viewDirInTBN);

  // Iris UV And Pupil UV
  vec2 irisUV = (varyings.uv  * irisSize) - ((irisSize-1.0)/2.0);
  vec2 pupilUV = irisUV * ((-1.0 + (uvmask * pupilSize)))-( 0.5 *(uvmask * pupilSize)); 
     
  // Parallax Color
  vec4 parallax = vec4(0.0);
  #ifdef MATERIAL_HAS_IRIS_TEXTURE
   parallax = texture2D(material_IrisTexture, pupilUV - offset);
  #ifndef ENGINE_IS_COLORSPACE_GAMMA
   parallax = gammaToLinear(parallax);
  #endif
   parallax.rgb *= material_IrisColor.rgb;
  #endif

  vec4 baseColor = mix(scleraColor,parallax,irismasktex.r);

   // Limbus
  vec4 limbalstrength = (0.0 - (material_Limbal * 10.0 )) * baseColor;
  float limbalRadius = saturate(irismasktex.g * (1.0 - irismasktex.r));
  baseColor = mix(baseColor,limbalstrength,limbalRadius);
  return baseColor.rgb;
}

vec3 calculateEyeNormal(Varyings varyings, mat3 tbn, bool isFrontFacing)
{
  // Sclera UV
  vec2 scleraUV = (varyings.uv * material_ScleraSize)-((material_ScleraSize-1.0)/2.0);
  // Iris UV
  vec2 irisSizeUV = (varyings.uv  * material_IrisSize) - ((material_IrisSize-1.0)/2.0);

  #ifdef MATERIAL_HAS_SCLERA_MASK
   vec3 irismasktex = (texture2D(material_Scleramask, irisSizeUV)).rgb;
  #else
   vec3 irismasktex = vec3(1.0);
  #endif

  // Normal
  #ifdef MATERIAL_HAS_SCLERA_NORMAL
   vec3 scleraNormal = getNormalByNormalTexture(tbn, material_ScleraNormal, material_ScleraNormalStrength, scleraUV, isFrontFacing);
  #else
   vec3 scleraNormal = tbn[2];
  #endif

  #ifdef MATERIAL_HAS_IRIS_NORMAL
   vec3 irisNormal = getNormalByNormalTexture(tbn, material_IrisNormal, material_IrisNormalStrength, irisSizeUV, isFrontFacing);
  #else
   vec3 irisNormal =  tbn[2];
  #endif
  return mix(scleraNormal,irisNormal,irismasktex.r);
}