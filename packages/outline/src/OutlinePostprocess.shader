Shader "outline-postprocess-shader" {
  SubShader "Default" {
    Pass "Forward" {
      // Fullscreen-quad postprocess that blends the sobel outline onto the
      // existing framebuffer. The new ShaderLab pipeline does not surface
      // `material.isTransparent = true` to the Pass when render state is
      // undeclared — default opaque overwrites the scene with the `vec4(0)`
      // returned for non-edge pixels.
      DepthState = {
        Enabled = false;
        WriteEnabled = false;
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

      #include "ShaderLibrary/Common/Attributes.glsl"

      struct Varyings {
        vec2 v_uv;
      };

      Varyings vert(Attributes attr) {
        Varyings v;
        gl_Position = vec4(attr.POSITION.xzy, 1.0);
        #ifdef RENDERER_HAS_UV
          v.v_uv = attr.TEXCOORD_0;
        #endif
        return v;
      }

      #include "ShaderLibrary/Common/Common.glsl"

      vec3 material_OutlineColor;
      sampler2D material_OutlineTexture;
      vec2 material_TexSize;

      float luminance(vec4 color) {
        return 0.2125 * color.r + 0.7154 * color.g + 0.0721 * color.b;
      }

      float sobel(vec2 uv) {
        // adapter to webgl 1.0
        float Gx[9];
        Gx[0] = -1.0;
        Gx[1] = 0.0;
        Gx[2] = 1.0;
        Gx[3] = -2.0;
        Gx[4] = 0.0;
        Gx[5] = 2.0;
        Gx[6] = -1.0;
        Gx[7] = 0.0;
        Gx[8] = 1.0;

        float Gy[9];
        Gy[0] = -1.0;
        Gy[1] = -2.0;
        Gy[2] = -1.0;
        Gy[3] = 0.0;
        Gy[4] = 0.0;
        Gy[5] = 0.0;
        Gy[6] = 1.0;
        Gy[7] = 2.0;
        Gy[8] = 1.0;

        float texColor;
        float edgeX = 0.0;
        float edgeY = 0.0;
        vec2 sampleUV[9];

        sampleUV[0] = uv + material_TexSize.xy * vec2(-1, -1);
        sampleUV[1] = uv + material_TexSize.xy * vec2(0, -1);
        sampleUV[2] = uv + material_TexSize.xy * vec2(1, -1);
        sampleUV[3] = uv + material_TexSize.xy * vec2(-1, 0);
        sampleUV[4] = uv + material_TexSize.xy * vec2(0, 0);
        sampleUV[5] = uv + material_TexSize.xy * vec2(1, 0);
        sampleUV[6] = uv + material_TexSize.xy * vec2(-1, 1);
        sampleUV[7] = uv + material_TexSize.xy * vec2(0, 1);
        sampleUV[8] = uv + material_TexSize.xy * vec2(1, 1);

        for (int i = 0; i < 9; i++) {
          texColor = luminance(texture2D(material_OutlineTexture, sampleUV[i]));
          edgeX += texColor * Gx[i];
          edgeY += texColor * Gy[i];
        }

        return abs(edgeX) + abs(edgeY);
      }

      void frag(Varyings v) {
        float sobelFactor = step(1.0, sobel(v.v_uv));
        gl_FragColor = mix(vec4(0), vec4(material_OutlineColor, 1.0), sobelFactor);
      }
    }
  }
}
