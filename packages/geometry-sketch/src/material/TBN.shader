Shader "tbnShader" {
  SubShader "Default" {
    Pass "Forward" {
      VertexShader = vert;
      FragmentShader = frag;

      #include "ShaderLibrary/Common/Common.glsl"
      #include "ShaderLibrary/Common/Transform.glsl"
      #include "ShaderLibrary/Skin/Skin.glsl"

      float u_lineScale;
      mat4 camera_VPMat;
      mat4 u_worldMatrix;
      mat4 u_worldNormal;

      #include "./GeometryTextureDefine.glsl"

      #include "ShaderLibrary/Common/Attributes.glsl"

      void vert(Attributes attr) {
        int pointIndex = gl_VertexID / 2;
        #include "./GeometryTextureVert.glsl"

        vec4 position = vec4(POSITION, 1.0);

        #ifdef RENDERER_HAS_NORMAL
          vec3 normal = vec3(NORMAL);
          #ifdef RENDERER_HAS_TANGENT
            vec4 tangent = vec4(TANGENT);
          #endif
        #endif

        #ifdef RENDERER_HAS_SKIN
          mat4 skinMatrix = getSkinMatrix(attr);
          position = skinMatrix * position;
        #endif

        gl_Position = u_worldMatrix * position;

      #if defined(SHOW_NORMAL) && defined(RENDERER_HAS_NORMAL)
        if (gl_VertexID % 2 == 1) {
          vec3 normalW = normalize( mat3(u_worldNormal) * normal.xyz );
          gl_Position.xyz += normalize(normalW) * u_lineScale;
        }
      #endif

      #if defined(SHOW_TANGENT) && defined(RENDERER_HAS_TANGENT)
        if (gl_VertexID % 2 == 1) {
          vec3 tangentW = normalize( mat3(u_worldNormal) * tangent.xyz );
          gl_Position.xyz += normalize(tangentW) * u_lineScale;
        }
      #endif

      #if defined(SHOW_BITANGENT) && defined(RENDERER_HAS_TANGENT) && defined(RENDERER_HAS_NORMAL)
        if (gl_VertexID % 2 == 1) {
          vec3 normalW = normalize( mat3(u_worldNormal) * normal.xyz );
          vec3 tangentW = normalize( mat3(u_worldNormal) * tangent.xyz );
          vec3 bitangentW = cross( normalW, tangentW ) * tangent.w;
          gl_Position.xyz += normalize(bitangentW) * u_lineScale;
        }
      #endif

        gl_Position = camera_VPMat * gl_Position;
      }

      vec4 material_BaseColor;

      void frag() {
        gl_FragColor = material_BaseColor;
      }
    }
  }
}
