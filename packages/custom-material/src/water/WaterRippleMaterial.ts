import { Shader, Texture2D, Engine, BaseMaterial, Vector2, Vector3 } from "oasis-engine";

const vertexSource = `
  attribute vec3 POSITION;
  attribute vec2 TEXCOORD_0;
  uniform mat4 u_MVPMat;
  
  uniform float u_time;
  uniform vec2 u_foam_speed; 
  uniform vec2 u_distorsion_speed; 
  varying vec2 waterTexCoords;
  varying vec2 normalTexCoords;
  void main() {
    gl_Position = u_MVPMat * vec4(POSITION, 1.0);
    waterTexCoords = TEXCOORD_0 + vec2(u_foam_speed.x * u_time,u_foam_speed.y * u_time);
    normalTexCoords = TEXCOORD_0 + vec2(u_distorsion_speed.x * cos(u_time),u_distorsion_speed.y * sin(u_time));
  }
  `;

const fragmentSource = `
  #include <common>
  varying vec2 waterTexCoords;
  varying vec2 normalTexCoords;
  uniform sampler2D u_normalTex;
  uniform sampler2D u_foamTex;
  uniform vec3 u_foamColor;
  uniform vec3 u_foam_param;
  uniform float u_distorsion_amount;

  void main() {  
    vec4 normalTex = texture2D(u_normalTex, normalTexCoords) * 2.0 - 1.0;
    vec4 waterTex = texture2D(u_foamTex, waterTexCoords + (normalTex.rg * u_distorsion_amount));
    float alphaComp = u_foam_param.z * waterTex.r * u_foam_param.x;
    float alpha = pow(alphaComp,2.0);
    alpha = smoothstep(0.5 - u_foam_param.y, 0.5+ u_foam_param.y, alpha);
    alpha = saturate(alpha);
    
    gl_FragColor = vec4(u_foamColor.rgb, alpha);
  }
  `;

Shader.create("water-ripple", vertexSource, fragmentSource);

export class WaterRippleMaterial extends BaseMaterial {
  private static _foamColor = Shader.getPropertyByName("u_foamColor");
  private static _foamSpeed = Shader.getPropertyByName("u_foam_speed");
  private static _foamParam = Shader.getPropertyByName("u_foam_param");
  private static _distorsionSpeed = Shader.getPropertyByName("u_distorsion_speed");
  private static _distorsionAmount = Shader.getPropertyByName("u_distorsion_amount");

  static _foamTextureProp = Shader.getPropertyByName("u_foamTex");
  static _normalTextureProp = Shader.getPropertyByName("u_normalTex");

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
   * z for color factor, default 0.7
   */
  get foamParam(): Vector3 {
    return this.shaderData.getVector3(WaterRippleMaterial._foamParam);
  }

  set foamParam(val: Vector3) {
    this.shaderData.setVector3(WaterRippleMaterial._foamParam, val);
  }

  /**
   * Distorsion Speed on x direction and y direction
   */
  get distorsionSpeed(): Vector3 {
    return this.shaderData.getVector3(WaterRippleMaterial._distorsionSpeed);
  }

  set distorsionSpeed(val: Vector3) {
    this.shaderData.setVector3(WaterRippleMaterial._distorsionSpeed, val);
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
    shaderData.setVector3(WaterRippleMaterial._foamParam, new Vector3(2.0, 0.05, 0.7));
    shaderData.setVector2(WaterRippleMaterial._distorsionSpeed, new Vector2(1.0, 0));
    shaderData.setFloat(WaterRippleMaterial._distorsionAmount, 0.03);
  }
}
