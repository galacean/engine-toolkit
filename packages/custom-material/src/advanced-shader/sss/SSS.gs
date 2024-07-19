Shader "sss/sss.gs" {
  EditorProperties {
    Header("Base"){
      material_IOR("IOR", Range(0, 5, 0.01)) = 1.5;
      material_BaseColor("BaseColor", Color) = (1, 1, 1, 1);
      material_BaseTexture("BaseTexture", Texture2D);
    }

  Header("SSS"){
      material_SkinScatterAmount("SSSColor", Color) = (1,1,1,1);
      material_CurvatureTexture("CurvatureTexture", Texture2D);
      material_CurvaturePower("CurvaturePower", Float) = 0.6;
    }

  Header("Metal Roughness") {
      material_Metal( "Metal", Range(0,1,0.01) ) = 1;
      material_Roughness( "Roughness", Range( 0, 1, 0.01 ) ) = 1;
      material_RoughnessMetallicTexture("RoughnessMetallicTexture", Texture2D);
    }

  Header("Normal") {
      material_NormalTexture("NormalTexture", Texture2D);
      material_NormalIntensity("NormalIntensity", Range(0, 5, 0.01)) = 1;
    }

  Header("Emissive") {
      material_EmissiveColor("EmissiveColor", Color ) = (0, 0, 0, 1);
      material_EmissiveTexture("EmissiveTexture", Texture2D);
    }

  Header("Occlusion") {
      material_OcclusionTexture("OcclusionTexture", Texture2D);
      material_OcclusionIntensity("OcclusionIntensity", Range(0, 5, 0.01)) = 1;
      material_OcclusionTextureCoord("OcclusionTextureCoord", Float) = 0;
    }

  Header("Common") {
      material_AlphaCutoff( "AlphaCutoff", Range(0, 1, 0.01) ) = 0;
      material_TilingOffset("TilingOffset", Vector4) = (1, 1, 0, 0);
    }
  }

  EditorMacros {
  Header("Conditional Macors") {
      MATERIAL_HAS_BASETEXTURE("HAS_BASETEXTURE");
      MATERIAL_HAS_CURVATEXTURE("HAS_CURVATEXTURE");
      MATERIAL_HAS_ROUGHNESS_METALLIC_TEXTURE("HAS_ROUGHNESS_METALLIC_TEXTURE");
      MATERIAL_HAS_NORMALTEXTURE("HAS_NORMALTEXTURE");
      MATERIAL_HAS_EMISSIVETEXTURE("HAS_EMISSIVETEXTURE");
      MATERIAL_HAS_OCCLUSION_TEXTURE("HAS_OCCLUSION_TEXTURE");
      MATERIAL_IS_TRANSPARENT("IS_TRANSPARENT");
      MATERIAL_IS_ALPHA_CUTOFF("IS_ALPHA_CUTOFF");
    }
  }
    
  SubShader "Default" {
    UsePass "pbr/Default/ShadowCaster"

    Pass "Forward Pass" {
      Tags { pipelineStage = "Forward"} 

      #define IS_METALLIC_WORKFLOW

      VertexShader = PBRVertex;
      FragmentShader = PBRFragment;

      #include "./SSSForwardPass.glsl"
      }
    }
}
