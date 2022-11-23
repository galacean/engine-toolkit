import { BaseMaterial, Color, Engine, MathUtil, Shader, Texture2D, Vector2 } from "oasis-engine";

const vertexSource = `
 uniform mat4 u_MVPMat;

 uniform sampler2D _FoamTex;
 uniform vec4 _FoamTex_ST;
 uniform sampler2D _NormalTex;
 uniform vec4 _NormalTex_ST;

 attribute vec3 POSITION;
 attribute vec2 TEXCOORD_0;

 varying vec2 FoamTexCoord;
 varying vec2 NormalTexCoord;
 varying vec2 v_uv;
 varying vec3 v_position;

 void main() {
   gl_Position = u_MVPMat  *  vec4( POSITION, 1.0 );

   FoamTexCoord =  gl_MultiTexCoord0.xy * _FoamTex_ST.xy + _FoamTex_ST.zw;
   NormalTexCoord =  gl_MultiTexCoord1.xy * _NormalTex_ST.xy + _NormalTex_ST.zw;

   v_uv = TEXCOORD_0;
   v_position = POSITION;
 }
  `;

const fragSource = `
 varying vec2 v_uv;
 varying vec3 v_position;
 varying vec2 TextureCoord
 varying vec2 FoamTexCoord;
 varying vec2 NormalTexCoord;

 uniform vec4 u_color;
 uniform float u_time;

 uniform sampler2D _FoamTex;
 uniform sampler2D _NormalTex;

 uniform float u_foam_speed_x;
 uniform float u_foam_speed_y;
 uniform float u_foam_amount;
 uniform float u_foam_smoothness

 uniform float u_distorsion_speed_x;
 uniform float u_distorsion_speed_y;
 uniform float u_distorsion_amount;

 void main (void) {
    vec4 color = u_color;

    #ifdef TEXTURE
    vec2 foamUV = texture2D(_FoamTex,FoamTexCoord)
  #endif

    #ifdef NORMALTEXTURE
    vec2 normalUV = texture2D(_NormalTex,NormalTexCoord)
  #endif

    vec2 mov_foam = foamUV + vec2(u_time * u_foam_speed_x, u_time * u_foam_speed_y)
    vec2 mov_normal = normalUV + vec2(cos(u_time) * u_distorsion_speed_x,sin(u_time) * u_distorsion_speed_y)

    vec4 normal = texture2D(_NormalTex, mov_normal) * 2.0 - 1.0
    vec4 foam = texture2D(_FoamTex,mov_foam + normal.xy * u_distorsion_amount )

    float alphaComp = u_color.x * foam.x * u_foam_amount
    float alpha = pow(alphaComp,2.0)
    alpha = smoothstep(0.5 - u_foam_smoothness, 0.5 + u_foam_smoothness, alpha)
    alpha = saturate(alpha)

    gl_FragColor = vec4(u_color.x,u_color.y,u_color.z,alpha);
}
`;

Shader.create("ripple", vertexSource, fragSource);

export class RippleMaterial extends BaseMaterial {
  private static _color = Shader.getPropertyByName("u_color");
  private static _foamSpeedX = Shader.getPropertyByName("u_foam_speed_x");
  private static _foamSpeedY = Shader.getPropertyByName("u_foam_speed_y");
  private static _distorsionSpeedX = Shader.getPropertyByName("u_distorsion_speed_x");
  private static _distorsionSpeedY = Shader.getPropertyByName("u_distorsion_speed_y");
  private static _distorsionAmount = Shader.getPropertyByName("u_distorsion_amount");
  private static _foamAmount = Shader.getPropertyByName("u_foam_amount");
  private static _foamSmoothness = Shader.getPropertyByName("u_foam_smoothness");

  static _foamTextureProp = Shader.getPropertyByName("_FoamTex");
  static _normalTextureProp = Shader.getPropertyByName("_NormalTex");
  /**
   * foam texture.
   */
  get foamTexture(): Texture2D {
    return <Texture2D>this.shaderData.getTexture(RippleMaterial._foamTextureProp);
  }

