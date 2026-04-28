Shader "skeleton-viewer" {
  SubShader "Default" {
    Pass "Forward" {
      VertexShader = vert;
      FragmentShader = frag;

      mat4 renderer_MVPMat;
      mat4 renderer_NormalMat;

      #include "Common/Attributes.glsl"

      struct Varyings {
        vec3 v_normal;
      };

      Varyings vert(Attributes attr) {
        Varyings v;
        gl_Position = renderer_MVPMat * vec4(attr.POSITION, 1.0);
        #ifdef RENDERER_HAS_NORMAL
          v.v_normal = normalize( mat3(renderer_NormalMat) * attr.NORMAL );
        #endif
        return v;
      }

      vec3 u_colorMin;
      vec3 u_colorMax;

      void frag(Varyings v) {
        float ndl = dot(v.v_normal, vec3(0, 1, 0)) * 0.5 + 0.5;
        vec3 diffuse = mix(u_colorMin, u_colorMax, ndl);
        gl_FragColor = vec4(diffuse, 1.0);
      }
    }
  }
}
