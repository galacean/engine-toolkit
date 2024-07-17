
#ifndef LIGHT_INDIRECT_PBR_INCLUDED
#define LIGHT_INDIRECT_PBR_INCLUDED

#ifndef FUNCTION_DIFFUSE_IBL
    #define FUNCTION_DIFFUSE_IBL evaluateDiffuseIBL
#endif
#ifndef FUNCTION_SPECULAR_IBL
    #define FUNCTION_SPECULAR_IBL evaluateSpecularIBL
#endif
#ifndef FUNCTION_CLEAR_COAT_IBL
    #define FUNCTION_CLEAR_COAT_IBL evaluateClearCoatIBL
#endif


#include "BRDF.glsl"
#include "Light.glsl"

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
vec3 envBRDFApprox(vec3 specularColor, float roughness, float dotNV ) {

    const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );

    const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );

    vec4 r = roughness * c0 + c1;

    float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;

    vec2 AB = vec2( -1.04, 1.04 ) * a004 + r.zw;

    // AB may less than 0 at high roughness, ref: https://github.com/galacean/engine/pull/2173
    return max(specularColor * AB.x + AB.y, 0.0);

}


float getSpecularMIPLevel(float roughness, int maxMIPLevel ) {
    return roughness * float(maxMIPLevel);
}

vec3 getReflectedVector(BRDFData brdfData, vec3 n) {
    #ifdef MATERIAL_ENABLE_ANISOTROPY
        vec3 r = reflect(-brdfData.viewDir, brdfData.anisotropicN);
    #else
        vec3 r = reflect(-brdfData.viewDir, n);
    #endif

    return r;
}

vec3 getLightProbeRadiance(BRDFData brdfData, vec3 normal, float roughness) {

    #ifndef SCENE_USE_SPECULAR_ENV
        return vec3(0);
    #else
        vec3 reflectVec = getReflectedVector(brdfData, normal);
        reflectVec.x = -reflectVec.x; // TextureCube is left-hand,so x need inverse
        
        float specularMIPLevel = getSpecularMIPLevel(roughness, int(scene_EnvMapLight.mipMapLevel) );

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
        
        return envMapColor.rgb * scene_EnvMapLight.specularIntensity;

    #endif

}


void evaluateDiffuseIBL(BRDFData brdfData, inout vec3 diffuseColor){
    #ifdef SCENE_USE_SH
        vec3 irradiance = getLightProbeIrradiance(scene_EnvSH, brdfData.normal);
        #ifdef ENGINE_IS_COLORSPACE_GAMMA
            irradiance = (linearToGamma(vec4(irradiance, 1.0))).rgb;
        #endif
        irradiance *= scene_EnvMapLight.diffuseIntensity;
    #else
       vec3 irradiance = scene_EnvMapLight.diffuse * scene_EnvMapLight.diffuseIntensity;
       irradiance *= PI;
    #endif

    diffuseColor += brdfData.diffuseAO * irradiance * BRDF_Diffuse_Lambert( brdfData.diffuseColor );
}

float evaluateClearCoatIBL(BRDFData brdfData, inout vec3 specularColor){
    float radianceAttenuation = 1.0;

    #ifdef MATERIAL_ENABLE_CLEAR_COAT
        vec3 clearCoatRadiance = getLightProbeRadiance( brdfData, brdfData.clearCoatNormal, brdfData.clearCoatRoughness);
        specularColor += brdfData.specularAO * clearCoatRadiance * brdfData.clearCoat * envBRDFApprox(vec3( 0.04 ), brdfData.clearCoatRoughness, brdfData.clearCoatDotNV);
        radianceAttenuation -= brdfData.clearCoat * F_Schlick(0.04, brdfData.clearCoatDotNV);
    #endif

    return radianceAttenuation;
}

void evaluateSpecularIBL(BRDFData brdfData, float radianceAttenuation, inout vec3 specularColor){
    vec3 radiance = getLightProbeRadiance(brdfData, brdfData.normal, brdfData.roughness);
    specularColor += brdfData.specularAO * radianceAttenuation * radiance * envBRDFApprox(brdfData.specularColor, brdfData.roughness, brdfData.dotNV );
}


void evaluateIBL(BRDFData brdfData, inout vec3 color){
    vec3 diffuseColor = vec3(0);
    vec3 specularColor = vec3(0);

    // IBL diffuse
    FUNCTION_DIFFUSE_IBL(brdfData, diffuseColor);

    // IBL ClearCoat
    float radianceAttenuation = FUNCTION_CLEAR_COAT_IBL(brdfData, specularColor);

    // IBL specular
    FUNCTION_SPECULAR_IBL(brdfData, radianceAttenuation, specularColor);

    color += diffuseColor + specularColor;
}


#endif