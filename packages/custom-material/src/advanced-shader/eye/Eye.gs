Shader "/eyes/Eye.gs" {
  EditorProperties {
    Header("Sclera") {
    material_ScleraColor("Sclera Color", Color) = (1,1,1,1);
    material_ScleraSize("Sclera Size", Range(0, 5, 0.01)) = 1.5;
    material_Metal("Sclera Specular", Range(0,1,0.01) ) = 1;
    material_Roughness("Sclera Roughness", Range( 0, 1, 0.01 ) ) = 1
    material_ScleraNormalStrength("Sclera NormalStrength", Range(0, 5, 0.01)) = 1;
    material_ScleraTexture("Sclera Texture", Texture2D);
    material_ScleraNormal("Sclera NormalTexture", Texture2D);
    material_Scleramask("Sclera Mask", Texture2D);


    }
  Header("Iris") {
    material_IrisColor("Iris Color", Color) = (1,1,1,1);
    material_PupilSize("Pupil Dilation", Vector2) =(1, 0);
    material_Limbal("Limbal Ring Amount", Range(0, 1, 0.01)) = 0.5;
    material_IrisSize("Iris Size", Range(0, 5, 0.01)) = 1.5;
    material_Parallax("Parallax Layer", Range(0, 0.5, 0.01)) = 0.1;
    material_IrisNormalStrength("Iris NormalStrength", Range(0, 5, 0.01)) = 1;

    material_IrisTexture("Iris Texture", Texture2D);
    material_IrisNormal("Iris NormalTexture", Texture2D);
    }

  Header("Common") {
    material_AlphaCutoff( "AlphaCutoff", Range(0, 1, 0.01) ) = 0;
    }
  }

  EditorMacros {
    Header("Conditional Macors") {
      MATERIAL_IS_TRANSPARENT("IS_TRANSPARENT");
      MATERIAL_IS_ALPHA_CUTOFF("IS_ALPHA_CUTOFF");
      MATERIAL_HAS_SCLERA_NORMAL("HAS_SCLERA_NORMAL");
      MATERIAL_HAS_IRIS_NORMAL("HAS_IRIS_NORMAL");
      MATERIAL_HAS_SCLERA_MASK("HAS_SCLERA_MASK");
      MATERIAL_HAS_IRIS_TEXTURE("HAS_IRIS_TEXTURE");
      MATERIAL_HAS_SCLERA_TEXTURE("HAS_SCLERA_TEXTURE");
    }

  }
    
  SubShader "Default" {
    UsePass "pbr/Default/ShadowCaster"

    Pass "Forward Pass" {
      Tags { pipelineStage = "Forward"} 

      #define IS_METALLIC_WORKFLOW

      VertexShader = PBRVertex;
      FragmentShader = PBRFragment;

      #include "./EyeForwardPass.glsl"
      }
    }
}
      