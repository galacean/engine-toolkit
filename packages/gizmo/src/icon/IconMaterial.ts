import { BaseMaterial, Color, CullMode, Engine, Shader, Texture2D } from "@galacean/engine";

const shaderSource = `Shader "icon" {
  SubShader "Default" {
    Pass "Forward" {
      VertexShader = vert;
      FragmentShader = frag;

      #include "Common/Common.glsl"
      #include "Common/Transform.glsl"
      #include "Skin/Skin.glsl"
      #include "Skin/BlendShape.glsl"

      vec2 u_size;
      vec4 u_pixelViewport;

      #include "Common/Attributes.glsl"

      struct Varyings {
        vec2 v_uv;
      };

      Varyings vert(Attributes attr) {
        Varyings v;

        vec4 position = vec4(attr.POSITION, 1.0);

        #ifdef RENDERER_HAS_BLENDSHAPE
          calculateBlendShape(attr, position);
        #endif

        #ifdef RENDERER_HAS_SKIN
          mat4 skinMatrix = getSkinMatrix(attr);
          position = skinMatrix * position;
        #endif

        vec4 translation = renderer_MVPMat[3];
        translation = translation / translation.w;
        float xFactor = u_size.x / u_pixelViewport.z * 2.0;
        float yFactor = u_size.y / u_pixelViewport.w * 2.0;
        gl_Position = vec4(translation.x + xFactor * position.x, translation.y + yFactor * position.y, translation.z, 1);
        #ifdef RENDERER_HAS_UV
          v.v_uv = attr.TEXCOORD_0;
        #endif

        return v;
      }

      vec4 material_BaseColor;
      #ifdef MATERIAL_HAS_BASETEXTURE
        sampler2D material_BaseTexture;
      #endif

      void frag(Varyings v) {
        vec4 baseColor = material_BaseColor;

        #ifdef MATERIAL_HAS_BASETEXTURE
          vec4 textureColor = texture2D(material_BaseTexture, v.v_uv);
          baseColor.a *= textureColor.a;
        #endif

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

Shader.find("icon") || Shader.create(shaderSource);

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
    const dest = new IconMaterial(this.engine);
    this.cloneTo(dest);
    return dest;
  }
}
