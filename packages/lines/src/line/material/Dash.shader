Shader "dash" {
  SubShader "Default" {
    Pass "Forward" {
      VertexShader = vert;
      FragmentShader = frag;

      mat4 renderer_MVPMat;
      float u_width;
      vec2 u_dash;

      struct Attributes {
        vec2 a_pos;
        vec2 a_normal;
        vec2 a_data;
        float a_lengthsofar;
      };

      struct Varyings {
        vec2 v_origin;
        vec2 v_position;
        float v_direction;
        float v_part;
        vec2 v_tex;
      };

      Varyings vert(Attributes attr) {
        Varyings v;
        v.v_direction = attr.a_data.x;
        v.v_part = attr.a_data.y;
        float layer_index = 1.0;

        v.v_origin = attr.a_pos;

        float texcoord_y = 0.0;

        texcoord_y = attr.a_lengthsofar / (u_dash.x + u_dash.y);
        if (v.v_direction == 1.0) {
          v.v_tex = vec2(1.0, texcoord_y);
        } else {
          v.v_tex = vec2(0.0, texcoord_y);
        }
        vec2 position = attr.a_pos + attr.a_normal * u_width;
        v.v_position = position;
        gl_Position = renderer_MVPMat * vec4(position, 0.0, 1);
        return v;
      }

      vec4 u_color;
      int u_join;
      int u_cap;
      sampler2D u_texture;

      float IS_CAP = 0.0;

      void frag(Varyings v) {
        vec4 finalColor;
        if (u_cap == 0 && v.v_part == IS_CAP) {
          if (distance(v.v_position, v.v_origin) > u_width) {
            discard;
          }
        }
        if (u_join == 1 && v.v_part > 1.5) {
          if (distance(v.v_position, v.v_origin) > u_width) {
            discard;
          }
        }
        vec4 textureColor = texture2D(u_texture, v.v_tex);
        if (textureColor.a <= 0.5) {
          gl_FragColor = vec4(u_color.rgb, 0.0);
        } else {
          gl_FragColor = u_color;
        }
      }
    }
  }
}
