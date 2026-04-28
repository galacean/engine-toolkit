Shader "water" {
  SubShader "Default" {
    Pass "Forward" {
      VertexShader = vert;
      FragmentShader = frag;

      mat4 renderer_MVPMat;
      float u_time;
      vec2 u_water_speed;
      vec2 u_distorsion_speed;

      #include "Common/Attributes.glsl"

      struct Varyings {
        vec4 v_color;
        vec2 waterTexCoords;
        vec2 normalTexCoords;
      };

      Varyings vert(Attributes attr) {
        Varyings v;
        gl_Position = renderer_MVPMat * vec4(attr.POSITION, 1.0);

        #ifdef RENDERER_HAS_UV
          v.waterTexCoords = attr.TEXCOORD_0 + vec2(u_water_speed.x * sin(u_time), u_water_speed.y * cos(u_time));
          v.normalTexCoords = attr.TEXCOORD_0 + vec2(u_distorsion_speed.x * cos(u_time), u_distorsion_speed.y * sin(u_time));
        #endif

        #ifdef RENDERER_ENABLE_VERTEXCOLOR
          v.v_color = attr.COLOR_0;
        #endif
        return v;
      }

      #include "Common/Common.glsl"

      sampler2D material_NormalTexture;
      sampler2D u_waterTex;
      sampler2D u_edgeTex;

      vec4 u_edgeColor;
      vec2 u_edgeParam;
      float u_distorsion_amount;

      void frag(Varyings v) {
        vec4 normalTex = texture2D(material_NormalTexture, v.normalTexCoords) * 2.0 - 1.0;
        vec4 waterTex = texture2D(u_waterTex, v.waterTexCoords + (normalTex.rg * u_distorsion_amount));
        vec4 edgeTex = texture2D(u_edgeTex, v.waterTexCoords + (normalTex.rg * u_distorsion_amount));

        float edge = pow((v.v_color.r + edgeTex.r) * v.v_color.r, 2.0);
        edge = saturate(1.0 - smoothstep(u_edgeParam.x - u_edgeParam.y, u_edgeParam.x + u_edgeParam.y, edge));
        vec4 finalCol = mix(waterTex, u_edgeColor, edge);

        gl_FragColor = finalCol;
      }
    }
  }
}