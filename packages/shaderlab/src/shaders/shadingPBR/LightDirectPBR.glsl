
// #ifndef LIGHT_DIRECT_PBR_INCLUDED
// #define LIGHT_DIRECT_PBR_INCLUDED 1

#include "BRDF.glsl"
#include "Light.glsl"
#include "Shadow.glsl"


void diffuseLobe(BRDFData brdfData, vec3 attenuationIrradiance, inout vec3 diffuseColor){
    diffuseColor += attenuationIrradiance * BRDF_Diffuse_Lambert( brdfData.diffuseColor );
}

void specularLobe(BRDFData brdfData, vec3 incidentDirection, vec3 attenuationIrradiance, inout vec3 specularColor){
    specularColor += attenuationIrradiance * BRDF_Specular_GGX( incidentDirection, brdfData, brdfData.normal, brdfData.specularColor, brdfData.roughness);
}

float clearCoatLobe(vec3 incidentDirection, vec3 color, BRDFData brdfData, inout vec3 specularColor){
    float attenuation = 1.0;

    #ifdef MATERIAL_ENABLE_CLEAR_COAT
        float clearCoatDotNL = saturate( dot( brdfData.clearCoatNormal, incidentDirection ) );
        vec3 clearCoatIrradiance = clearCoatDotNL * color;

        specularColor += brdfData.clearCoat * clearCoatIrradiance * BRDF_Specular_GGX( incidentDirection, brdfData, brdfData.clearCoatNormal, vec3( 0.04 ), brdfData.clearCoatRoughness );
        attenuation -= brdfData.clearCoat * F_Schlick(0.04, brdfData.clearCoatDotNV);
    #endif

    return attenuation;
}


void addRadiance(vec3 incidentDirection, vec3 lightColor, BRDFData brdfData, inout vec3 color) {

    vec3 diffuseColor = vec3(0);
    vec3 specularColor = vec3(0);
    float dotNL = saturate( dot( brdfData.normal, incidentDirection ) );
    vec3 irradiance = dotNL * lightColor * PI;

    // ClearCoat Lobe
    float attenuation = clearCoatLobe(incidentDirection, lightColor, brdfData, specularColor);

    vec3 attenuationIrradiance = irradiance * irradiance;
    // Diffuse Lobe
    diffuseLobe(brdfData, attenuationIrradiance, diffuseColor);
    // Specular Lobe
    specularLobe(brdfData, incidentDirection, attenuationIrradiance, specularColor);

    color += diffuseColor + specularColor;

}

#ifdef SCENE_DIRECT_LIGHT_COUNT

    void addDirectionalDirectLightRadiance(DirectLight directionalLight, BRDFData brdfData, inout vec3 color) {
        vec3 lightColor = directionalLight.color;
        vec3 direction = -directionalLight.direction;

        addRadiance( direction, lightColor, brdfData, color );

    }

#endif

#ifdef SCENE_POINT_LIGHT_COUNT

	void addPointDirectLightRadiance(PointLight pointLight, BRDFData brdfData, inout vec3 color) {

		vec3 lVector = pointLight.position - brdfData.position;
		vec3 direction = normalize( lVector );
		float lightDistance = length( lVector );

		vec3 lightColor = pointLight.color;
		lightColor *= clamp(1.0 - pow(lightDistance/pointLight.distance, 4.0), 0.0, 1.0);

        addRadiance( direction, lightColor, brdfData, color );

	}

#endif

#ifdef SCENE_SPOT_LIGHT_COUNT

	void addSpotDirectLightRadiance(SpotLight spotLight, BRDFData brdfData, inout vec3 color) {

		vec3 lVector = spotLight.position - brdfData.position;
		vec3 direction = normalize( lVector );
		float lightDistance = length( lVector );
		float angleCos = dot( direction, -spotLight.direction );

		float spotEffect = smoothstep( spotLight.penumbraCos, spotLight.angleCos, angleCos );
		float decayEffect = clamp(1.0 - pow(lightDistance/spotLight.distance, 4.0), 0.0, 1.0);

		vec3 lightColor = spotLight.color;
		lightColor *= spotEffect * decayEffect;

        addRadiance( direction, lightColor, brdfData, color );

	}


#endif

void evaluateDirectRadiance(Temp_Varyings v, BRDFData brdfData, inout vec3 color){
    float shadowAttenuation = 1.0;

    #ifdef SCENE_DIRECT_LIGHT_COUNT
        shadowAttenuation = 1.0;
        #ifdef SCENE_IS_CALCULATE_SHADOWS
            shadowAttenuation *= sampleShadowMap(v);
        #endif

        DirectLight directionalLight;
        for ( int i = 0; i < SCENE_DIRECT_LIGHT_COUNT; i ++ ) {
            getLightInfo(i, directionalLight);
            // warning: use `continue` syntax may trigger flickering bug in safri 16.1.
            if(!directionalLight.isCulled){
                #ifdef SCENE_IS_CALCULATE_SHADOWS
                    if (i == 0) { // Sun light index is always 0
                        directionalLight.color *= shadowAttenuation;
                    }
                #endif
                addDirectionalDirectLightRadiance( directionalLight, brdfData, color );
            }
        }

    #endif

    #ifdef SCENE_POINT_LIGHT_COUNT

        PointLight pointLight;
        for ( int i = 0; i < SCENE_POINT_LIGHT_COUNT; i ++ ) {
            getLightInfo(i, pointLight);
            if(!pointLight.isCulled){
                addPointDirectLightRadiance( pointLight, brdfData, color );
            } 
        }

    #endif

    #ifdef SCENE_SPOT_LIGHT_COUNT

        SpotLight spotLight;
        for ( int i = 0; i < SCENE_SPOT_LIGHT_COUNT; i ++ ) {
            getLightInfo(i, spotLight);
            if(!spotLight.isCulled){
                addSpotDirectLightRadiance( spotLight, brdfData, color );
            } 
        }

    #endif
}


// #endif