  set foamTexture(value: Texture2D) {
    this.shaderData.setTexture(RippleMaterial._foamTextureProp, value);
    if (value) {
      this.shaderData.enableMacro("TEXTURE");
    } else {
      this.shaderData.disableMacro("TEXTURE");
    }
  }

  /**
   * normal texture.
   */
  get normalTexture(): Texture2D {
    return <Texture2D>this.shaderData.getTexture(RippleMaterial._normalTextureProp);
  }

  set normalTexture(value: Texture2D) {
    this.shaderData.setTexture(RippleMaterial._normalTextureProp, value);
    if (value) {
      this.shaderData.enableMacro("NORMALTEXTURE");
    } else {
      this.shaderData.disableMacro("NORMALTEXTURE");
    }
  }

  /**
   * foam color
   */
  get color(): Color {
    return this.shaderData.getColor(RippleMaterial._color);
  }
  set color(val: Color) {
    this.shaderData.setColor(RippleMaterial._color, val);
  }
  /**
   * foam speed
   */
  get foamSpeed(): Vector2 {
    const x = this.shaderData.getFloat(RippleMaterial._foamSpeedX);
    const y = this.shaderData.getFloat(RippleMaterial._foamSpeedY);
    return new Vector2(x, y);
  }
  set foamSpeed(val: Vector2) {
    this.shaderData.setFloat(RippleMaterial._foamSpeedX, val.x);
    this.shaderData.setFloat(RippleMaterial._foamSpeedY, val.y);
  }

  /**
   * foam amount
   */
  get foamAmount(): number {
    return this.shaderData.getFloat(RippleMaterial._foamAmount);
  }

  set foamAmount(val: number) {
    this.shaderData.setFloat(RippleMaterial._foamAmount, val);
  }
  /**
   * foam smoothness,must bewtween 0 ~ 0.5
   */
  get foamSmoothness(): number {
    return this.shaderData.getFloat(RippleMaterial._foamSmoothness);
  }

  set foamSmoothness(val: number) {
    this.shaderData.setFloat(RippleMaterial._foamSmoothness, MathUtil.clamp(val, 0, 0.5));
  }
  /**
   * distorsion speed
   */
  get distorsionSpeed(): Vector2 {
    const x = this.shaderData.getFloat(RippleMaterial._foamSpeedX);
    const y = this.shaderData.getFloat(RippleMaterial._foamSpeedY);
    return new Vector2(x, y);
  }

  set distorsionSpeed(val: Vector2) {
    this.shaderData.setFloat(RippleMaterial._foamSpeedX, val.x);
    this.shaderData.setFloat(RippleMaterial._foamSpeedY, val.y);
  }
  /**
   * distorsion amount, must bewtween -1 ~ 1
   */
  get distorsionAmount(): number {
    return this.shaderData.getFloat(RippleMaterial._distorsionAmount);
  }

  set distorsionAmount(val: number) {
    this.shaderData.setFloat(RippleMaterial._distorsionAmount, MathUtil.clamp(val, -1, 1));
  }

  constructor(engine: Engine) {
    super(engine, Shader.find("ripple"));
    this.isTransparent = true;
    this.alphaCutoff = 0.5;

    const shaderData = this.shaderData;
    shaderData.setColor(RippleMaterial._color, new Color(1.0, 1.0, 1.0, 1.0));
    shaderData.setFloat(RippleMaterial._foamSpeedX, 0.3);
    shaderData.setFloat(RippleMaterial._foamSpeedY, 0.3);
    shaderData.setFloat(RippleMaterial._distorsionSpeedX, 1);
    shaderData.setFloat(RippleMaterial._distorsionSpeedY, 1);
    shaderData.setFloat(RippleMaterial._distorsionAmount, 0.03);
    shaderData.setFloat(RippleMaterial._foamAmount, 2.0);
    shaderData.setFloat(RippleMaterial._foamSmoothness, 0.05);
  }
}
