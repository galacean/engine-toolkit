#define FUNCTION_SPECULAR_IBL evaluateSpecularIBL_iridescence
#include "BRDF.glsl"
#include "./IridescenceFunction.glsl"
#include "LightProbe.glsl"

void evaluateSpecularIBL_iridescence(Varyings varyings, SurfaceData surfaceData, BRDFData brdfData, float radianceAttenuation, inout vec3 specularColor){
 
 vec3 reflectdir = reflect(surfaceData.normal,-surfaceData.viewDir);
 vec3 halfdir = reflectdir + surfaceData.viewDir;
 float cosTheta1= dot(halfdir,reflectdir);
 vec3 fresnelIridescent = ThinFilmIridescence(cosTheta1, material_Eta2 , brdfData.specularColor ,material_IridescenceThickness);
 vec3 envBRDF =envBRDFApprox(brdfData.specularColor, brdfData.roughness, surfaceData.dotNV );
 vec3 fator = mix(envBRDF,fresnelIridescent,material_Iridescence);

 vec3 radiance = getLightProbeRadiance(surfaceData, surfaceData.normal, brdfData.roughness);
 specularColor += surfaceData.specularAO * radianceAttenuation * radiance * fator ;
}

#include "LightIndirectPBR.glsl"