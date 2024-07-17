
#ifndef LIGHT_DIRECT_PBR_INCLUDED
#define LIGHT_DIRECT_PBR_INCLUDED

#ifndef FUNCTION_SURFACE_SHADING
    #define FUNCTION_SURFACE_SHADING surfaceShading
#endif
#ifndef FUNCTION_DIFFUSE_LOBE
    #define FUNCTION_DIFFUSE_LOBE diffuseLobe
#endif
#ifndef FUNCTION_SPECULAR_LOBE
    #define FUNCTION_SPECULAR_LOBE specularLobe
#endif
#ifndef FUNCTION_CLEAR_COAT_LOBE
    #define FUNCTION_CLEAR_COAT_LOBE clearCoatLobe
#endif

#include "BRDF.glsl"
#include "Light.glsl"
#include "Shadow.glsl"


void diffuseLobe(BRDFData brdfData, vec3 attenuationIrradiance, inout vec3 diffuseColor){
    diffuseColor += attenuationIrradiance * BRDF_Diffuse_Lambert( brdfData.diffuseColor );
}

void specularLobe(SurfaceData surfaceData, BRDFData brdfData, vec3 incidentDirection, vec3 attenuationIrradiance, inout vec3 specularColor){
    specularColor += attenuationIrradiance * BRDF_Specular_GGX( incidentDirection, surfaceData, surfaceData.normal, brdfData.specularColor, brdfData.roughness);
}

float clearCoatLobe(vec3 incidentDirection, vec3 color, SurfaceData surfaceData, BRDFData brdfData, inout vec3 specularColor){
    float attenuation = 1.0;

    #ifdef MATERIAL_ENABLE_CLEAR_COAT
        float clearCoatDotNL = saturate( dot( surfaceData.clearCoatNormal, incidentDirection ) );
        vec3 clearCoatIrradiance = clearCoatDotNL * color;

        specularColor += surfaceData.clearCoat * clearCoatIrradiance * BRDF_Specular_GGX( incidentDirection, surfaceData, surfaceData.clearCoatNormal, brdfData.clearCoatSpecularColor, brdfData.clearCoatRoughness );
        attenuation -= surfaceData.clearCoat * F_Schlick(0.04, surfaceData.clearCoatDotNV);
    #endif

    return attenuation;
}


void surfaceShading(vec3 incidentDirection, vec3 lightColor, SurfaceData surfaceData, BRDFData brdfData, inout vec3 color) {

    vec3 diffuseColor = vec3(0);
    vec3 specularColor = vec3(0);
    float dotNL = saturate( dot( surfaceData.normal, incidentDirection ) );
    vec3 irradiance = dotNL * lightColor * PI;

    // ClearCoat Lobe
    float attenuation = FUNCTION_CLEAR_COAT_LOBE(incidentDirection, lightColor, surfaceData, brdfData, specularColor);

    vec3 attenuationIrradiance = attenuation * irradiance;
    // Diffuse Lobe
    FUNCTION_DIFFUSE_LOBE(brdfData, attenuationIrradiance, diffuseColor);
    // Specular Lobe
    FUNCTION_SPECULAR_LOBE(surfaceData, brdfData, incidentDirection, attenuationIrradiance, specularColor);

    color += diffuseColor + specularColor;

}

#ifdef SCENE_DIRECT_LIGHT_COUNT

    void addDirectionalDirectLightRadiance(DirectLight directionalLight, SurfaceData surfaceData, BRDFData brdfData, inout vec3 color) {
        vec3 lightColor = directionalLight.color;
        vec3 direction = -directionalLight.direction;

        FUNCTION_SURFACE_SHADING( direction, lightColor, surfaceData, brdfData, color );

    }

#endif

