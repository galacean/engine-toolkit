#define FUNCTION_SPECULAR_LOBE specularLobe_iridescence

#include "BRDF.glsl"
#include "./IridescenceFunction.glsl"

void specularLobe_iridescence(Varyings varyings, SurfaceData surfaceData, BRDFData brdfData, vec3 incidentDirection, vec3 attenuationIrradiance, inout vec3 specularColor){

 vec3 thin = DirectBDRFIridescence(surfaceData, incidentDirection, brdfData);
 vec3 BRDF_Specular = BRDF_Specular_GGX( incidentDirection, surfaceData, surfaceData.normal, brdfData.specularColor, brdfData.roughness);
 vec3 factor =mix(BRDF_Specular,thin,material_Iridescence);

 specularColor += attenuationIrradiance * factor;
}

#include "LightDirectPBR.glsl"