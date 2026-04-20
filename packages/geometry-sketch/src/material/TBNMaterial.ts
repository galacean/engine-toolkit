import { BaseMaterial, Color, Engine, Shader } from "@galacean/engine";
import { geometryTextureDefine, geometryTextureVert } from "./GeometryShader";

const shaderSource = `Shader "tbnShader" {
  SubShader "Default" {
    Pass "Forward" {
      VertexShader = vert;
      FragmentShader = frag;

      #include "Common/Common.glsl"
      #include "Common/Transform.glsl"
      #include "Skin/Skin.glsl"

      float u_lineScale;
      mat4 camera_VPMat;
      mat4 u_worldMatrix;
      mat4 u_worldNormal;

      ${geometryTextureDefine}

      #include "Common/Attributes.glsl"

      struct Varyings {
        float _placeholder;
      };

      Varyings vert(Attributes attr) {
        Varyings v;
        int pointIndex = gl_VertexID / 2;
        ${geometryTextureVert}

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
        return v;
      }

      vec4 material_BaseColor;

      void frag(Varyings v) {
        gl_FragColor = material_BaseColor;
      }
    }
  }
}`;

Shader.find("tbnShader") || Shader.create(shaderSource);

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
