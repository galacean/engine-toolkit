export default `
#define IS_METALLIC_WORKFLOW
#include <common>
#include <camera_declare>

#include <FogFragmentDeclaration>

#include <uv_share>
#include <normal_share>
#include <color_share>
#include <worldpos_share>

#include <light_frag_define>
#include <pbr_frag_define>
#include <pbr_helper>

#ifdef LIGHTMAP_TEXTURE
    uniform sampler2D u_lightMapTexture;
    uniform float u_lightMapIntensity;
#endif


void main() {
    Geometry geometry;
    Material material;
    ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
    
    initGeometry(geometry, gl_FrontFacing);
    initMaterial(material, geometry);
    
    addTotalDirectRadiance(geometry, material, reflectedLight);
    
    
    // IBL diffuse
    #ifdef LIGHTMAP_TEXTURE
        vec2 lightMapUV = v_uv;
        #ifdef O3_HAS_UV1
            lightMapUV = v_uv1;
        #endif
        reflectedLight.indirectDiffuse += texture2D(u_lightMapTexture, lightMapUV).rgb * u_lightMapIntensity * BRDF_Diffuse_Lambert( material.diffuseColor );
    #endif
    
    // IBL specular
    vec3 radiance = getLightProbeRadiance(geometry.viewDir, geometry.normal, material.roughness, int(u_envMapLight.mipMapLevel), u_envMapLight.specularIntensity);
    float radianceAttenuation = 1.0;
    
    #ifdef CLEARCOAT
        vec3 clearCoatRadiance = getLightProbeRadiance( geometry.viewDir, geometry.clearCoatNormal, material.clearCoatRoughness, int(u_envMapLight.mipMapLevel), u_envMapLight.specularIntensity );
    
        reflectedLight.indirectSpecular += clearCoatRadiance * material.clearCoat * envBRDFApprox(vec3( 0.04 ), material.clearCoatRoughness, geometry.clearCoatDotNV);
        radianceAttenuation -= material.clearCoat * F_Schlick(geometry.clearCoatDotNV);
    #endif
    
    reflectedLight.indirectSpecular += radianceAttenuation * radiance * envBRDFApprox(material.specularColor, material.roughness, geometry.dotNV );
    
    
    // Occlusion
    #ifdef OCCLUSIONTEXTURE
        vec2 aoUV = v_uv;
        #ifdef O3_HAS_UV1
            if(u_occlusionTextureCoord == 1.0){
                aoUV = v_uv1;
            }
        #endif
        float ambientOcclusion = (texture2D(u_occlusionTexture, aoUV).r - 1.0) * u_occlusionIntensity + 1.0;
        reflectedLight.indirectDiffuse *= ambientOcclusion;
        #ifdef O3_USE_SPECULAR_ENV
            reflectedLight.indirectSpecular *= computeSpecularOcclusion(ambientOcclusion, material.roughness, geometry.dotNV);
        #endif
    #endif
        
        
    // Emissive
    vec3 emissiveRadiance = u_emissiveColor;
    #ifdef EMISSIVETEXTURE
        vec4 emissiveColor = texture2D(u_emissiveTexture, v_uv);
        #ifndef OASIS_COLORSPACE_GAMMA
            emissiveColor = gammaToLinear(emissiveColor);
        #endif
        emissiveRadiance *= emissiveColor.rgb;
    #endif
        
    // Total
    vec3 totalRadiance =    reflectedLight.directDiffuse + 
                            reflectedLight.indirectDiffuse + 
                            reflectedLight.directSpecular + 
                            reflectedLight.indirectSpecular + 
                            emissiveRadiance;
                            
        
    gl_FragColor = vec4(totalRadiance, material.opacity);
        
    #include <FogFragment>
        
    #ifndef OASIS_COLORSPACE_GAMMA
        gl_FragColor = linearToGamma(gl_FragColor);
    #endif

}
`;
