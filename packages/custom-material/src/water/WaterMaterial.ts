import { BaseMaterial, Engine, Shader, ShaderProperty, Texture2D, Vector2, Vector4 } from "@galacean/engine";

const vertexSource = `
    attribute vec3 POSITION;
    attribute vec2 TEXCOORD_0;
    attribute vec4 COLOR_0;

    uniform mat4 galacean_MVPMat;
    
    uniform float u_time;
    uniform vec2 u_water_speed; 
    uniform vec2 u_distorsion_speed; 
    
    varying vec4 v_color;
    varying vec2 waterTexCoords;
    varying vec2 normalTexCoords;
  
    void main() {
      gl_Position = galacean_MVPMat * vec4(POSITION, 1.0);
  
      waterTexCoords = TEXCOORD_0 + vec2(u_water_speed.x * sin(u_time), u_water_speed.y * cos(u_time));
      normalTexCoords = TEXCOORD_0 + vec2(u_distorsion_speed.x * cos(u_time), u_distorsion_speed.y * sin(u_time));     
      
      v_color = COLOR_0;
    }
    `;

const fragmentSource = `
    #include <common>
    varying vec4 v_color;
    varying vec2 waterTexCoords;
    varying vec2 normalTexCoords;
  
    uniform sampler2D u_normalTex;
    uniform sampler2D u_waterTex;
    uniform sampler2D u_edgeTex;
  
    uniform vec4 u_edgeColor;
    uniform vec2 u_edgeParam;
    uniform float u_distorsion_amount;
  
    void main() {
      vec4 normalTex = texture2D(u_normalTex, normalTexCoords) * 2.0 - 1.0;
      vec4 waterTex = texture2D(u_waterTex, waterTexCoords + (normalTex.rg * u_distorsion_amount));
      vec4 edgeTex = texture2D(u_edgeTex, waterTexCoords + (normalTex.rg * u_distorsion_amount));
  
      float edge = pow((v_color.r + edgeTex.r) * v_color.r, 2.0);
      edge = saturate(1.0 - smoothstep(u_edgeParam.x - u_edgeParam.y, u_edgeParam.x + u_edgeParam.y, edge));
      vec4 finalCol = mix(waterTex, u_edgeColor, edge);
  
      gl_FragColor = finalCol;
    }
    `;

Shader.create("water", vertexSource, fragmentSource);

export class WaterMaterial extends BaseMaterial {
  private static _waterSpeed = ShaderProperty.getByName("u_water_speed");
  private static _edgeColor = ShaderProperty.getByName("u_edgeColor");
  private static _edgeParam = ShaderProperty.getByName("u_edgeParam");
  private static _distorsionAmount = ShaderProperty.getByName("u_distorsion_amount");
  private static _distorsionSpeed = ShaderProperty.getByName("u_distorsion_speed");

  static _normalTextureProp = ShaderProperty.getByName("u_normalTex");
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
