import { BaseMaterial, Engine, Shader, ShaderProperty, Texture2D, Vector2, Vector4 } from "@galacean/engine";
import { WaterFallSource } from "../../compiledShaders";

// @ts-ignore
Shader.find("water-fall") || Shader._createFromPrecompiled(WaterFallSource);

export class WaterFallMaterial extends BaseMaterial {
  private static _waterSpeed = ShaderProperty.getByName("u_water_speed");
  private static _waterfallSpeed = ShaderProperty.getByName("u_waterfall_speed");
  private static _distorsionSpeed = ShaderProperty.getByName("u_distorsion_speed");

  private static _edgeColor = ShaderProperty.getByName("u_edgeColor");
  private static _edgeParam = ShaderProperty.getByName("u_edgeParam");
  private static _distorsionAmount = ShaderProperty.getByName("u_distorsion_amount");

  static _waterTextureProp = ShaderProperty.getByName("u_waterTex");
  static _waterfallTextureProp = ShaderProperty.getByName("u_waterfallTex");
  static _edgeTextureProp = ShaderProperty.getByName("u_edgeNoiseTex");

  /**
   *  Normal Texture Map
   */
  get normalTexture(): Texture2D {
    return <Texture2D>this.shaderData.getTexture(WaterFallMaterial._normalTextureProp);
  }

  set normalTexture(value: Texture2D) {
    this.shaderData.setTexture(WaterFallMaterial._normalTextureProp, value);
  }

  /**
   *  Water Texture Map
   */
  get waterTexture(): Texture2D {
    return <Texture2D>this.shaderData.getTexture(WaterFallMaterial._waterTextureProp);
  }

  set waterTexture(value: Texture2D) {
    this.shaderData.setTexture(WaterFallMaterial._waterTextureProp, value);
  }

  /**
   *  Water Fall Texture Map
   */
  get waterfallTexture(): Texture2D {
    return <Texture2D>this.shaderData.getTexture(WaterFallMaterial._waterfallTextureProp);
  }

  set waterfallTexture(value: Texture2D) {
    this.shaderData.setTexture(WaterFallMaterial._waterfallTextureProp, value);
  }

  /**
   *  Edge Noise Texture Map
   */
  get edgeNoiseTexture(): Texture2D {
    return <Texture2D>this.shaderData.getTexture(WaterFallMaterial._edgeTextureProp);
  }

  set edgeNoiseTexture(value: Texture2D) {
    this.shaderData.setTexture(WaterFallMaterial._edgeTextureProp, value);
  }

  /**
   *  Water Speed on x direction and y direction
   */
  get waterSpeed(): Vector2 {
    return this.shaderData.getVector2(WaterFallMaterial._waterSpeed);
  }

  set waterSpeed(val: Vector2) {
    this.shaderData.setVector2(WaterFallMaterial._waterSpeed, val);
  }

  /**
   *  Water Speed on x direction and y direction
   */
  get waterfallSpeed(): Vector2 {
    return this.shaderData.getVector2(WaterFallMaterial._waterfallSpeed);
  }

  set waterfallSpeed(val: Vector2) {
    this.shaderData.setVector2(WaterFallMaterial._waterfallSpeed, val);
  }

  /**
   * Water Edge Color
   */
  get edgeColor(): Vector4 {
    return this.shaderData.getVector4(WaterFallMaterial._edgeColor);
  }

  set edgeColor(val: Vector4) {
    this.shaderData.setVector4(WaterFallMaterial._edgeColor, val);
  }

  /**
   * Edge Param;
   * x for edge thickness, must between 0 ~ 1;
   * y for edge smoothness, must between 0 ~ 0.5;
   */
  get edgeParam(): Vector2 {
    return this.shaderData.getVector2(WaterFallMaterial._edgeParam);
  }

  set edgeParam(val: Vector2) {
    this.shaderData.setVector2(WaterFallMaterial._edgeParam, val);
  }

  /**
   * Distorsion Amount, must between -1 ~ 1
   */
  get distorsionAmount(): number {
    return this.shaderData.getFloat(WaterFallMaterial._distorsionAmount);
  }

  set distorsionAmount(val: number) {
    this.shaderData.setFloat(WaterFallMaterial._distorsionAmount, val);
  }

  /**
   * Distorsion Speed on x direction and y direction
   */
  get distorsionSpeed(): Vector2 {
    return this.shaderData.getVector2(WaterFallMaterial._distorsionSpeed);
  }

  set distorsionSpeed(val: Vector2) {
    this.shaderData.setVector2(WaterFallMaterial._distorsionSpeed, val);
  }

  constructor(engine: Engine) {
    super(engine, Shader.find("water-fall"));

    this.shaderData.setVector2(WaterFallMaterial._waterSpeed, new Vector2(0.2, 0.0));
    this.shaderData.setVector2(WaterFallMaterial._waterfallSpeed, new Vector2(0.9, 0));
    this.shaderData.setVector4(WaterFallMaterial._edgeColor, new Vector4(160 / 255, 250 / 255, 250 / 255, 1.0));
    this.shaderData.setVector2(WaterFallMaterial._edgeParam, new Vector2(0.7, 0.05));
    this.shaderData.setFloat(WaterFallMaterial._distorsionAmount, 0.03);
    this.shaderData.setVector2(WaterFallMaterial._distorsionSpeed, new Vector2(1.0, 1.0));
  }
}
