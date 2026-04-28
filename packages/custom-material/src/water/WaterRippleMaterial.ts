import { BaseMaterial, Engine, Shader, ShaderProperty, Texture2D, Vector2, Vector3 } from "@galacean/engine";
import shaderSource from "./WaterRipple.shader";

Shader.find("water-ripple") || Shader.create(shaderSource);

export class WaterRippleMaterial extends BaseMaterial {
  private static _foamColor = ShaderProperty.getByName("u_foamColor");
  private static _foamSpeed = ShaderProperty.getByName("u_foam_speed");
  private static _foamParam = ShaderProperty.getByName("u_foam_param");
  private static _distorsionSpeed = ShaderProperty.getByName("u_distorsion_speed");
  private static _distorsionAmount = ShaderProperty.getByName("u_distorsion_amount");

  static _foamTextureProp = ShaderProperty.getByName("u_foamTex");

  /**
   * Foam Texture Map
   */
  get foamTexture(): Texture2D {
    return <Texture2D>this.shaderData.getTexture(WaterRippleMaterial._foamTextureProp);
  }

  set foamTexture(value: Texture2D) {
    this.shaderData.setTexture(WaterRippleMaterial._foamTextureProp, value);
  }

  /**
   * Normal Texture Map
   */
  get normalTexture(): Texture2D {
    return <Texture2D>this.shaderData.getTexture(WaterRippleMaterial._normalTextureProp);
  }

  set normalTexture(value: Texture2D) {
    this.shaderData.setTexture(WaterRippleMaterial._normalTextureProp, value);
  }

  /**
   * Foam Color
   */
  get foamColor(): Vector3 {
    return this.shaderData.getVector3(WaterRippleMaterial._foamColor);
  }

  set foamColor(val: Vector3) {
    this.shaderData.setVector3(WaterRippleMaterial._foamColor, val);
  }

  /**
   * Foam speed on x direction and y direction
   * foam speed y, foam amount, foam smoothness
   */
  get foamSpeed(): Vector2 {
    return this.shaderData.getVector2(WaterRippleMaterial._foamSpeed);
  }

  set foamSpeed(val: Vector2) {
    this.shaderData.setVector2(WaterRippleMaterial._foamSpeed, val);
  }

  /**
   * Foam Param;
   * x for foam amount
   * y for foam smoothness, must between 0 ~ 0.5;
   */
  get foamParam(): Vector2 {
    return this.shaderData.getVector2(WaterRippleMaterial._foamParam);
  }

  set foamParam(val: Vector2) {
    this.shaderData.setVector2(WaterRippleMaterial._foamParam, val);
  }

  /**
   * Distorsion Speed on x direction and y direction
   */
  get distorsionSpeed(): Vector2 {
    return this.shaderData.getVector2(WaterRippleMaterial._distorsionSpeed);
  }

  set distorsionSpeed(val: Vector2) {
    this.shaderData.setVector2(WaterRippleMaterial._distorsionSpeed, val);
  }

  /**
   * Distorsion Amount, must between -1 ~ 1
   */
  get distorsionAmount(): number {
    return this.shaderData.getFloat(WaterRippleMaterial._distorsionAmount);
  }

  set distorsionAmount(val: number) {
    this.shaderData.setFloat(WaterRippleMaterial._distorsionAmount, val);
  }

  constructor(engine: Engine) {
    super(engine, Shader.find("water-ripple"));
    this.isTransparent = true;

    const shaderData = this.shaderData;
    shaderData.setVector3(
      WaterRippleMaterial._foamColor,
      new Vector3((69 + 255) / 400, (156 + 255) / 400, (247 + 255) / 400)
    );
    shaderData.setVector2(WaterRippleMaterial._foamSpeed, new Vector2(-1, 0.3));
    shaderData.setVector2(WaterRippleMaterial._foamParam, new Vector2(2.0, 0.05));
    shaderData.setVector2(WaterRippleMaterial._distorsionSpeed, new Vector2(1.0, 0));
    shaderData.setFloat(WaterRippleMaterial._distorsionAmount, 0.03);
  }
}
