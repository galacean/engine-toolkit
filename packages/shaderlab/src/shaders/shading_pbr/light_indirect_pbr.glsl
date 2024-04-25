// ------------------------Diffuse------------------------

// sh need be pre-scaled in CPU.
vec3 getLightProbeIrradiance(vec3 sh[9], vec3 normal){
      normal.x = -normal.x;
      vec3 result = sh[0] +

            sh[1] * (normal.y) +
            sh[2] * (normal.z) +
            sh[3] * (normal.x) +

            sh[4] * (normal.y * normal.x) +
            sh[5] * (normal.y * normal.z) +
            sh[6] * (3.0 * normal.z * normal.z - 1.0) +
            sh[7] * (normal.z * normal.x) +
            sh[8] * (normal.x * normal.x - normal.y * normal.y);
    
    return max(result, vec3(0.0));

}

// ------------------------Specular------------------------

// ref: https://www.unrealengine.com/blog/physically-based-shading-on-mobile - environmentBRDF for GGX on mobile
vec3 envBRDFApprox(vec3 specularColor,float roughness, float dotNV ) {

    const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );

    const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );

    vec4 r = roughness * c0 + c1;

    float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;

    vec2 AB = vec2( -1.04, 1.04 ) * a004 + r.zw;

    return specularColor * AB.x + AB.y;

}


float getSpecularMIPLevel(float roughness, int maxMIPLevel ) {
    return roughness * float(maxMIPLevel);
}

vec3 getReflectedVector(Geometry geometry, vec3 n) {
    #ifdef MATERIAL_ENABLE_ANISOTROPY
        vec3 r = reflect(-geometry.viewDir, geometry.anisotropicN);
    #else
        vec3 r = reflect(-geometry.viewDir, n);
    #endif

    return r;
}

vec3 getLightProbeRadiance(Geometry geometry, vec3 normal, float roughness, int maxMIPLevel, float specularIntensity) {

    #ifndef SCENE_USE_SPECULAR_ENV
        return vec3(0);
    #else
        vec3 reflectVec = getReflectedVector(geometry, normal);
        reflectVec.x = -reflectVec.x; // TextureCube is left-hand,so x need inverse
        
        float specularMIPLevel = getSpecularMIPLevel(roughness, maxMIPLevel );

        #ifdef HAS_TEX_LOD
            vec4 envMapColor = textureCubeLodEXT( scene_EnvSpecularSampler, reflectVec, specularMIPLevel );
        #else
            vec4 envMapColor = textureCube( scene_EnvSpecularSampler, reflectVec, specularMIPLevel );
        #endif

        #ifdef SCENE_IS_DECODE_ENV_RGBM
            envMapColor.rgb = (RGBMToLinear(envMapColor, 5.0)).rgb;
            #ifdef ENGINE_IS_COLORSPACE_GAMMA
                envMapColor = linearToGamma(envMapColor);
            #endif
        #else
             #ifndef ENGINE_IS_COLORSPACE_GAMMA
                envMapColor = gammaToLinear(envMapColor);
            #endif
        #endif
        
        return envMapColor.rgb * specularIntensity;

    #endif

}

float computeSpecularOcclusion(float ambientOcclusion, float roughness, float dotNV ) {
    return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}

void evaluateIBL(Geometry geometry, Material material, inout ReflectedLight reflectedLight ){
     // IBL diffuse
    #ifdef SCENE_USE_SH
        vec3 irradiance = getLightProbeIrradiance(scene_EnvSH, geometry.normal);
        #ifdef ENGINE_IS_COLORSPACE_GAMMA
            irradiance = (linearToGamma(vec4(irradiance, 1.0))).rgb;
        #endif
        irradiance *= scene_EnvMapLight.diffuseIntensity;
    #else
       vec3 irradiance = scene_EnvMapLight.diffuse * scene_EnvMapLight.diffuseIntensity;
       irradiance *= PI;
    #endif

    reflectedLight.indirectDiffuse += irradiance * BRDF_Diffuse_Lambert( material.diffuseColor );

    // IBL specular
    vec3 radiance = getLightProbeRadiance(geometry, geometry.normal, material.roughness, int(scene_EnvMapLight.mipMapLevel), scene_EnvMapLight.specularIntensity);
    float radianceAttenuation = 1.0;

    #ifdef MATERIAL_ENABLE_CLEAR_COAT
        vec3 clearCoatRadiance = getLightProbeRadiance( geometry, geometry.clearCoatNormal, material.clearCoatRoughness, int(scene_EnvMapLight.mipMapLevel), scene_EnvMapLight.specularIntensity );

        reflectedLight.indirectSpecular += clearCoatRadiance * material.clearCoat * envBRDFApprox(vec3( 0.04 ), material.clearCoatRoughness, geometry.clearCoatDotNV);
        radianceAttenuation -= material.clearCoat * F_Schlick(material.f0, geometry.clearCoatDotNV);
    #endif

    reflectedLight.indirectSpecular += radianceAttenuation * radiance * envBRDFApprox(material.specularColor, material.roughness, geometry.dotNV );


    // Occlusion
    #ifdef MATERIAL_HAS_OCCLUSION_TEXTURE
        vec2 aoUV = v.v_uv;
        #ifdef RENDERER_HAS_UV1
            if(material_OcclusionTextureCoord == 1.0){
                aoUV = v.v_uv1;
            }
        #endif
        float ambientOcclusion = ((texture2D(material_OcclusionTexture, aoUV)).r - 1.0) * material_OcclusionIntensity + 1.0;
        reflectedLight.indirectDiffuse *= ambientOcclusion;
        #ifdef SCENE_USE_SPECULAR_ENV
            reflectedLight.indirectSpecular *= computeSpecularOcclusion(ambientOcclusion, material.roughness, geometry.dotNV);
        #endif
    #endif

}