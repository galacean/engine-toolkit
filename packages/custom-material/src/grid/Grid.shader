Shader "grid" {
  SubShader "Default" {
    Pass "Forward" {
      VertexShader = vert;
      FragmentShader = frag;

      #include "ShaderLibrary/Common/Common.glsl"

      mat4 camera_ViewInvMat;
      mat4 camera_ProjMat;

      struct Attributes {
        vec4 POSITION_FLIP;
      };

      struct Varyings {
        vec3 nearPoint;
        vec3 farPoint;
      };

      vec3 UnprojectPoint(float x, float y, float z, mat4 viewInvMat, mat4 projInvMat) {
        vec4 unprojectedPoint = viewInvMat * projInvMat * vec4(x, y, z, 1.0);
        return unprojectedPoint.xyz / unprojectedPoint.w;
      }

      Varyings vert(Attributes attr) {
        Varyings v;
        float tol = 0.0001;
        mat4 viewInvMat = camera_ViewInvMat;
        if (abs(viewInvMat[3][1]) < tol) {
          viewInvMat[3][1] = tol;
        }
        mat4 projInvMat = INVERSE_MAT(camera_ProjMat);

        bool flipY = camera_ProjectionParams.x < 0.0;
        float x = flipY? attr.POSITION_FLIP.z : attr.POSITION_FLIP.x;
        float y = flipY? attr.POSITION_FLIP.w : attr.POSITION_FLIP.y;

        v.nearPoint = UnprojectPoint(x, y, -1.0, viewInvMat, projInvMat);
        v.farPoint = UnprojectPoint(x, y, 1.0, viewInvMat, projInvMat);
        gl_Position = vec4(x, y, 0.0, 1.0);
        return v;
      }

      #include "ShaderLibrary/Common/Transform.glsl"

      float u_far;
      float u_near;
      float u_primaryScale;
      float u_secondaryScale;
      float u_gridIntensity;
      float u_axisIntensity;
      float u_flipProgress;
      float u_fade;

      vec4 grid(vec3 fragPos3D, float scale, float fade) {
        vec2 coord = mix(fragPos3D.xz, fragPos3D.xy, u_flipProgress) * scale;
        vec2 derivative = fwidth(coord);
        vec2 grid = abs(fract(coord - 0.5) - 0.5) / derivative;
        float line = min(grid.x, grid.y);
        float minimumz = min(derivative.y, 1.0);
        float minimumx = min(derivative.x, 1.0);
        vec4 color = vec4(u_gridIntensity, u_gridIntensity, u_gridIntensity, fade * (1.0 - min(line, 1.0)));
        // z-axis
        if (fragPos3D.x > -u_axisIntensity * minimumx && fragPos3D.x < u_axisIntensity * minimumx)
          color.z = 1.0;
        // x-axis or y-axis
        float xy = mix(fragPos3D.z, fragPos3D.y, u_flipProgress);
        if (xy > -u_axisIntensity * minimumz && xy < u_axisIntensity * minimumz)
          color.x = 1.0;
        return color;
      }

      float computeDepth(vec3 pos) {
        vec4 clip_space_pos = camera_ProjMat * camera_ViewMat * vec4(pos.xyz, 1.0);
        // map to 0-1
        return (clip_space_pos.z / clip_space_pos.w) * 0.5 + 0.5;
      }

      float computeLinearDepth(vec3 pos) {
        vec4 clip_space_pos = camera_ProjMat * camera_ViewMat * vec4(pos.xyz, 1.0);
        float clip_space_depth = clip_space_pos.z / clip_space_pos.w;
        float linearDepth = (2.0 * u_near * u_far) / (u_far + u_near - clip_space_depth * (u_far - u_near));
        return linearDepth / u_far;
      }

      void frag(Varyings v) {
        float ty = -v.nearPoint.y / (v.farPoint.y - v.nearPoint.y);
        float tz = -v.nearPoint.z / (v.farPoint.z - v.nearPoint.z);
        float t = mix(ty, tz, u_flipProgress);
        vec3 fragPos3D = v.nearPoint + t * (v.farPoint - v.nearPoint);

        gl_FragDepth = computeDepth(fragPos3D);

        float linearDepth = computeLinearDepth(fragPos3D);
        float fading = max(0.0, (0.5 - linearDepth));

        // adding multiple resolution for the grid
        gl_FragColor = (grid(fragPos3D, u_primaryScale, u_fade) + grid(fragPos3D, u_secondaryScale, 1.0 - u_fade));
        gl_FragColor.a *= fading;

        gl_FragColor = sRGBToLinear(gl_FragColor);
      }
    }
  }
}