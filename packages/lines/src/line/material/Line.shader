Shader "line" {
  SubShader "Default" {
    Pass "Forward" {
      VertexShader = vert;
      FragmentShader = frag;

      mat4 renderer_MVPMat;
      float u_width;

      struct Attributes {
        vec2 a_pos;
        vec2 a_normal;
        vec2 a_data;
      };

      struct Varyings {
        vec2 v_origin;
        vec2 v_position;
        float v_direction;
        float v_part;
      };

      Varyings vert(Attributes attr) {
        Varyings v;
        v.v_direction = attr.a_data.x;
        v.v_part = attr.a_data.y;
        float layer_index = 1.0;

        v.v_origin = attr.a_pos;
        vec2 position = attr.a_pos + attr.a_normal * u_width;
        v.v_position = position;
        gl_Position = renderer_MVPMat * vec4(position, 0.0, 1);
        return v;
      }

      vec4 u_color;
      int u_join;
      int u_cap;

      float IS_CAP = 0.0;

      void frag(Varyings v) {
        vec4 finalColor;
        if (u_cap == 0 && v.v_part == IS_CAP) {
          if (distance(v.v_position, v.v_origin) > u_width) {
            discard;
          }
        }
        if (u_join == 1 && v.v_part > 1.0) {
          if (distance(v.v_position, v.v_origin) > u_width) {
            discard;
          }
        }

        gl_FragColor = u_color;
      }
    }
  }
}
