Shader "Grid" {

  SubShader "Default" {

    Pass "Forward" {
      
      mat4 camera_ViewInvMat;

      VertexShader = vert;
      FragmentShader = frag;

      struct a2v {
        vec3 POSITION;
      }

      struct v2f {
        vec3 nearPoint;
        vec3 farPoint;
      }

      vec3 UnprojectPoint(float x, float y, float z, mat4 viewInvMat, mat4 projInvMat) {
        vec4 unprojectedPoint =  viewInvMat * projInvMat * vec4(x, y, z, 1.0);
        return unprojectedPoint.xyz / unprojectedPoint.w;
      }

      #ifdef GRAPHICS_API_WEBGL2
        #define INVERSE_MAT(mat) inverse(mat)
      #else
        mat2 inverseMat(mat2 m) {
          return mat2(m[1][1],-m[0][1],
              -m[1][0], m[0][0]) / (m[0][0]*m[1][1] - m[0][1]*m[1][0]);
        }
        mat3 inverseMat(mat3 m) {
          float a00 = m[0][0], a01 = m[0][1], a02 = m[0][2];
          float a10 = m[1][0], a11 = m[1][1], a12 = m[1][2];
          float a20 = m[2][0], a21 = m[2][1], a22 = m[2][2];

          float b01 = a22 * a11 - a12 * a21;
          float b11 = -a22 * a10 + a12 * a20;
          float b21 = a21 * a10 - a11 * a20;

          float det = a00 * b01 + a01 * b11 + a02 * b21;

          return mat3(b01, (-a22 * a01 + a02 * a21), (a12 * a01 - a02 * a11),
                b11, (a22 * a00 - a02 * a20), (-a12 * a00 + a02 * a10),
                b21, (-a21 * a00 + a01 * a20), (a11 * a00 - a01 * a10)) / det;
        }
        mat4 inverseMat(mat4 m) {
          float a00 = m[0][0], a01 = m[0][1], a02 = m[0][2], a03 = m[0][3],
            a10 = m[1][0], a11 = m[1][1], a12 = m[1][2], a13 = m[1][3],
            a20 = m[2][0], a21 = m[2][1], a22 = m[2][2], a23 = m[2][3],
            a30 = m[3][0], a31 = m[3][1], a32 = m[3][2], a33 = m[3][3],

            b00 = a00 * a11 - a01 * a10,
            b01 = a00 * a12 - a02 * a10,
            b02 = a00 * a13 - a03 * a10,
            b03 = a01 * a12 - a02 * a11,
            b04 = a01 * a13 - a03 * a11,
            b05 = a02 * a13 - a03 * a12,
            b06 = a20 * a31 - a21 * a30,
            b07 = a20 * a32 - a22 * a30,
            b08 = a20 * a33 - a23 * a30,
            b09 = a21 * a32 - a22 * a31,
            b10 = a21 * a33 - a23 * a31,
            b11 = a22 * a33 - a23 * a32,

            det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

          return mat4(
            a11 * b11 - a12 * b10 + a13 * b09,
            a02 * b10 - a01 * b11 - a03 * b09,
            a31 * b05 - a32 * b04 + a33 * b03,
            a22 * b04 - a21 * b05 - a23 * b03,
            a12 * b08 - a10 * b11 - a13 * b07,
            a00 * b11 - a02 * b08 + a03 * b07,
            a32 * b02 - a30 * b05 - a33 * b01,
            a20 * b05 - a22 * b02 + a23 * b01,
            a10 * b10 - a11 * b08 + a13 * b06,
            a01 * b08 - a00 * b10 - a03 * b06,
            a30 * b04 - a31 * b02 + a33 * b00,
            a21 * b02 - a20 * b04 - a23 * b00,
            a11 * b07 - a10 * b09 - a12 * b06,
            a00 * b09 - a01 * b07 + a02 * b06,
            a31 * b01 - a30 * b03 - a32 * b00,
            a20 * b03 - a21 * b01 + a22 * b00) / det;
        }

        #define INVERSE_MAT(mat) inverseMat(mat)
      #endif


      v2f vert(a2v v) {
        v2f o;

        float tol = 0.0001;
        mat4 viewInvMat = camera_ViewInvMat;
        if (abs(viewInvMat[3][1]) < tol) {
            viewInvMat[3][1] = tol;
        }
        mat4 projInvMat = INVERSE_MAT(camera_ProjMat);

        o.nearPoint = UnprojectPoint(v.POSITION.x, v.POSITION.y, -1.0, viewInvMat, projInvMat);// unprojecting on the near plane
        o.farPoint = UnprojectPoint(v.POSITION.x, v.POSITION.y, 1.0, viewInvMat, projInvMat);// unprojecting on the far plane
        gl_Position = vec4(v.POSITION, 1.0);// using directly the clipped coordinates
      }

      mat4 renderer_LocalMat;
      mat4 renderer_ModelMat;
      mat4 camera_ViewMat;
      mat4 camera_ProjMat;
      mat4 renderer_MVMat;
      mat4 renderer_MVPMat;
      mat4 renderer_NormalMat;

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
        if (fragPos3D.x > -u_axisIntensity * minimumx && fragPos3D.x < u_axisIntensity * minimumx) {
          color.z = 1.0;
        }
        // x-axis or y-axis
        float xy = mix(fragPos3D.z, fragPos3D.y, u_flipProgress);
        if (xy > -u_axisIntensity * minimumz && xy < u_axisIntensity * minimumz) {
          color.x = 1.0;
        }
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
        return linearDepth / u_far;// normalize
      }

      void frag(v2f i) {
        float ty = -i.nearPoint.y / (i.farPoint.y - i.nearPoint.y);
        float tz = -i.nearPoint.z / (i.farPoint.z - i.nearPoint.z);
        float t = mix(ty, tz, u_flipProgress);
        vec3 fragPos3D = i.nearPoint + t * (i.farPoint - i.nearPoint);

        gl_FragDepth = computeDepth(fragPos3D);

        float linearDepth = computeLinearDepth(fragPos3D);
        float fading = max(0.0, (0.5 - linearDepth));

        // adding multiple resolution for the grid
        gl_FragColor = (grid(fragPos3D, u_primaryScale, u_fade) + grid(fragPos3D, u_secondaryScale, 1.0 - u_fade));
        gl_FragColor.a *= fading;
      }
    }
  }
}