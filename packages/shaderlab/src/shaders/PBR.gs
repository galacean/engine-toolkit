Shader "PBR.gs" {
    #include "EditorProps.glsl"

    SubShader "Default" {
      UsePass "pbr/Default/ShadowCaster"

      Pass "Forward Pass" {
        Tags { pipelineStage = "Forward"} 

        #define IS_METALLIC_WORKFLOW

        VertexShader = PBRVertex;
        FragmentShader = PBRFragment;
        
        #include "ForwardPassPBR.glsl"
      }
    }
  }