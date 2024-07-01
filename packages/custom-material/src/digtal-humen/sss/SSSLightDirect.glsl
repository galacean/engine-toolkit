#define FUNCTION_SURFACE_SHADING surfaceShading_sss

#include "LightDirectPBR.glsl"
#include "SSSFunction.glsl"

void surfaceShading_sss(vec3 incidentDirection, vec3 lightColor, BRDFData brdfData, inout vec3 color) {

    vec3 diffuseColor = vec3(0);
    vec3 specularColor = vec3(0);

    #ifdef MATERIAL_HAS_CURVATEXTURE
    vec4 skinCurvatureTexture = texture2D(material_CurvatureTexture, v.v_uv) ;
    #else
    vec4 skinCurvatureTexture =vec4(1,1,1,1) ;
   #endif

    float skintexture = skinCurvatureTexture.r * material_CurvaturePower ;
    vec3 scatterAmt = material_SkinScatterAmount.rgb * skintexture;
    vec3 SG = SGDiffuseLighting( brdfData.normal, incidentDirection, scatterAmt);
    vec3 irradiance = SG * lightColor * PI;

    // ClearCoat Lobe
    float attenuation = FUNCTION_CLEAR_COAT_LOBE(incidentDirection, lightColor, brdfData, specularColor);

    vec3 attenuationIrradiance = irradiance * irradiance;
    // Diffuse Lobe
    FUNCTION_DIFFUSE_LOBE(brdfData, attenuationIrradiance, diffuseColor);
    // Specular Lobe
    FUNCTION_SPECULAR_LOBE(brdfData, incidentDirection, attenuationIrradiance, specularColor);

    color += diffuseColor + specularColor;
}