#ifdef SCENE_POINT_LIGHT_COUNT

	void addPointDirectLightRadiance(PointLight pointLight, SurfaceData surfaceData, BRDFData brdfData, inout vec3 color) {
		vec3 lVector = pointLight.position - surfaceData.position;
		vec3 direction = normalize( lVector );
		float lightDistance = length( lVector );

		vec3 lightColor = pointLight.color;
		lightColor *= clamp(1.0 - pow(lightDistance/pointLight.distance, 4.0), 0.0, 1.0);

        FUNCTION_SURFACE_SHADING( direction, lightColor, surfaceData, brdfData, color );
	}

#endif

#ifdef SCENE_SPOT_LIGHT_COUNT

	void addSpotDirectLightRadiance(SpotLight spotLight, SurfaceData surfaceData, BRDFData brdfData, inout vec3 color) {

		vec3 lVector = spotLight.position - surfaceData.position;
		vec3 direction = normalize( lVector );
		float lightDistance = length( lVector );
		float angleCos = dot( direction, -spotLight.direction );

		float spotEffect = smoothstep( spotLight.penumbraCos, spotLight.angleCos, angleCos );
		float decayEffect = clamp(1.0 - pow(lightDistance/spotLight.distance, 4.0), 0.0, 1.0);

		vec3 lightColor = spotLight.color;
		lightColor *= spotEffect * decayEffect;

        FUNCTION_SURFACE_SHADING( direction, lightColor, surfaceData, brdfData, color );

	}


#endif

void evaluateDirectRadiance(float shadowAttenuation, SurfaceData surfaceData, BRDFData brdfData, inout vec3 color){
    #ifdef SCENE_DIRECT_LIGHT_COUNT

        for ( int i = 0; i < SCENE_DIRECT_LIGHT_COUNT; i ++ ) {
            // warning: use `continue` syntax may trigger flickering bug in safri 16.1.
            if(!isRendererCulledByLight(renderer_Layer.xy, scene_DirectLightCullingMask[i])){
                #ifdef GRAPHICS_API_WEBGL2
                    DirectLight directionalLight = getDirectLight(i);
                #else
                    DirectLight directionalLight;
                    directionalLight.color = scene_DirectLightColor[i];
                    directionalLight.direction = scene_DirectLightDirection[i];
                #endif
                
                #ifdef NEED_CALCULATE_SHADOWS
                    if (i == 0) { // Sun light index is always 0
                        directionalLight.color *= shadowAttenuation;
                    }
                #endif
                addDirectionalDirectLightRadiance( directionalLight, surfaceData, brdfData, color );
            }
        }

    #endif

    #ifdef SCENE_POINT_LIGHT_COUNT

        for ( int i = 0; i < SCENE_POINT_LIGHT_COUNT; i ++ ) {
            if(!isRendererCulledByLight(renderer_Layer.xy, scene_PointLightCullingMask[i])){
                #ifdef GRAPHICS_API_WEBGL2
                    PointLight pointLight = getPointLight(i);
                #else
                    PointLight pointLight;
                    pointLight.color = scene_PointLightColor[i];
                    pointLight.position = scene_PointLightPosition[i];
                    pointLight.distance = scene_PointLightDistance[i];
                #endif
                addPointDirectLightRadiance( pointLight, surfaceData, brdfData, color );
            } 
        }

    #endif

    #ifdef SCENE_SPOT_LIGHT_COUNT
      
        for ( int i = 0; i < SCENE_SPOT_LIGHT_COUNT; i ++ ) {
            if(!isRendererCulledByLight(renderer_Layer.xy, scene_SpotLightCullingMask[i])){
                #ifdef GRAPHICS_API_WEBGL2
                    SpotLight spotLight = getSpotLight(i);
                #else
                    SpotLight spotLight;
                    spotLight.color = scene_SpotLightColor[i];
                    spotLight.position = scene_SpotLightPosition[i];
                    spotLight.direction = scene_SpotLightDirection[i];
                    spotLight.distance = scene_SpotLightDistance[i];
                    spotLight.angleCos = scene_SpotLightAngleCos[i];
                    spotLight.penumbraCos = scene_SpotLightPenumbraCos[i];
                #endif
                addSpotDirectLightRadiance( spotLight, surfaceData, brdfData, color );
            } 
        }

    #endif
}


#endif