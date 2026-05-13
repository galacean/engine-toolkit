Shader "box" {
  SubShader "Default" {
    Pass "Forward" {
      DepthState = {
        Enabled = false;
      }

      BlendState = {
        Enabled = true;
        SourceColorBlendFactor = BlendFactor.SourceAlpha;
        DestinationColorBlendFactor = BlendFactor.OneMinusSourceAlpha;
        SourceAlphaBlendFactor = BlendFactor.One;
        DestinationAlphaBlendFactor = BlendFactor.OneMinusSourceAlpha;
      }

      RenderQueueType = Transparent;

      VertexShader = vert;
      FragmentShader = frag;

      #include "ShaderLibrary/Common/Common.glsl"
      #include "ShaderLibrary/Common/Transform.glsl"

      #include "ShaderLibrary/Common/Attributes.glsl"

      void vert(Attributes attr) {
        gl_Position = vec4(attr.POSITION, 1.0);
      }

      vec2 u_min;
      vec2 u_max;
      vec4 u_boxColor;
      vec4 u_borderColor;
      float u_width;

      void frag() {
        float vColor = step(u_min.x + u_width, gl_FragCoord.x) * step(gl_FragCoord.x, u_max.x - u_width) * step(u_min.y + u_width, gl_FragCoord.y) * step(gl_FragCoord.y, u_max.y - u_width);
        float vBorder = step(u_min.x, gl_FragCoord.x) * step(gl_FragCoord.x, u_max.x) * step(u_min.y, gl_FragCoord.y) * step(gl_FragCoord.y, u_max.y);
        gl_FragColor = u_boxColor * vColor + (1. - vColor) * vBorder * u_borderColor;
      }
    }
  }
}
