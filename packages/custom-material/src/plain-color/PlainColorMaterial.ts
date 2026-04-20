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

      struct Attributes {
        vec3 POSITION;
        #ifdef RENDERER_HAS_BLENDSHAPE
          #ifndef RENDERER_BLENDSHAPE_USE_TEXTURE
            vec3 POSITION_BS0;
            vec3 POSITION_BS1;
            #if defined(RENDERER_BLENDSHAPE_HAS_NORMAL) && defined(RENDERER_BLENDSHAPE_HAS_TANGENT)
              vec3 NORMAL_BS0;
              vec3 NORMAL_BS1;
              vec3 TANGENT_BS0;
              vec3 TANGENT_BS1;
            #else
              #if defined(RENDERER_BLENDSHAPE_HAS_NORMAL) || defined(RENDERER_BLENDSHAPE_HAS_TANGENT)
                vec3 POSITION_BS2;
                vec3 POSITION_BS3;
                #ifdef RENDERER_BLENDSHAPE_HAS_NORMAL
                  vec3 NORMAL_BS0;
                  vec3 NORMAL_BS1;
                  vec3 NORMAL_BS2;
                  vec3 NORMAL_BS3;
                #endif
                #ifdef RENDERER_BLENDSHAPE_HAS_TANGENT
                  vec3 TANGENT_BS0;
                  vec3 TANGENT_BS1;
                  vec3 TANGENT_BS2;
                  vec3 TANGENT_BS3;
                #endif
              #else
                vec3 POSITION_BS2;
                vec3 POSITION_BS3;
                vec3 POSITION_BS4;
                vec3 POSITION_BS5;
                vec3 POSITION_BS6;
                vec3 POSITION_BS7;
              #endif
            #endif
          #endif
        #endif
        #ifdef RENDERER_HAS_SKIN
          vec4 JOINTS_0;
          vec4 WEIGHTS_0;
        #endif
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

        gl_Position = renderer_MVPMat * position;

        return v;
      }

      vec4 material_BaseColor;

      void frag(Varyings v) {
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
