#ifndef REFLECTION_LOBE_INCLUDED
#define REFLECTION_LOBE_INCLUDED

void diffuseLobe(Varyings varyings, SurfaceData surfaceData, BRDFData brdfData, vec3 attenuationIrradiance, inout vec3 diffuseColor){
    diffuseColor += attenuationIrradiance * BRDF_Diffuse_Lambert( brdfData.diffuseColor );
}

void specularLobe(Varyings varyings, SurfaceData surfaceData, BRDFData brdfData, vec3 incidentDirection, vec3 attenuationIrradiance, inout vec3 specularColor){
    vec3 BRDF_Specular_GGX = BRDF_Specular_GGX( incidentDirection, surfaceData, surfaceData.normal, brdfData.specularColor, brdfData.roughness);
    
    #ifdef MATERIAL_ENABLE_IRIDESCENCE
        BRDF_Specular_GGX = mix(BRDF_Specular_GGX, brdfData.iridescenceSpecularColor, surfaceData.iridesceceFactor);
    #endif

    specularColor += attenuationIrradiance * BRDF_Specular_GGX;
}

float clearCoatLobe(Varyings varyings, SurfaceData surfaceData, BRDFData brdfData, vec3 incidentDirection, vec3 color, inout vec3 specularColor){
    float attenuation = 1.0;

    #ifdef MATERIAL_ENABLE_CLEAR_COAT
        float clearCoatDotNL = saturate( dot( surfaceData.clearCoatNormal, incidentDirection ) );
        vec3 clearCoatIrradiance = clearCoatDotNL * color;

        specularColor += surfaceData.clearCoat * clearCoatIrradiance * BRDF_Specular_GGX( incidentDirection, surfaceData, surfaceData.clearCoatNormal, brdfData.clearCoatSpecularColor, brdfData.clearCoatRoughness );
        attenuation -= surfaceData.clearCoat * F_Schlick(0.04, surfaceData.clearCoatDotNV);
    #endif

    return attenuation;
}

#endif