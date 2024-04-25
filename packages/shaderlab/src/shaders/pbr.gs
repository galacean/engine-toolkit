Shader "pbr.gs" {
    EditorProperties {
      material_Metal( "Metal", Range(0,1,0.01) ) = 1;
      material_Roughness( "Roughness", Range( 0, 1, 0.01 ) ) = 1;
      material_IOR("IOR", Range(0, 5, 0.01)) = 1.5;
      material_AnisotropyInfo("AnisotropyInfo", Vector3) = (1, 0, 0);
      material_AnisotropyTexture("AnisotropyTexture", Texture2D);

      Header("Base PBR") {
        material_BaseColor("BaseColor", Color) = (1,1,1,1);
        material_EmissiveColor( "EmissiveColor", Color ) = (0,0,0,1);
        material_TilingOffset("TilingOffset", Vector4) = (1,1,0,0);
        material_NormalIntensity("NormalIntensity", Float) = 1;
        material_OcclusionIntensity("OcclusionIntensity", Float) = 1;
        material_OcclusionTextureCoord("OcclusionTextureCoord", Int) = 0;
        material_ClearCoat("ClearCoat", Float) = 0;
        material_ClearCoatRoughness("ClearCoatRoughness", Float) = 0;
      }
      
      Collapsible("Base Material") {
        material_AlphaCutoff( "AlphaCutoff", Float ) = 0;
        material_PBRSpecularColor("PBRSpecularColor", Color) = (1,1,1,1);
        material_Glossiness("Glossiness", Float) = 1.0;
        material_BaseTexture("BaseTexture", Texture2D);
        material_NormalTexture("NormalTexture", Texture2D);
        material_EmissiveTexture("EmissiveTexture", Texture2D);
        material_RoughnessMetallicTexture("RoughnessMetallicTexture", Texture2D);
        material_SpecularGlossinessTexture("SpecularGlossinessTexture", Texture2D);
        material_OcclusionTexture("OcclusionTexture", Texture2D);
        material_ClearCoatTexture("ClearCoatTexture", Texture2D);
        material_ClearCoatRoughnessTexture("ClearCoatRoughnessTexture", Texture2D);
        material_ClearCoatNormalTexture("ClearCoatNormalTexture", Texture2D);
      }
    }

    EditorMacros {
      Header("Conditional Macors") {
        MATERIAL_OMIT_NORMAL("OMIT_NORMAL");
        MATERIAL_ENABLE_CLEAR_COAT("ENABLE_CLEAR_COAT");
        MATERIAL_HAS_BASETEXTURE("HAS_BASETEXTURE");
        MATERIAL_HAS_NORMALTEXTURE("HAS_NORMALTEXTURE");
        MATERIAL_HAS_EMISSIVETEXTURE("HAS_EMISSIVETEXTURE");
        MATERIAL_HAS_ROUGHNESS_METALLIC_TEXTURE("HAS_ROUGHNESS_METALLIC_TEXTURE");
        MATERIAL_HAS_OCCLUSION_TEXTURE("HAS_OCCLUSION_TEXTURE");
        MATERIAL_HAS_CLEAR_COAT_TEXTURE("HAS_CLEAR_COAT_TEXTURE");
        MATERIAL_HAS_CLEAR_COAT_ROUGHNESS_TEXTURE("HAS_CLEAR_COAT_ROUGHNESS_TEXTURE");
        MATERIAL_HAS_CLEAR_COAT_NORMAL_TEXTURE("HAS_CLEAR_COAT_NORMAL_TEXTURE");
        MATERIAL_IS_ALPHA_CUTOFF("IS_ALPHA_CUTOFF");
        MATERIAL_IS_TRANSPARENT("IS_TRANSPARENT");
      }

      Collapsible("Enabled Macros") {
        [On] MATERIAL_NEED_WORLD_POS("WORLD POS");
        [On] MATERIAL_NEED_TILING_OFFSET("TILING_OFFSET");
      }
    }
    
    SubShader "Default" {
      UsePass "pbr/Default/ShadowCaster"

      Pass "Forward Pass" {
        Tags { pipelineStage = "Forward"} 

        #define IS_METALLIC_WORKFLOW

        struct _galacean_a2v {
          #include "attrib.glsl"
        }

        struct _galacean_v2f {
          #include "varying.glsl"
        }

        #include "common.glsl"
        #include "transform_declare.glsl"

        #include "common_vert.glsl"
        #include "blendShape_input.glsl"
        #include "shadow.glsl"

        // fragment uniforms
        #include "fog.glsl"
        #include "light_frag_define.glsl"
        #include "pbr_frag_define.glsl"

        #include "shading_pbr.glsl"

        // new
        #include "input.glsl"

        VertexShader = pbrVert;
        FragmentShader = pbrFrag;

        _galacean_v2f pbrVert(_galacean_a2v attr) {
          _galacean_v2f v;

          #include "vert_pbr.glsl"

          return v;
        }

        void pbrFrag(_galacean_v2f v) {
          #include "pbr_frag.glsl"

          #if SCENE_FOG_MODE != 0
              gl_FragColor = fog(gl_FragColor, v.v_positionVS);
          #endif

          #ifndef ENGINE_IS_COLORSPACE_GAMMA
              gl_FragColor = linearToGamma(gl_FragColor);
          #endif
        }
      }
    }
  }