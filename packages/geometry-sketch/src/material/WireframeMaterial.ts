import { BaseMaterial, Color, Engine, RenderFace, Shader } from "@galacean/engine";
import { geometryTextureDefine, geometryTextureVert } from "./GeometryShader";

const shaderSource = `Shader "wireframeShader" {
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

      struct Attributes {
        vec3 POSITION;
        #ifdef RENDERER_HAS_SKIN
          vec4 JOINTS_0;
          vec4 WEIGHTS_0;
        #endif
        #ifdef RENDERER_HAS_NORMAL
          vec3 NORMAL;
        #endif
        #ifdef RENDERER_HAS_TANGENT
          vec4 TANGENT;
        #endif
      };

      struct Varyings {
        vec3 v_baryCenter;
      };

      Varyings vert(Attributes attr) {
        Varyings v;
        int indicesIndex = gl_VertexID / 3;
        int indicesRow = indicesIndex / int(u_indicesTextureWidth);
        int indicesCol = indicesIndex % int(u_indicesTextureWidth);
        vec3 triangleIndices = getIndicesElement(float(indicesRow), float(indicesCol));
        int subIndex = gl_VertexID % 3;
        v.v_baryCenter = vec3(0.0);
        v.v_baryCenter[subIndex] = 1.0;

        int pointIndex = int(triangleIndices[subIndex]);
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
        gl_Position = camera_VPMat * gl_Position;
        return v;
      }

      vec4 material_BaseColor;

      float edgeFactor(vec3 baryCenter) {
        vec3 d = fwidth(baryCenter);
        vec3 a3 = smoothstep(vec3(0.0), d * 1.5, baryCenter);
        return min(min(a3.x, a3.y), a3.z);
      }

      void frag(Varyings v) {
        if (gl_FrontFacing) {
          gl_FragColor = vec4(material_BaseColor.xyz, 1.0 - edgeFactor(v.v_baryCenter));
        } else {
          // fade back face
          gl_FragColor = vec4(material_BaseColor.xyz, (1.0 - edgeFactor(v.v_baryCenter)) * 0.3);
        }
      }
    }
  }
}`;

Shader.find("wireframeShader") || Shader.create(shaderSource);

export class WireframeMaterial extends BaseMaterial {
  /**
   * Base color.
   */
  get baseColor(): Color {
    return this.shaderData.getColor(WireframeMaterial._baseColorProp);
  }

  set baseColor(value: Color) {
    const baseColor = this.shaderData.getColor(WireframeMaterial._baseColorProp);
    if (value !== baseColor) {
      baseColor.copyFrom(value);
    }
  }

  constructor(engine: Engine) {
    super(engine, Shader.find("wireframeShader"));
    this.shaderData.setColor(WireframeMaterial._baseColorProp, new Color(0, 0, 0, 1));
    this.isTransparent = true;
    this.renderFace = RenderFace.Double;
  }
}
