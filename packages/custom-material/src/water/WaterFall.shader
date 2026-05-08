Shader "water-fall" {
  SubShader "Default" {
    Pass "Forward" {
      VertexShader = vert;
      FragmentShader = frag;

      mat4 renderer_MVPMat;
      float u_time;
      vec2 u_water_speed;
      vec2 u_waterfall_speed;
      vec2 u_distorsion_speed;

      #include "ShaderLibrary/Common/Attributes.glsl"

      struct Varyings {
        vec2 waterTexCoords;
        vec2 waterfallTexCoords;
        vec2 normalTexCoords;
        vec4 v_color;
      };

      Varyings vert(Attributes attr) {
        Varyings v;
        gl_Position = renderer_MVPMat * vec4(attr.POSITION, 1.0);

        #ifdef RENDERER_HAS_UV
          v.waterTexCoords = attr.TEXCOORD_0 + vec2(u_water_speed.x * u_time, u_water_speed.y * u_time);
          v.waterfallTexCoords = attr.TEXCOORD_0 + vec2(u_waterfall_speed.x * u_time, u_waterfall_speed.y * u_time);
          v.normalTexCoords = attr.TEXCOORD_0 + vec2(u_distorsion_speed.x * cos(u_time), u_distorsion_speed.y * sin(u_time));
        #endif

        #ifdef RENDERER_ENABLE_VERTEXCOLOR
          v.v_color = attr.COLOR_0;
        #endif
        return v;
      }

      #include "ShaderLibrary/Common/Common.glsl"

      sampler2D material_NormalTexture;
      sampler2D u_waterTex;
      sampler2D u_waterfallTex;
      sampler2D u_edgeNoiseTex;

      vec4 u_edgeColor;
      vec2 u_edgeParam;
      float u_distorsion_amount;

      void frag(Varyings v) {
        vec4 normalTex = texture2D(material_NormalTexture, v.normalTexCoords) * 2.0 - 1.0;

        vec4 waterTex = texture2D(u_waterTex, v.waterTexCoords + (normalTex.rg * u_distorsion_amount));
        vec4 waterfallTex = texture2D(u_waterfallTex, v.waterfallTexCoords + (normalTex.rg * u_distorsion_amount));

        vec4 streamEdge = texture2D(u_edgeNoiseTex, v.waterTexCoords);
        vec4 fallEdge = texture2D(u_edgeNoiseTex, v.waterfallTexCoords);

        float edgeShape = mix(fallEdge.r, streamEdge.r, v.v_color.r);
        edgeShape = saturate(edgeShape * v.v_color.g);
        edgeShape = saturate(smoothstep(u_edgeParam.x - u_edgeParam.y, u_edgeParam.x + u_edgeParam.y, edgeShape));

        vec4 waterAll = mix(waterfallTex, waterTex, v.v_color.r);
        vec4 finalCol = mix(waterAll, u_edgeColor, edgeShape);

        gl_FragColor = finalCol;
      }
    }
  }
}