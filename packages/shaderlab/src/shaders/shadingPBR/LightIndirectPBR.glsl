
// #ifndef LIGHT_INDIRECT_PBR_INCLUDED
// #define LIGHT_INDIRECT_PBR_INCLUDED

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

    return specularColor * AB.x + AB.y;

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


void evaluateDiffuseIBL(BRDFData brdfData, float diffuseAO, inout vec3 diffuseColor){
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

    diffuseColor += diffuseAO * irradiance * BRDF_Diffuse_Lambert( brdfData.diffuseColor );
}

float evaluateClearCoatIBL(BRDFData brdfData, float specularAO, inout vec3 specularColor){
    float radianceAttenuation = 1.0;

    #ifdef MATERIAL_ENABLE_CLEAR_COAT
        vec3 clearCoatRadiance = getLightProbeRadiance( brdfData, brdfData.clearCoatNormal, brdfData.clearCoatRoughness);
        specularColor += specularAO * clearCoatRadiance * brdfData.clearCoat * envBRDFApprox(vec3( 0.04 ), brdfData.clearCoatRoughness, brdfData.clearCoatDotNV);
        radianceAttenuation -= brdfData.clearCoat * F_Schlick(0.04, brdfData.clearCoatDotNV);
    #endif

    return radianceAttenuation;
}

void evaluateSpecularIBL(BRDFData brdfData, float specularAO, float radianceAttenuation, inout vec3 specularColor){
    vec3 radiance = getLightProbeRadiance(brdfData, brdfData.normal, brdfData.roughness);
    specularColor += specularAO * radianceAttenuation * radiance * envBRDFApprox(brdfData.specularColor, brdfData.roughness, brdfData.dotNV );
}


float evaluateDiffuseAO(Varyings v){
    float diffuseAO = 1.0;

    #ifdef MATERIAL_HAS_OCCLUSION_TEXTURE
        vec2 aoUV = v.v_uv;
        #ifdef RENDERER_HAS_UV1
            if(material_OcclusionTextureCoord == 1.0){
                aoUV = v.v_uv1;
            }
        #endif
        diffuseAO = ((texture2D(material_OcclusionTexture, aoUV)).r - 1.0) * material_OcclusionIntensity + 1.0;
    #endif

    return diffuseAO;
}

float evaluateSpecularAO(float diffuseAO, float roughness, float dotNV){
    float specularAO = 1.0;

    #if defined(MATERIAL_HAS_OCCLUSION_TEXTURE) && defined(SCENE_USE_SPECULAR_ENV) 
        specularAO = saturate( pow( dotNV + diffuseAO, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + diffuseAO );
    #endif

    return specularAO;
}

void evaluateIBL(Varyings v, BRDFData brdfData, inout vec3 color){
    vec3 diffuseColor = vec3(0);
    vec3 specularColor = vec3(0);
    float diffuseAO = evaluateDiffuseAO(v);
    float specularAO = evaluateSpecularAO(diffuseAO, brdfData.roughness, brdfData.dotNV);

    // IBL diffuse
    evaluateDiffuseIBL(brdfData, diffuseAO, diffuseColor);

    // IBL ClearCoat
    float radianceAttenuation = evaluateClearCoatIBL(brdfData, specularAO, specularColor);

    // IBL specular
    evaluateSpecularIBL(brdfData, specularAO, radianceAttenuation, specularColor);

    color += diffuseColor + specularColor;
}


// #endif