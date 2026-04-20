import { BaseMaterial, Color, CullMode, Engine, Shader } from "@galacean/engine";

const shaderSource = `Shader "plain-color" {
  SubShader "Default" {
    Pass "Forward" {
      VertexShader = vert;
      FragmentShader = frag;

      #include "Common/Common.glsl"
      #include "Common/Transform.glsl"
      #include "Skin/Skin.glsl"
      #include "Skin/BlendShape.glsl"

      #include "Common/Attributes.glsl"

      void vert(Attributes attr) {
        vec4 position = vec4(attr.POSITION, 1.0);

        #ifdef RENDERER_HAS_BLENDSHAPE
          calculateBlendShape(attr, position);
        #endif

        #ifdef RENDERER_HAS_SKIN
          mat4 skinMatrix = getSkinMatrix(attr);
          position = skinMatrix * position;
        #endif

        gl_Position = renderer_MVPMat * position;
      }

      vec4 material_BaseColor;

      void frag() {
        vec4 baseColor = material_BaseColor;

        #ifdef MATERIAL_IS_ALPHA_CUTOFF
          if( baseColor.a < material_AlphaCutoff ) {
            discard;
          }
        #endif

        gl_FragColor = baseColor;
      }
    }
  }
}`;

Shader.find("plain-color") || Shader.create(shaderSource);

/**
 * plain color Material. don't effected by light and fog.
 */
export class PlainColorMaterial extends BaseMaterial {
  /**
   * Base color.
   */
  get baseColor(): Color {
    return this.shaderData.getColor(PlainColorMaterial._baseColorProp);
  }

  set baseColor(value: Color) {
    const baseColor = this.shaderData.getColor(PlainColorMaterial._baseColorProp);
    if (value !== baseColor) {
      baseColor.copyFrom(value);
    }
  }

  /**
   * Create a plain color material instance.
   * @param engine - Engine to which the material belongs
   */
  constructor(engine: Engine) {
    super(engine, Shader.find("plain-color"));

    const shaderData = this.shaderData;

    shaderData.enableMacro("MATERIAL_OMIT_NORMAL");

    shaderData.setColor(PlainColorMaterial._baseColorProp, new Color(1, 1, 1, 1));

    this.renderState.rasterState.cullMode = CullMode.Off;
  }

  override clone(): PlainColorMaterial {
    const dest = new PlainColorMaterial(this.engine);
    this.cloneTo(dest);
    return dest;
  }
}
