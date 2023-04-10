import { BaseMaterial, Color, Engine, Shader } "@galacean/engine";
import { geometryTextureDefine, geometryTextureVert } from "./GeometryShader";

Shader.create(
  "tbnShader",
  `
#include <common>
   uniform float u_lineScale;
   uniform mat4 u_VPMat;
   uniform mat4 u_worldMatrix;
   uniform mat4 u_worldNormal;

#ifdef O3_HAS_SKIN
#ifdef O3_USE_JOINT_TEXTURE
    uniform sampler2D u_jointSampler;
    uniform float u_jointCount;

    mat4 getJointMatrix(sampler2D smp, float index) {
        float base = index / u_jointCount;
        float hf = 0.5 / u_jointCount;
        float v = base + hf;

        vec4 m0 = texture2D(smp, vec2(0.125, v ));
        vec4 m1 = texture2D(smp, vec2(0.375, v ));
        vec4 m2 = texture2D(smp, vec2(0.625, v ));
        vec4 m3 = texture2D(smp, vec2(0.875, v ));

        return mat4(m0, m1, m2, m3);
    }
#else
    uniform mat4 u_jointMatrix[ O3_JOINTS_NUM ];
#endif
#endif

${geometryTextureDefine}

void main() {
    int pointIndex = gl_VertexID / 2;
    ${geometryTextureVert}

    #include <begin_position_vert>
    #include <begin_normal_vert>
    #include <skinning_vert>

    gl_Position = u_worldMatrix * position; 
    
#if defined(SHOW_NORMAL) && defined(O3_HAS_NORMAL)
    if (gl_VertexID % 2 == 1) {
        vec3 normalW = normalize( mat3(u_worldNormal) * normal.xyz );
        gl_Position.xyz += normalize(normalW) * u_lineScale;
    }
#endif

#if defined(SHOW_TANGENT) && defined(O3_HAS_TANGENT)
    if (gl_VertexID % 2 == 1) {
        vec3 tangentW = normalize( mat3(u_worldNormal) * tangent.xyz );
        gl_Position.xyz += normalize(tangentW) * u_lineScale;
    }
#endif

#if defined(SHOW_BITANGENT) && defined(O3_HAS_TANGENT) && defined(O3_HAS_NORMAL)
    if (gl_VertexID % 2 == 1) {
        vec3 normalW = normalize( mat3(u_worldNormal) * normal.xyz );
        vec3 tangentW = normalize( mat3(u_worldNormal) * tangent.xyz );
        vec3 bitangentW = cross( normalW, tangentW ) * tangent.w;
        gl_Position.xyz += normalize(bitangentW) * u_lineScale;
    }
#endif
    
    gl_Position = u_VPMat * gl_Position; 
}
`,
  `
uniform vec4 u_baseColor;
void main() {
    gl_FragColor = u_baseColor;
}
`
);

/**
 * Material for normal shading
 */
export class NormalMaterial extends BaseMaterial {
  /**
   * Base color.
   */
  get baseColor(): Color {
    return this.shaderData.getColor(NormalMaterial._baseColorProp);
  }

  set baseColor(value: Color) {
    const baseColor = this.shaderData.getColor(NormalMaterial._baseColorProp);
    if (value !== baseColor) {
      baseColor.copyFrom(value);
    }
  }

  constructor(engine: Engine) {
    super(engine, Shader.find("tbnShader"));
    this.shaderData.setColor(NormalMaterial._baseColorProp, new Color(1, 0, 0, 1));
    this.shaderData.enableMacro("SHOW_NORMAL");
  }
}

/**
 * Material for normal tangent
 */
export class TangentMaterial extends BaseMaterial {
  /**
   * Base color.
   */
  get baseColor(): Color {
    return this.shaderData.getColor(TangentMaterial._baseColorProp);
  }

  set baseColor(value: Color) {
    const baseColor = this.shaderData.getColor(TangentMaterial._baseColorProp);
    if (value !== baseColor) {
      baseColor.copyFrom(value);
    }
  }

  constructor(engine: Engine) {
    super(engine, Shader.find("tbnShader"));
    this.shaderData.setColor(TangentMaterial._baseColorProp, new Color(0, 1, 0, 1));
    this.shaderData.enableMacro("SHOW_TANGENT");
  }
}

/**
 * Material for normal bi-tangent
 */
export class BiTangentMaterial extends BaseMaterial {
  /**
   * Base color.
   */
  get baseColor(): Color {
    return this.shaderData.getColor(BiTangentMaterial._baseColorProp);
  }

  set baseColor(value: Color) {
    const baseColor = this.shaderData.getColor(BiTangentMaterial._baseColorProp);
    if (value !== baseColor) {
      baseColor.copyFrom(value);
    }
  }

  constructor(engine: Engine) {
    super(engine, Shader.find("tbnShader"));
    this.shaderData.setColor(BiTangentMaterial._baseColorProp, new Color(0, 0, 1, 1));
    this.shaderData.enableMacro("SHOW_BITANGENT");
  }
}
