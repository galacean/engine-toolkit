import { BaseMaterial, Color, CullMode, Engine, Shader, Texture2D } from "@galacean/engine";

/**
 * Icon Material. don't effected by light and fog.
 */
export class IconMaterial extends BaseMaterial {
  /**
   * Base color.
   */
  get baseColor(): Color {
    return this.shaderData.getColor(IconMaterial._baseColorProp);
  }

  set baseColor(value: Color) {
    const baseColor = this.shaderData.getColor(IconMaterial._baseColorProp);
    if (value !== baseColor) {
      baseColor.copyFrom(value);
    }
  }

  /**
   * Base texture.
   */
  get baseTexture(): Texture2D {
    return <Texture2D>this.shaderData.getTexture(IconMaterial._baseTextureProp);
  }

  set baseTexture(value: Texture2D) {
    this.shaderData.setTexture(IconMaterial._baseTextureProp, value);
    if (value) {
      this.shaderData.enableMacro(IconMaterial._baseTextureMacro);
    } else {
      this.shaderData.disableMacro(IconMaterial._baseTextureMacro);
    }
  }

  /**
   * Create a plain color material instance.
   * @param engine - Engine to which the material belongs
   */
  constructor(engine: Engine) {
    super(engine, Shader.find("icon"));
    this.shaderData.setColor(IconMaterial._baseColorProp, new Color(1, 1, 1, 1));
    this.renderState.rasterState.cullMode = CullMode.Off;
  }

  override clone(): IconMaterial {
    const dest = new IconMaterial(this._engine);
    this.cloneTo(dest);
    return dest;
  }
}

Shader.create(
  "icon",
  `
#include <common>
#include <common_vert>
#include <uv_share>
#include <blendShape_input>

uniform vec2 u_size;
uniform vec4 u_pixelViewport;

void main() {
    #include <begin_position_vert>
    #include <blendShape_vert>
    #include <skinning_vert>

    vec4 translation = renderer_MVPMat[3];
    translation = translation / translation.w;
    float xFactor = u_size.x / u_pixelViewport.z * 2.0;
    float yFactor = u_size.y / u_pixelViewport.w * 2.0;
    gl_Position = vec4(translation.x + xFactor * position.x, translation.y + yFactor * position.y, translation.z, 1);
    v_uv = TEXCOORD_0;
}
`,

  `
#include <common>
#include <uv_share>

uniform vec4 material_BaseColor;
#ifdef MATERIAL_HAS_BASETEXTURE
    uniform sampler2D material_BaseTexture;
#endif

void main() {
     vec4 baseColor = material_BaseColor;

     #ifdef MATERIAL_HAS_BASETEXTURE
        vec4 textureColor = texture2D(material_BaseTexture, v_uv);
        baseColor *= textureColor;
     #endif

    #ifdef MATERIAL_IS_ALPHA_CUTOFF
        if( baseColor.a < material_AlphaCutoff ) {
            discard;
        }
    #endif

    gl_FragColor = baseColor;

     #ifndef ENGINE_IS_COLORSPACE_GAMMA
        gl_FragColor = linearToGamma(gl_FragColor);
    #endif
}
`
);
