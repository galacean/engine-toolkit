#define FUNCTION_SPECULAR_LOBE specularLobe_iridescence

#include "./IridescenceFunction.glsl"
#include "LightDirectPBR.glsl"

void specularLobe_iridescence(BRDFData brdfData, vec3 incidentDirection, vec3 attenuationIrradiance, inout vec3 specularColor){

 vec3 thin= DirectBDRFIridescence(BRDFData brdfData, vec3 incidentDirection, brdfData.normal, brdfData.specularColor, brdfData.roughness);
 vec3 BRDF_Specular = BRDF_Specular_GGX( incidentDirection, brdfData, brdfData.normal, brdfData.specularColor, brdfData.roughness);
 vec3 factor =mix(BRDF_Specular,thin,material_Iridescence);

 specularColor += attenuationIrradiance * factor;
}