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

        #include "input.glsl"
        #include "common.glsl"
        #include "transform.glsl"

        #include "blendShape_input.glsl"
        #include "vert.glsl"
        #include "shadow.glsl"

        #include "fog.glsl"
        #include "light.glsl"

        #include "shading_pbr.glsl"


        VertexShader = pbrVert;
        FragmentShader = pbrFrag;

        Varyings pbrVert(Attributes attr) {
          Varyings v;

          // @todo: delete
          Temp_Attributes temp_attributes;
          Temp_Varyings temp_varyings;
          #include "temp_transformAttributes.glsl"
          #include "temp_transformVaryings.glsl"

          // @todo: use initVertex(attr, v);
          initVertex();

          return v;
        }

        void pbrFrag(Varyings v) {
          SurfaceData surfaceData;

          // @todo: delete
          Temp_Varyings temp_varyings;
          #include "temp_transformVaryings.glsl"

          initSurfaceData(temp_varyings, surfaceData, gl_FrontFacing);

          vec4 color = evaluateSurface(temp_varyings, surfaceData);
          gl_FragColor = color;

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