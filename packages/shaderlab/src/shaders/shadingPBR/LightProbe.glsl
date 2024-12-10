#ifndef LIGHT_PROBE
#define LIGHT_PROBE

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


vec3 getReflectedVector(SurfaceData surfaceData, vec3 n) {
    #ifdef MATERIAL_ENABLE_ANISOTROPY
        vec3 r = reflect(-surfaceData.viewDir, surfaceData.anisotropicN);
    #else
        vec3 r = reflect(-surfaceData.viewDir, n);
    #endif

    return r;
}

float getSpecularMIPLevel(float roughness, int maxMIPLevel ) {
    return roughness * float(maxMIPLevel);
}

// sh need be pre-scaled in CPU.
vec3 getLightProbeRadiance(SurfaceData surfaceData, vec3 normal, float roughness) {

    #ifndef SCENE_USE_SPECULAR_ENV
        return vec3(0);
    #else
        vec3 reflectVec = getReflectedVector(surfaceData, normal);
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

// This is a curve-fit approxmation to the "Charlie sheen" BRDF integrated over the hemisphere from
// Estevez and Kulla 2017, "Production Friendly Microfacet Sheen BRDF". The analysis can be found
// in the Sheen section of https://drive.google.com/file/d/1T0D1VSyR4AllqIJTQAraEIzjlb5h4FKH/view?usp=sharing
float IBLSheenDFG(SurfaceData surfaceData, float roughness) {
    float dotNV = surfaceData.dotNV;
    float r2 = roughness * roughness;
    float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
    float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
    float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
    return saturate( DG * RECIPROCAL_PI );
}

#endif