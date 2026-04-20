import { BaseMaterial, Engine, Shader, ShaderProperty, Texture2D, Vector2, Vector4 } from "@galacean/engine";

const shaderSource = `Shader "water" {
  SubShader "Default" {
    Pass "Forward" {
      VertexShader = vert;
      FragmentShader = frag;

      mat4 renderer_MVPMat;
      float u_time;
      vec2 u_water_speed;
      vec2 u_distorsion_speed;

      #include "Common/Attributes.glsl"

      struct Varyings {
        vec4 v_color;
        vec2 waterTexCoords;
        vec2 normalTexCoords;
      };

      Varyings vert(Attributes attr) {
        Varyings v;
        gl_Position = renderer_MVPMat * vec4(attr.POSITION, 1.0);

        #ifdef RENDERER_HAS_UV
          v.waterTexCoords = attr.TEXCOORD_0 + vec2(u_water_speed.x * sin(u_time), u_water_speed.y * cos(u_time));
          v.normalTexCoords = attr.TEXCOORD_0 + vec2(u_distorsion_speed.x * cos(u_time), u_distorsion_speed.y * sin(u_time));
        #endif

        #ifdef RENDERER_ENABLE_VERTEXCOLOR
          v.v_color = attr.COLOR_0;
        #endif
        return v;
      }

      #include "Common/Common.glsl"

      sampler2D material_NormalTexture;
      sampler2D u_waterTex;
      sampler2D u_edgeTex;

      vec4 u_edgeColor;
      vec2 u_edgeParam;
      float u_distorsion_amount;

      void frag(Varyings v) {
        vec4 normalTex = texture2D(material_NormalTexture, v.normalTexCoords) * 2.0 - 1.0;
        vec4 waterTex = texture2D(u_waterTex, v.waterTexCoords + (normalTex.rg * u_distorsion_amount));
        vec4 edgeTex = texture2D(u_edgeTex, v.waterTexCoords + (normalTex.rg * u_distorsion_amount));

        float edge = pow((v.v_color.r + edgeTex.r) * v.v_color.r, 2.0);
        edge = saturate(1.0 - smoothstep(u_edgeParam.x - u_edgeParam.y, u_edgeParam.x + u_edgeParam.y, edge));
        vec4 finalCol = mix(waterTex, u_edgeColor, edge);

        gl_FragColor = finalCol;
      }
    }
  }
}`;

Shader.find("water") || Shader.create(shaderSource);

export class WaterMaterial extends BaseMaterial {
  private static _waterSpeed = ShaderProperty.getByName("u_water_speed");
  private static _edgeColor = ShaderProperty.getByName("u_edgeColor");
  private static _edgeParam = ShaderProperty.getByName("u_edgeParam");
  private static _distorsionAmount = ShaderProperty.getByName("u_distorsion_amount");
  private static _distorsionSpeed = ShaderProperty.getByName("u_distorsion_speed");

  static _waterTextureProp = ShaderProperty.getByName("u_waterTex");
  static _edgeTextureProp = ShaderProperty.getByName("u_edgeTex");

  /**
   *  Normal Texture Map
   */
  get normalTexture(): Texture2D {
    return <Texture2D>this.shaderData.getTexture(WaterMaterial._normalTextureProp);
  }

  set normalTexture(value: Texture2D) {
    this.shaderData.setTexture(WaterMaterial._normalTextureProp, value);
  }

  /**
   *  Water Texture Map
   */
  get waterTexture(): Texture2D {
    return <Texture2D>this.shaderData.getTexture(WaterMaterial._waterTextureProp);
  }

  set waterTexture(value: Texture2D) {
    this.shaderData.setTexture(WaterMaterial._waterTextureProp, value);
  }

  /**
   *  Edge Texture Map
   */
  get edgeTexture(): Texture2D {
    return <Texture2D>this.shaderData.getTexture(WaterMaterial._edgeTextureProp);
  }

  set edgeTexture(value: Texture2D) {
    this.shaderData.setTexture(WaterMaterial._edgeTextureProp, value);
  }

  /**
   *  Water Speed on x direction and y direction
   */
  get waterSpeed(): Vector2 {
    return this.shaderData.getVector2(WaterMaterial._waterSpeed);
  }

  set waterSpeed(val: Vector2) {
    this.shaderData.setVector2(WaterMaterial._waterSpeed, val);
  }

  /**
   * Water Edge Color
   */
  get edgeColor(): Vector4 {
    return this.shaderData.getVector4(WaterMaterial._edgeColor);
  }

  set edgeColor(val: Vector4) {
    this.shaderData.setVector4(WaterMaterial._edgeColor, val);
  }

  /**
   * Edge Param;
   * x for edge thickness, must between 0 ~ 1;
   * y for edge smoothness, must between 0 ~ 0.5;
   */
  get edgeParam(): Vector2 {
    return this.shaderData.getVector2(WaterMaterial._edgeParam);
  }

  set edgeParam(val: Vector2) {
    this.shaderData.setVector2(WaterMaterial._edgeParam, val);
  }

  /**
   * Distorsion Amount, must between -1 ~ 1
   */
  get distorsionAmount(): number {
    return this.shaderData.getFloat(WaterMaterial._distorsionAmount);
  }

  set distorsionAmount(val: number) {
    this.shaderData.setFloat(WaterMaterial._distorsionAmount, val);
  }

  /**
   * Distorsion Speed on x direction and y direction
   */
  get distorsionSpeed(): Vector2 {
    return this.shaderData.getVector2(WaterMaterial._distorsionSpeed);
  }

  set distorsionSpeed(val: Vector2) {
    this.shaderData.setVector2(WaterMaterial._distorsionSpeed, val);
  }

  constructor(engine: Engine) {
    super(engine, Shader.find("water"));

    this.shaderData.setVector2(WaterMaterial._waterSpeed, new Vector2(-0.02, 0.02));
    this.shaderData.setVector4(
      WaterMaterial._edgeColor,
      new Vector4((69 + 255) / 510, (156 + 255) / 510, (247 + 255) / 510, 1)
    );
    this.shaderData.setVector2(WaterMaterial._edgeParam, new Vector2(0.008, 0.002));
    this.shaderData.setFloat(WaterMaterial._distorsionAmount, 0.02);
    this.shaderData.setVector2(WaterMaterial._distorsionSpeed, new Vector2(0.2, 0.2));
  }
}
