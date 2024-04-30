#include "materialInputPBR.glsl"
#include "normalGet.glsl"

struct SurfaceData{
	vec3  position;
    vec3  normal;
    vec3  viewDir;
    float dotNV;
    
    #ifdef MATERIAL_ENABLE_CLEAR_COAT
        vec3 clearCoatNormal;
        float clearCoatDotNV;
    #endif

    #ifdef MATERIAL_ENABLE_ANISOTROPY
        vec3  anisotropicT;
        vec3  anisotropicB;
        vec3  anisotropicN;
        float anisotropy;
    #endif
	
	vec3  diffuseColor;
    float roughness;
    vec3  specularColor;
    float opacity;
    float f0;
    #ifdef MATERIAL_ENABLE_CLEAR_COAT
        float clearCoat;
        float clearCoatRoughness;
    #endif
	vec3 emissive;
}


#ifdef MATERIAL_ENABLE_ANISOTROPY
    // Aniso Bent Normals
    // Mc Alley https://www.gdcvault.com/play/1022235/Rendering-the-World-of-Far 
    vec3 getAnisotropicBentNormal(SurfaceData surfaceData) {
        vec3  anisotropyDirection = (surfaceData.anisotropy >= 0.0) ? surfaceData.anisotropicB : surfaceData.anisotropicT;
        vec3  anisotropicTangent  = cross(anisotropyDirection, surfaceData.viewDir);
        vec3  anisotropicNormal   = cross(anisotropicTangent, anisotropyDirection);
        // reduce stretching for (roughness < 0.2), refer to https://advances.realtimerendering.com/s2018/Siggraph%202018%20HDRP%20talk_with%20notes.pdf 80
        vec3  bentNormal          = normalize( mix(surfaceData.normal, anisotropicNormal, abs(surfaceData.anisotropy) * saturate( 5.0 * surfaceData.roughness)) );

        return bentNormal;
    }
#endif



void initGeometry(Temp_Varyings v, inout SurfaceData surfaceData, bool isFrontFacing){
    surfaceData.position = v.v_pos;
    #ifdef CAMERA_ORTHOGRAPHIC
        surfaceData.viewDir =  -camera_Forward;
    #else
        surfaceData.viewDir =  normalize(camera_Position - v.v_pos);
    #endif
    #if defined(MATERIAL_HAS_NORMALTEXTURE) || defined(MATERIAL_HAS_CLEAR_COAT_NORMAL_TEXTURE) || defined(MATERIAL_ENABLE_ANISOTROPY)
        mat3 tbn = getTBN(v, isFrontFacing);
    #endif

    #ifdef MATERIAL_HAS_NORMALTEXTURE
        surfaceData.normal = getNormalByNormalTexture(tbn, material_NormalTexture, material_NormalIntensity, v.v_uv, isFrontFacing);
    #else
        surfaceData.normal = getNormal(v, isFrontFacing);
    #endif

    surfaceData.dotNV = saturate( dot(surfaceData.normal, surfaceData.viewDir) );


    #ifdef MATERIAL_ENABLE_CLEAR_COAT
        #ifdef MATERIAL_HAS_CLEAR_COAT_NORMAL_TEXTURE
            surfaceData.clearCoatNormal = getNormalByNormalTexture(tbn, material_ClearCoatNormalTexture, material_NormalIntensity, v.v_uv, isFrontFacing);
        #else
            surfaceData.clearCoatNormal = getNormal(v, isFrontFacing);
        #endif
        surfaceData.clearCoatDotNV = saturate( dot(surfaceData.clearCoatNormal, surfaceData.viewDir) );
    #endif

    #ifdef MATERIAL_ENABLE_ANISOTROPY
        float anisotropy = material_AnisotropyInfo.z;
        vec3 anisotropicDirection = vec3(material_AnisotropyInfo.xy, 0.0);
        #ifdef MATERIAL_HAS_ANISOTROPY_TEXTURE
            vec3 anisotropyTextureInfo = (texture2D( material_AnisotropyTexture, v.v_uv )).rgb;
            anisotropy *= anisotropyTextureInfo.b;
            anisotropicDirection.xy *= anisotropyTextureInfo.rg * 2.0 - 1.0;
        #endif

        surfaceData.anisotropy = anisotropy;
        surfaceData.anisotropicT = normalize(tbn * anisotropicDirection);
        surfaceData.anisotropicB = normalize(cross(surfaceData.normal, surfaceData.anisotropicT));
        surfaceData.anisotropicN = getAnisotropicBentNormal(surfaceData);

    #endif
}

