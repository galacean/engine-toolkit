Shader "plain-color" {
  SubShader "Default" {
    Pass "Forward" {
      Bool blendEnabled;
      Bool depthEnabled;
      Bool depthWriteEnabled;
      RenderQueueType renderQueueType;
      BlendFactor sourceColorBlendFactor;
      BlendFactor destinationColorBlendFactor;
      BlendFactor sourceAlphaBlendFactor;
      BlendFactor destinationAlphaBlendFactor;

      DepthState = {
        Enabled = depthEnabled;
        WriteEnabled = depthWriteEnabled;
      }

      BlendState = {
        Enabled = blendEnabled;
        SourceColorBlendFactor = sourceColorBlendFactor;
        DestinationColorBlendFactor = destinationColorBlendFactor;
        SourceAlphaBlendFactor = sourceAlphaBlendFactor;
        DestinationAlphaBlendFactor = destinationAlphaBlendFactor;
      }

      RasterState = {
        CullMode = CullMode.Off;
      }

      RenderQueueType = renderQueueType;

      VertexShader = vert;
      FragmentShader = frag;

      #include "ShaderLibrary/Common/Common.glsl"
      #include "ShaderLibrary/Common/Transform.glsl"
      #include "ShaderLibrary/Skin/Skin.glsl"
      #include "ShaderLibrary/Skin/BlendShape.glsl"

      #include "ShaderLibrary/Common/Attributes.glsl"

      void vert(Attributes attr) {
        vec4 position = vec4(attr.POSITION, 1.0);

        #ifdef RENDERER_HAS_BLENDSHAPE
          calculateBlendShape(attr, position);
        #endif

        #ifdef RENDERER_HAS_SKIN
          mat4 skinMatrix = getSkinMatrix(attr);
          position = skinMatrix * position;
        #endif

        gl_Position = renderer_MVPMat * position;
      }

      vec4 material_BaseColor;

      void frag() {
        vec4 baseColor = material_BaseColor;

        #ifdef MATERIAL_IS_ALPHA_CUTOFF
          if( baseColor.a < material_AlphaCutoff ) {
            discard;
          }
        #endif

        gl_FragColor = baseColor;
      }
    }
  }
}