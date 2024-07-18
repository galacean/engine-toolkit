#define FUNCTION_SPECULAR_IBL evaluateSpecularIBL_iridescence

#include "./IridescenceFunction.glsl"
#include "LightIndirectPBR.glsl"

void evaluateSpecularIBL_iridescence(BRDFData brdfData, float specularAO, float radianceAttenuation, inout vec3 specularColor){
 
 vec3 reflectdir = reflect(brdfData.normal,-brdfData.viewDir);
 vec3 halfdir = reflectdir + brdfData.viewDir;
 float cosTheta1= dot(halfdir,reflectdir);
 vec3 fresnelIridescent = ThinFilmIridescence(cosTheta1, material_Eta2 ,specularColor ,material_IridescenceThickness);
 vec3 envBRDF = envBRDFApprox(brdfData.specularColor, brdfData.roughness, brdfData.dotNV );
 vec3 fator = mix(envBRDF,fresnelIridescent,material_Iridescence);

 vec3 radiance = getLightProbeRadiance(brdfData, brdfData.normal, brdfData.roughness);
 specularColor += specularAO * radianceAttenuation * radiance * fator ;
}