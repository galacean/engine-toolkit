#ifndef MATERIAL_INPUT_PBR_INCLUDED
#define MATERIAL_INPUT_PBR_INCLUDED

#include "Normal.glsl"

float material_AlphaCutoff;
vec4 material_BaseColor;
float material_Metal;
float material_Roughness;
float material_IOR;
vec3 material_PBRSpecularColor;
float material_Glossiness;
vec3 material_EmissiveColor;
float material_NormalIntensity;
// float material_OcclusionIntensity;
// float material_OcclusionTextureCoord;

// #ifdef MATERIAL_ENABLE_CLEAR_COAT
//     float material_ClearCoat;
//     float material_ClearCoatRoughness;

//     #ifdef MATERIAL_HAS_CLEAR_COAT_TEXTURE
//         sampler2D material_ClearCoatTexture;
//     #endif

//     #ifdef MATERIAL_HAS_CLEAR_COAT_ROUGHNESS_TEXTURE
//         sampler2D material_ClearCoatRoughnessTexture;
//     #endif

//     #ifdef MATERIAL_HAS_CLEAR_COAT_NORMAL_TEXTURE
//         sampler2D material_ClearCoatNormalTexture;
//     #endif
// #endif

// #ifdef MATERIAL_ENABLE_ANISOTROPY
//     vec3 material_AnisotropyInfo;
//     #ifdef MATERIAL_HAS_ANISOTROPY_TEXTURE
//         sampler2D material_AnisotropyTexture;
//     #endif
// #endif

// Texture
#ifdef MATERIAL_HAS_BASETEXTURE
    sampler2D material_BaseTexture;
#endif

#ifdef MATERIAL_HAS_NORMALTEXTURE
    sampler2D material_NormalTexture;
#endif

#ifdef MATERIAL_HAS_EMISSIVETEXTURE
    sampler2D material_EmissiveTexture;
#endif

#ifdef MATERIAL_HAS_ROUGHNESS_METALLIC_TEXTURE
    sampler2D material_RoughnessMetallicTexture;
#endif


#ifdef MATERIAL_HAS_SPECULAR_GLOSSINESS_TEXTURE
    sampler2D material_SpecularGlossinessTexture;
#endif

// #ifdef MATERIAL_HAS_OCCLUSION_TEXTURE
//     sampler2D material_OcclusionTexture;
// #endif


SurfaceData getSurfaceData(Varyings v, bool isFrontFacing){
    SurfaceData surfaceData;
    // common
    vec4 baseColor = material_BaseColor;
    float metallic = material_Metal;
    float roughness = material_Roughness;
    vec3 specularColor = material_PBRSpecularColor;
    float glossiness = material_Glossiness;
    float f0 = pow2( (material_IOR - 1.0) / (material_IOR + 1.0) );
    vec3 emissiveRadiance = material_EmissiveColor;

    #ifdef MATERIAL_HAS_BASETEXTURE
        vec4 baseTextureColor = texture2D(material_BaseTexture, v.uv);
        #ifndef ENGINE_IS_COLORSPACE_GAMMA
            baseTextureColor = gammaToLinear(baseTextureColor);
        #endif
        baseColor *= baseTextureColor;
    #endif

    #ifdef RENDERER_ENABLE_VERTEXCOLOR
        baseColor *= v.vertexColor;
    #endif


    #ifdef MATERIAL_IS_ALPHA_CUTOFF
        if( baseColor.a < material_AlphaCutoff ) {
            discard;
        }
    #endif

    #ifdef MATERIAL_HAS_ROUGHNESS_METALLIC_TEXTURE
        vec4 metalRoughMapColor = texture2D( material_RoughnessMetallicTexture, v.uv );
        roughness *= metalRoughMapColor.g;
        metallic *= metalRoughMapColor.b;
    #endif

    #ifdef MATERIAL_HAS_SPECULAR_GLOSSINESS_TEXTURE
        vec4 specularGlossinessColor = texture2D(material_SpecularGlossinessTexture, v.uv );
        #ifndef ENGINE_IS_COLORSPACE_GAMMA
            specularGlossinessColor = gammaToLinear(specularGlossinessColor);
        #endif
        specularColor *= specularGlossinessColor.rgb;
        glossiness *= specularGlossinessColor.a;
        roughness =  1.0 - glossiness;
    #endif

    #ifdef MATERIAL_HAS_EMISSIVETEXTURE
        vec4 emissiveColor = texture2D(material_EmissiveTexture, v.uv);
        #ifndef ENGINE_IS_COLORSPACE_GAMMA
            emissiveColor = gammaToLinear(emissiveColor);
        #endif
        emissiveRadiance *= emissiveColor.rgb;
    #endif

    surfaceData.albedoColor = baseColor.rgb;
    surfaceData.specularColor = specularColor;
    surfaceData.emissiveColor = emissiveRadiance;
    surfaceData.metallic = metallic;
    surfaceData.roughness = roughness;
    surfaceData.f0 = f0;

    #ifdef MATERIAL_IS_TRANSPARENT
        surfaceData.opacity = baseColor.a;
    #else
        surfaceData.opacity = 1.0;
    #endif


    // Geometry
    surfaceData.position = v.positionWS;
    
    #ifdef CAMERA_ORTHOGRAPHIC
        surfaceData.viewDir = -camera_Forward;
    #else
        surfaceData.viewDir = normalize(camera_Position - v.positionWS);
    #endif

    // Normal
    #ifdef RENDERER_HAS_NORMAL
        vec3 normal = normalize(v.normalWS);
    #elif defined(HAS_DERIVATIVES)
        vec3 pos_dx = dFdx(v.positionWS);
        vec3 pos_dy = dFdy(v.positionWS);
        vec3 normal = normalize( cross(pos_dx, pos_dy) );
    #else
        vec3 normal = vec3(0, 0, 1);
    #endif
    
    surfaceData.normal = normal;

    #ifdef NEED_TANGENT
        #if defined(RENDERER_HAS_NORMAL) && defined(RENDERER_HAS_TANGENT)
            surfaceData.tangent = v.tangentWS;
            surfaceData.bitangent = v.bitangentWS;
            mat3 tbn = mat3(v.tangentWS, v.bitangentWS, v.normalWS);
        #else
            mat3 tbn = getTBNByDerivatives(v.uv, normal, v.positionWS, isFrontFacing);
            surfaceData.tangent = tbn[0];
            surfaceData.bitangent = tbn[1];
        #endif

        #ifdef MATERIAL_HAS_NORMALTEXTURE
            surfaceData.normal = getNormalByNormalTexture(tbn, material_NormalTexture, material_NormalIntensity, v.uv, isFrontFacing);
        #endif
    #endif

    return surfaceData;
}



#endif