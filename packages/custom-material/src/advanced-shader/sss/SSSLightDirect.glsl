#define FUNCTION_SURFACE_SHADING surfaceShadingSSS

#include "BRDF.glsl"
#include "ReflectionLobe.glsl"
#include "./SSSFunction.glsl"

void surfaceShadingSSS(Varyings varyings, SurfaceData surfaceData, BRDFData brdfData, vec3 incidentDirection, vec3 lightColor, inout vec3 totalDiffuseColor, inout vec3 totalSpecularColor) {

    vec3 diffuseColor = vec3(0);
    vec3 specularColor = vec3(0);

    #ifdef MATERIAL_HAS_CURVATEXTURE
    vec4 skinCurvatureTexture = texture2D(material_CurvatureTexture, varyings.uv);
    #else
    vec4 skinCurvatureTexture =vec4(1);
   #endif

    float skintexture = skinCurvatureTexture.r * material_CurvaturePower ;
    vec3 scatterAmt = material_SkinScatterAmount.rgb * skintexture;
    vec3 sg = sgdiffuseLighting(incidentDirection, surfaceData.normal, scatterAmt);
    vec3 irradiance = sg * lightColor * PI;

    // ClearCoat Lobe
    float attenuation = clearCoatLobe(varyings, surfaceData, brdfData, incidentDirection, lightColor, specularColor);

    vec3 attenuationIrradiance = attenuation * irradiance;
    // Diffuse Lobe
    diffuseLobe(varyings, surfaceData, brdfData, attenuationIrradiance, diffuseColor);
    // Specular Lobe
    // if not limited,  may lead to light leakage
    if(surfaceData.dotNV > EPSILON){
        specularLobe(varyings, surfaceData, brdfData, incidentDirection, attenuationIrradiance, specularColor);
    }

    totalDiffuseColor += diffuseColor;
    totalSpecularColor += specularColor;
}

#include "LightDirectPBR.glsl"