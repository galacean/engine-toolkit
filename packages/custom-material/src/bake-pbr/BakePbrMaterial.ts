import { Engine, Texture2D, Shader, PBRBaseMaterial } from "oasis-engine";

/**
 * Bake PBR Material.
 */
export class BakePBRMaterial extends PBRBaseMaterial {
  private static _metallicProp = Shader.getPropertyByName("u_metal");
  private static _roughnessProp = Shader.getPropertyByName("u_roughness");
  private static _roughnessMetallicTextureProp = Shader.getPropertyByName("u_roughnessMetallicTexture");
  private static _shadowTextureProp = Shader.getPropertyByName("u_shadowTexture");

  /**
   * Metallic, default 1.0.
   */
  get metallic(): number {
    return this.shaderData.getFloat(BakePBRMaterial._metallicProp);
  }

  set metallic(value: number) {
    this.shaderData.setFloat(BakePBRMaterial._metallicProp, value);
  }

  /**
   * Roughness, default 1.0.
   */
  get roughness(): number {
    return this.shaderData.getFloat(BakePBRMaterial._roughnessProp);
  }

  set roughness(value: number) {
    this.shaderData.setFloat(BakePBRMaterial._roughnessProp, value);
  }

  /**
   * Roughness metallic texture.
   * @remarks G channel is roughness, B channel is metallic
   */
  get roughnessMetallicTexture(): Texture2D {
    return <Texture2D>this.shaderData.getTexture(BakePBRMaterial._roughnessMetallicTextureProp);
  }

  set roughnessMetallicTexture(value: Texture2D) {
    this.shaderData.setTexture(BakePBRMaterial._roughnessMetallicTextureProp, value);
    if (value) {
      this.shaderData.enableMacro("ROUGHNESSMETALLICTEXTURE");
    } else {
      this.shaderData.disableMacro("ROUGHNESSMETALLICTEXTURE");
    }
  }

  /**
   * shadow texture.
   */
  get shadowTexture(): Texture2D {
    return <Texture2D>this.shaderData.getTexture(BakePBRMaterial._shadowTextureProp);
  }

  set shadowTexture(value: Texture2D) {
    this.shaderData.setTexture(BakePBRMaterial._shadowTextureProp, value);
    if (value) {
      this.shaderData.enableMacro("SHADOW_TEXTURE");
    } else {
      this.shaderData.disableMacro("SHADOW_TEXTURE");
    }
  }

  /**
   * Create a pbr metallic-roughness workflow material instance.
   * @param engine - Engine to which the material belongs
   */
  constructor(engine: Engine) {
    super(engine, Shader.find("scene-material"));
    this.shaderData.setFloat(BakePBRMaterial._metallicProp, 1);
    this.shaderData.setFloat(BakePBRMaterial._roughnessProp, 1);
  }

  /**
   * @override
   */
  clone(): BakePBRMaterial {
    const dest = new BakePBRMaterial(this._engine);
    this.cloneTo(dest);
    return dest;
  }
}

Shader.create(
  "scene-material",
  `
#include <common>
#include <common_vert>
#include <blendShape_input>
#include <uv_share>
#include <color_share>
#include <normal_share>
#include <worldpos_share>

void main() {

    #include <begin_position_vert>
    #include <begin_normal_vert>
    #include <blendShape_vert>
    #include <skinning_vert>
    #include <uv_vert>
    #include <color_vert>
    #include <normal_vert>
    #include <worldpos_vert>
    #include <position_vert>
}
    `,
  `
#define IS_METALLIC_WORKFLOW
#include <common>
#include <camera_declare>

#include <uv_share>
#include <normal_share>
#include <color_share>
#include <worldpos_share>

#include <light_frag_define>
#include <shadow_frag_share>
#include <pbr_frag_define>
#include <pbr_helper>

#ifdef SHADOW_TEXTURE
    uniform sampler2D u_shadowTexture;
#endif

void main() {
Geometry geometry;
Material material;
ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );

initGeometry(geometry);
initMaterial(material, geometry);

float shadowAttenuation = 1.0;
#ifdef OASIS_CALCULATE_SHADOWS
  shadowAttenuation = sampleShadowMap();
#endif

#ifdef SHADOW_TEXTURE
    vec2 shadowUV = v_uv;
    #ifdef O3_HAS_UV1
       shadowUV = v_uv1;
    #endif
    shadowAttenuation = texture2D(u_shadowTexture, shadowUV).r;
#endif

// Direct Light
reflectedLight.directDiffuse = material.diffuseColor.rgb * shadowAttenuation;

// IBL diffuse
#ifdef O3_USE_SH
    vec3 irradiance = getLightProbeIrradiance(u_env_sh, geometry.normal);
    #ifdef OASIS_COLORSPACE_GAMMA
        irradiance = linearToGamma(vec4(irradiance, 1.0)).rgb;
    #endif
    irradiance *= u_envMapLight.diffuseIntensity;
#else
   vec3 irradiance = u_envMapLight.diffuse * u_envMapLight.diffuseIntensity;
   irradiance *= PI;
#endif

reflectedLight.indirectDiffuse += irradiance * BRDF_Diffuse_Lambert( material.diffuseColor );

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

vec4 targetColor = vec4(totalRadiance * shadowAttenuation, material.opacity);
#ifndef OASIS_COLORSPACE_GAMMA
    targetColor = linearToGamma(targetColor);
#endif
gl_FragColor = targetColor;

}
    `
);
