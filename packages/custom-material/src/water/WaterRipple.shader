Shader "water-ripple" {
  SubShader "Default" {
    Pass "Forward" {
      VertexShader = vert;
      FragmentShader = frag;

      mat4 renderer_MVPMat;
      float u_time;
      vec2 u_foam_speed;
      vec2 u_distorsion_speed;

      #include "ShaderLibrary/Common/Attributes.glsl"

      struct Varyings {
        vec2 waterTexCoords;
        vec2 normalTexCoords;
        vec4 v_color;
      };

      Varyings vert(Attributes attr) {
        Varyings v;
        gl_Position = renderer_MVPMat * vec4(attr.POSITION, 1.0);
        #ifdef RENDERER_HAS_UV
          v.waterTexCoords = attr.TEXCOORD_0 + vec2(u_foam_speed.x * u_time, u_foam_speed.y * u_time);
          v.normalTexCoords = attr.TEXCOORD_0 + vec2(u_distorsion_speed.x * cos(u_time), u_distorsion_speed.y * sin(u_time));
        #endif
        #ifdef RENDERER_ENABLE_VERTEXCOLOR
          v.v_color = attr.COLOR_0;
        #endif
        return v;
      }

      #include "ShaderLibrary/Common/Common.glsl"

      sampler2D material_NormalTexture;
      sampler2D u_foamTex;
      vec3 u_foamColor;
      vec2 u_foam_param;
      float u_distorsion_amount;

      void frag(Varyings v) {
        vec4 normalTex = texture2D(material_NormalTexture, v.normalTexCoords) * 2.0 - 1.0;
        vec4 waterTex = texture2D(u_foamTex, v.waterTexCoords + (normalTex.rg * u_distorsion_amount));
        float alphaComp = v.v_color.r * waterTex.r * u_foam_param.x;
        float alpha = pow(alphaComp, 2.0);
        alpha = smoothstep(0.5 - u_foam_param.y, 0.5 + u_foam_param.y, alpha);
        alpha = saturate(alpha);

        gl_FragColor = vec4(u_foamColor.rgb, alpha);
      }
    }
  }
}