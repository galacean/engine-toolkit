import { BaseMaterial, Color, CullMode, Engine, Shader } from "@galacean/engine";

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

    shaderData.enableMacro("OMIT_NORMAL");

    shaderData.setColor(PlainColorMaterial._baseColorProp, new Color(1, 1, 1, 1));

    this.renderState.rasterState.cullMode = CullMode.Off;
  }

  /**
   * @override
   */
  clone(): PlainColorMaterial {
    const dest = new PlainColorMaterial(this._engine);
    this.cloneTo(dest);
    return dest;
  }
}

Shader.create(
  "plain-color",
  `
#include <common>
#include <common_vert>
#include <blendShape_input>

void main() {
    #include <begin_position_vert>
    #include <blendShape_vert>
    #include <skinning_vert>
    #include <position_vert>
}
`,

  `
#include <common>

uniform vec4 u_baseColor;

void main() {
     vec4 baseColor = u_baseColor;

    #ifdef ALPHA_CUTOFF
        if( baseColor.a < u_alphaCutoff ) {
            discard;
        }
    #endif

    gl_FragColor = baseColor;

     #ifndef OASIS_COLORSPACE_GAMMA
        gl_FragColor = linearToGamma(gl_FragColor);
    #endif
}
`
);
