import { BaseMaterial, Engine, Shader, ShaderProperty, Texture2D, Vector2, Vector4 } from "@galacean/engine";
import { WaterSource } from "../../libs";

// @ts-ignore
Shader.find("water") || Shader._createFromPrecompiled(WaterSource);

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
