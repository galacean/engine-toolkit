import { Shader, Texture2D, Engine, BaseMaterial, Vector2, Vector4 } "@galacean/engine";

const vertexSource = `
    attribute vec3 POSITION;
    attribute vec2 TEXCOORD_0;
    attribute vec4 COLOR_0;
  
    uniform mat4 u_MVPMat;
    
    uniform float u_time;
    uniform vec2 u_water_speed; 
    uniform vec2 u_waterfall_speed; 
    uniform vec2 u_distorsion_speed; 
  
    varying vec2 waterTexCoords;
    varying vec2 waterfallTexCoords;
    varying vec2 normalTexCoords;
    varying vec4 v_color;

    void main() {
      gl_Position = u_MVPMat * vec4(POSITION, 1.0);
  
      waterTexCoords = TEXCOORD_0 + vec2(u_water_speed.x * u_time, u_water_speed.y * u_time);
      waterfallTexCoords = TEXCOORD_0 + vec2(u_waterfall_speed.x * u_time, u_waterfall_speed.y * u_time);
      normalTexCoords = TEXCOORD_0 + vec2(u_distorsion_speed.x * cos(u_time), u_distorsion_speed.y * sin(u_time));    
      
      v_color = COLOR_0; 
    }
    `;

const fragmentSource = `
    #include <common>
    varying vec4 v_color;
    varying vec2 waterTexCoords;
    varying vec2 waterfallTexCoords;
    varying vec2 normalTexCoords;
  
    uniform sampler2D u_normalTex;
    uniform sampler2D u_waterTex;
    uniform sampler2D u_waterfallTex;
    uniform sampler2D u_edgeNoiseTex;
  
    uniform vec4 u_edgeColor;
    uniform vec2 u_edgeParam;
    uniform float u_distorsion_amount;
  
    void main() {      
      vec4 normalTex = texture2D(u_normalTex, normalTexCoords) * 2.0 - 1.0;
      
      vec4 waterTex = texture2D(u_waterTex, waterTexCoords + (normalTex.rg * u_distorsion_amount));
      vec4 waterfallTex = texture2D(u_waterfallTex, waterfallTexCoords + (normalTex.rg * u_distorsion_amount));
  
      vec4 streamEdge = texture2D(u_edgeNoiseTex, waterTexCoords);
      vec4 fallEdge = texture2D(u_edgeNoiseTex, waterfallTexCoords);
  
      float edgeShape = mix(fallEdge.r, streamEdge.r, v_color.r);
      edgeShape = saturate(edgeShape * v_color.g);
      edgeShape = saturate(smoothstep(u_edgeParam.x - u_edgeParam.y, u_edgeParam.x + u_edgeParam.y, edgeShape));
  
      vec4 waterAll = mix(waterfallTex, waterTex, v_color.r);
      vec4 finalCol = mix(waterAll, u_edgeColor, edgeShape);
  
      gl_FragColor = finalCol;
    }
    `;

Shader.create("water-fall", vertexSource, fragmentSource);

export class WaterFallMaterial extends BaseMaterial {
  private static _waterSpeed = Shader.getPropertyByName("u_water_speed");
  private static _waterfallSpeed = Shader.getPropertyByName("u_waterfall_speed");
  private static _distorsionSpeed = Shader.getPropertyByName("u_distorsion_speed");

  private static _edgeColor = Shader.getPropertyByName("u_edgeColor");
  private static _edgeParam = Shader.getPropertyByName("u_edgeParam");
  private static _distorsionAmount = Shader.getPropertyByName("u_distorsion_amount");

  static _normalTextureProp = Shader.getPropertyByName("u_normalTex");
  static _waterTextureProp = Shader.getPropertyByName("u_waterTex");
  static _waterfallTextureProp = Shader.getPropertyByName("u_waterfallTex");
  static _edgeTextureProp = Shader.getPropertyByName("u_edgeNoiseTex");

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
