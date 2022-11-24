import { Shader, Texture2D, Engine, BaseMaterial, Vector2, Vector3 } from "oasis-engine";

const vertexSource = `
  attribute vec3 POSITION;
  attribute vec4 COLOR_0;
  attribute vec2 TEXCOORD_0;
  attribute vec2 TEXCOORD_1;

  uniform mat4 u_MVPMat;
  
  uniform float u_time;
  uniform vec2 u_foam_speed; 
  uniform vec2 u_distorsion_speed; 

  varying vec2 waterTexCoords;
  varying vec2 normalTexCoords;
  varying vec4 v_color;

  void main() {
    gl_Position = u_MVPMat * vec4(POSITION, 1.0);

    waterTexCoords = TEXCOORD_0 + vec2(u_foam_speed.x * sin(u_time),u_foam_speed.y * cos(u_time));
    normalTexCoords = TEXCOORD_1 + vec2(u_distorsion_speed.x * cos(u_time),u_distorsion_speed.y * sin(u_time));
   
    v_color = COLOR_0;
  }
  `;

const fragmentSource = `
  varying vec4 v_color;
  varying vec2 waterTexCoords;
  varying vec2 normalTexCoords;

  uniform sampler2D u_normalTex;
  uniform sampler2D u_waterTex;

  uniform vec3 u_foamColor;
  uniform vec2 u_foam_param;
  uniform float u_distorsion_amount;

  void main() {
    vec4 normalTex = texture2D(u_normalTex, normalTexCoords) * 2.0 - 1.0;
    vec4 waterTex = texture2D(u_waterTex, waterTexCoords + (normalTex.rg * u_distorsion_amount));

    float alphaComp = v_color.r * waterTex.r * u_foam_param.x;
    float alpha = pow(alphaComp,2.0);
    alpha = smoothstep(0.5 - u_foam_param.y, 0.5+ u_foam_param.y, alpha);
		alpha = clamp(alpha,0.0,1.0);
    
    gl_FragColor = vec4(u_foamColor.r,u_foamColor.g,u_foamColor.b,alpha);
  }
  `;

Shader.create("ripple", vertexSource, fragmentSource);

export class RippleMaterial extends BaseMaterial {
  private static _foamColor = Shader.getPropertyByName("u_foamColor");
  private static _foamSpeed = Shader.getPropertyByName("u_foam_speed");
  private static _foamParam = Shader.getPropertyByName("u_foam_param");
  private static _distorsionSpeed = Shader.getPropertyByName("u_distorsion_speed");
  private static _distorsionAmount = Shader.getPropertyByName("u_distorsion_amount");

  static _foamTextureProp = Shader.getPropertyByName("_FoamTex");
  static _normalTextureProp = Shader.getPropertyByName("_NormalTex");

  /**
   * Foam Texture Map
   */
  get foamTexture(): Texture2D {
    return <Texture2D>this.shaderData.getTexture(RippleMaterial._foamTextureProp);
  }

  set foamTexture(value: Texture2D) {
    this.shaderData.setTexture(RippleMaterial._foamTextureProp, value);
  }

  /**
   * Normal Texture Map
   */
  get normalTexture(): Texture2D {
    return <Texture2D>this.shaderData.getTexture(RippleMaterial._normalTextureProp);
  }

  set normalTexture(value: Texture2D) {
    this.shaderData.setTexture(RippleMaterial._normalTextureProp, value);
  }

  /**
   * Foam Color
   */
  get foamColor(): Vector3 {
    return this.shaderData.getVector3(RippleMaterial._foamColor);
  }
  set foamColor(val: Vector3) {
    this.shaderData.setVector3(RippleMaterial._foamColor, val);
  }

  /**
   * Foam speed on x direction and y direction
   * foam speed y, foam amount, foam smoothness
   */
  get foamSpeed(): Vector2 {
    return this.shaderData.getVector2(RippleMaterial._foamSpeed);
  }
  set foamSpeed(val: Vector2) {
    this.shaderData.setVector2(RippleMaterial._foamSpeed, val);
  }

  /**
   * Foam Param;
   * x for foam amount
   * y for foam smoothness, must between 0 ~ 0.5;
   */
  get foamParam(): Vector2 {
    return this.shaderData.getVector2(RippleMaterial._foamSpeed);
  }
  set foamParam(val: Vector2) {
    this.shaderData.setVector2(RippleMaterial._foamSpeed, val);
  }

  /**
   * Distorsion Speed on x direction and y direction
   */
  get distorsionSpeed(): Vector3 {
    return this.shaderData.getVector3(RippleMaterial._distorsionSpeed);
  }

  set distorsionSpeed(val: Vector3) {
    this.shaderData.setVector3(RippleMaterial._distorsionSpeed, val);
  }

  /**
   * Distorsion Amount, must between -1 ~ 1
   */
  get distorsionAmount(): number {
    return this.shaderData.getFloat(RippleMaterial._distorsionAmount);
  }

  set distorsionAmount(val: number) {
    this.shaderData.setFloat(RippleMaterial._distorsionAmount, val);
  }

  constructor(engine: Engine) {
    super(engine, Shader.find("ripple"));
    this.isTransparent = true;

    const shaderData = this.shaderData;
    shaderData.setVector3(RippleMaterial._foamColor, new Vector3(1.0, 1.0, 1.0));
    shaderData.setVector2(RippleMaterial._foamSpeed, new Vector2(0.3, 0.3));
    shaderData.setVector2(RippleMaterial._foamParam, new Vector2(2.0, 0.05));
    shaderData.setVector2(RippleMaterial._distorsionSpeed, new Vector2(1.0, 1.0));
    shaderData.setFloat(RippleMaterial._distorsionAmount, 0.03);
  }
}
