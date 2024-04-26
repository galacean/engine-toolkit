vec3 addDirectRadiance(vec3 incidentDirection, vec3 color, SurfaceData surfaceData) {
    float attenuation = 1.0;

    vec3 Fd = vec3(0);
    vec3 Fs = vec3(0);

    #ifdef MATERIAL_ENABLE_CLEAR_COAT
        float clearCoatDotNL = saturate( dot( surfaceData.clearCoatNormal, incidentDirection ) );
        vec3 clearCoatIrradiance = clearCoatDotNL * color;

        Fs += surfaceData.clearCoat * clearCoatIrradiance * BRDF_Specular_GGX( incidentDirection, surfaceData, surfaceData.clearCoatNormal, vec3( 0.04 ), surfaceData.clearCoatRoughness );
        attenuation -= surfaceData.clearCoat * F_Schlick(surfaceData.f0, surfaceData.clearCoatDotNV);
    #endif

    float dotNL = saturate( dot( surfaceData.normal, incidentDirection ) );
    vec3 irradiance = dotNL * color * PI;

    Fs += attenuation * irradiance * BRDF_Specular_GGX( incidentDirection, surfaceData, surfaceData.normal, surfaceData.specularColor, surfaceData.roughness);
    Fd += attenuation * irradiance * BRDF_Diffuse_Lambert( surfaceData.diffuseColor );

    return Fd + Fs;

}

#ifdef SCENE_DIRECT_LIGHT_COUNT

    void addDirectionalDirectLightRadiance(DirectLight directionalLight, SurfaceData surfaceData, inout vec3 color) {
        vec3 color2 = directionalLight.color;
        vec3 direction = -directionalLight.direction;

		color += addDirectRadiance( direction, color2, surfaceData );

    }

#endif

#ifdef SCENE_POINT_LIGHT_COUNT

	void addPointDirectLightRadiance(PointLight pointLight, SurfaceData surfaceData, inout vec3 color) {

		vec3 lVector = pointLight.position - surfaceData.position;
		vec3 direction = normalize( lVector );

		float lightDistance = length( lVector );

		vec3 color2 = pointLight.color;
		color2 *= clamp(1.0 - pow(lightDistance/pointLight.distance, 4.0), 0.0, 1.0);

		color += addDirectRadiance( direction, color2, surfaceData );

	}

#endif

#ifdef SCENE_SPOT_LIGHT_COUNT

	void addSpotDirectLightRadiance(SpotLight spotLight, SurfaceData surfaceData, inout vec3 color) {

		vec3 lVector = spotLight.position - surfaceData.position;
		vec3 direction = normalize( lVector );

		float lightDistance = length( lVector );
		float angleCos = dot( direction, -spotLight.direction );

		float spotEffect = smoothstep( spotLight.penumbraCos, spotLight.angleCos, angleCos );
		float decayEffect = clamp(1.0 - pow(lightDistance/spotLight.distance, 4.0), 0.0, 1.0);

		vec3 color2 = spotLight.color;
		color2 *= spotEffect * decayEffect;

		color += addDirectRadiance( direction, color2, surfaceData );

	}


#endif

void evaluateDirectRadiance(Temp_Varyings v, SurfaceData surfaceData, inout vec3 color){
    float shadowAttenuation = 1.0;

    #ifdef SCENE_DIRECT_LIGHT_COUNT
        shadowAttenuation = 1.0;
        #ifdef SCENE_IS_CALCULATE_SHADOWS
            shadowAttenuation *= sampleShadowMap(v);
            // int sunIndex = int(scene_ShadowInfo.z);
        #endif

        DirectLight directionalLight;
        for ( int i = 0; i < SCENE_DIRECT_LIGHT_COUNT; i ++ ) {
            // warning: use `continue` syntax may trigger flickering bug in safri 16.1.
            if(!isRendererCulledByLight(renderer_Layer.xy, scene_DirectLightCullingMask[i])){
                directionalLight.color = scene_DirectLightColor[i];
                #ifdef SCENE_IS_CALCULATE_SHADOWS
                    if (i == 0) { // Sun light index is always 0
                        directionalLight.color *= shadowAttenuation;
                    }
                #endif
                directionalLight.direction = scene_DirectLightDirection[i];
                addDirectionalDirectLightRadiance( directionalLight, surfaceData, color );
            }
        }

    #endif

    #ifdef SCENE_POINT_LIGHT_COUNT

        PointLight pointLight;

        for ( int i = 0; i < SCENE_POINT_LIGHT_COUNT; i ++ ) {
            if(!isRendererCulledByLight(renderer_Layer.xy, scene_PointLightCullingMask[i])){
                pointLight.color = scene_PointLightColor[i];
                pointLight.position = scene_PointLightPosition[i];
                pointLight.distance = scene_PointLightDistance[i];

                addPointDirectLightRadiance( pointLight, surfaceData, color );
            } 
        }

    #endif

    #ifdef SCENE_SPOT_LIGHT_COUNT

        SpotLight spotLight;

        for ( int i = 0; i < SCENE_SPOT_LIGHT_COUNT; i ++ ) {
            if(!isRendererCulledByLight(renderer_Layer.xy, scene_SpotLightCullingMask[i])){
                spotLight.color = scene_SpotLightColor[i];
                spotLight.position = scene_SpotLightPosition[i];
                spotLight.direction = scene_SpotLightDirection[i];
                spotLight.distance = scene_SpotLightDistance[i];
                spotLight.angleCos = scene_SpotLightAngleCos[i];
                spotLight.penumbraCos = scene_SpotLightPenumbraCos[i];

                addSpotDirectLightRadiance( spotLight, surfaceData, color );
            } 
        }

    #endif
}