void initMaterial(Temp_Varyings v, inout SurfaceData surfaceData){
        vec4 baseColor = material_BaseColor;
        float metal = material_Metal;
        float roughness = material_Roughness;
        vec3 specularColor = material_PBRSpecularColor;
        float glossiness = material_Glossiness;
        float alphaCutoff = material_AlphaCutoff;
        float f0 = pow2( (material_IOR - 1.0) / (material_IOR + 1.0) );

        surfaceData.f0 = f0;

        #ifdef MATERIAL_HAS_BASETEXTURE
            vec4 baseTextureColor = texture2D(material_BaseTexture, v.v_uv);
            #ifndef ENGINE_IS_COLORSPACE_GAMMA
                baseTextureColor = gammaToLinear(baseTextureColor);
            #endif
            baseColor *= baseTextureColor;
        #endif

        #ifdef RENDERER_ENABLE_VERTEXCOLOR
            baseColor *= v.v_color;
        #endif


        #ifdef MATERIAL_IS_ALPHA_CUTOFF
            if( baseColor.a < alphaCutoff ) {
                discard;
            }
        #endif

        #ifdef MATERIAL_HAS_ROUGHNESS_METALLIC_TEXTURE
            vec4 metalRoughMapColor = texture2D( material_RoughnessMetallicTexture, v.v_uv );
            roughness *= metalRoughMapColor.g;
            metal *= metalRoughMapColor.b;
        #endif

        #ifdef MATERIAL_HAS_SPECULAR_GLOSSINESS_TEXTURE
            vec4 specularGlossinessColor = texture2D(material_SpecularGlossinessTexture, v.v_uv );
            #ifndef ENGINE_IS_COLORSPACE_GAMMA
                specularGlossinessColor = gammaToLinear(specularGlossinessColor);
            #endif
            specularColor *= specularGlossinessColor.rgb;
            glossiness *= specularGlossinessColor.a;
        #endif


        #ifdef IS_METALLIC_WORKFLOW
            surfaceData.diffuseColor = baseColor.rgb * ( 1.0 - metal );
            surfaceData.specularColor = mix( vec3(f0), baseColor.rgb, metal );
            surfaceData.roughness = roughness;
        #else
            float specularStrength = max( max( specularColor.r, specularColor.g ), specularColor.b );
            surfaceData.diffuseColor = baseColor.rgb * ( 1.0 - specularStrength );
            surfaceData.specularColor = specularColor;
            surfaceData.roughness = 1.0 - glossiness;
        #endif

        surfaceData.roughness = max(surfaceData.roughness, getAARoughnessFactor(surfaceData.normal));

        #ifdef MATERIAL_ENABLE_CLEAR_COAT
            surfaceData.clearCoat = material_ClearCoat;
            surfaceData.clearCoatRoughness = material_ClearCoatRoughness;
            #ifdef MATERIAL_HAS_CLEAR_COAT_TEXTURE
                surfaceData.clearCoat *= (texture2D( material_ClearCoatTexture, v.v_uv )).r;
            #endif
            #ifdef MATERIAL_HAS_CLEAR_COAT_ROUGHNESS_TEXTURE
                surfaceData.clearCoatRoughness *= (texture2D( material_ClearCoatRoughnessTexture, v.v_uv )).g;
            #endif
            surfaceData.clearCoat = saturate( surfaceData.clearCoat );
            surfaceData.clearCoatRoughness = max(surfaceData.clearCoatRoughness, getAARoughnessFactor(surfaceData.clearCoatNormal));
        #endif

        #ifdef MATERIAL_IS_TRANSPARENT
            surfaceData.opacity = baseColor.a;
        #else
            surfaceData.opacity = 1.0;
        #endif

        vec3 emissiveRadiance = material_EmissiveColor;
        #ifdef MATERIAL_HAS_EMISSIVETEXTURE
            vec4 emissiveColor = texture2D(material_EmissiveTexture, v.v_uv);
            #ifndef ENGINE_IS_COLORSPACE_GAMMA
                emissiveColor = gammaToLinear(emissiveColor);
            #endif
        emissiveRadiance *= emissiveColor.rgb;
        #endif
        surfaceData.emissive = emissiveRadiance;

}

void initSurfaceData(Temp_Varyings v, out SurfaceData surfaceData, bool isFrontFacing){
    initGeometry(v, surfaceData, isFrontFacing);
    initMaterial(v, surfaceData);
}
