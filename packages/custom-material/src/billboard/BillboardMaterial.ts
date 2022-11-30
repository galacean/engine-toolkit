import { Shader, Engine, BaseMaterial, Vector2, Vector3 } from "oasis-engine";

const vertexSource = `
uniform mat4 u_VPMat;

uniform vec2 u_canvasSize;
uniform vec2 u_textureSize;
uniform vec3 u_originWorldPos;
uniform float u_scale;

attribute vec3 POSITION;
attribute vec2 TEXCOORD_0;
attribute vec4 COLOR_0;

varying vec2 v_uv;
varying vec4 v_color;

void main()
{
  float ratioX = 1.0 / u_canvasSize.x;
  float ratioY = 1.0 / u_canvasSize.y;
  float halfWidth = u_textureSize.x * ratioX;
  float halfHeight = u_textureSize.y * ratioY;
  vec4 originPos = u_VPMat * vec4(u_originWorldPos, 1.0);
  float alpha = 1.0;
  float scale = 1.0;

  #ifdef RENDER_MODE_3D
    #ifdef CAMERA_ORTHO
      scale = u_scale;
    #else
      scale = 5.0 / originPos.w;
    #endif
    halfWidth *= scale;
    halfHeight *= scale;
    if (halfHeight > 0.3) {
      alpha = 1.0 - (halfHeight - 0.3) * 0.5;
    }
  #endif

  originPos /= originPos.w;
  // top-left
  if (POSITION.x < u_originWorldPos.x && POSITION.y > u_originWorldPos.y) {
    gl_Position = vec4(originPos.x - halfWidth, originPos.y + halfHeight, originPos.z, 1.0);
  }
  // top-right
  if (POSITION.x > u_originWorldPos.x && POSITION.y > u_originWorldPos.y) {
    gl_Position = vec4(originPos.x + halfWidth, originPos.y + halfHeight, originPos.z, 1.0);
  }
  // bottom-left
  if (POSITION.x < u_originWorldPos.x && POSITION.y < u_originWorldPos.y) {
    gl_Position = vec4(originPos.x - halfWidth, originPos.y - halfHeight, originPos.z, 1.0);
  }
  if (POSITION.x > u_originWorldPos.x && POSITION.y < u_originWorldPos.y) {
    gl_Position = vec4(originPos.x + halfWidth, originPos.y - halfHeight, originPos.z, 1.0);
  }

  v_uv = TEXCOORD_0;
  v_color = COLOR_0;
  v_color.a = alpha;
}
    `;

const fragmentSource = `
uniform sampler2D u_spriteTexture;

varying vec2 v_uv;
varying vec4 v_color;

void main()
{
  vec4 baseColor = texture2D(u_spriteTexture, v_uv);
  gl_FragColor = baseColor * v_color;
}
    `;

Shader.create("billboard", vertexSource, fragmentSource);

export class BillboardMaterial extends BaseMaterial {
  private static _scale = Shader.getPropertyByName("u_scale");
  private static _originPos = Shader.getPropertyByName("u_originWorldPos");
  private static _textureSize = Shader.getPropertyByName("u_textureSize");
  private static _canvasSize = Shader.getPropertyByName("u_canvasSize");

  /**
   * scale of the texture
   */
  get scale(): number {
    return this.shaderData.getFloat(BillboardMaterial._scale);
  }

  set scale(val: number) {
    this.shaderData.setFloat(BillboardMaterial._scale, val);
  }
  /**
   * canvas size
   */
  get canvasSize(): Vector2 {
    return this.shaderData.getVector2(BillboardMaterial._canvasSize);
  }

  set canvasSize(val: Vector2) {
    this.shaderData.setVector2(BillboardMaterial._canvasSize, val);
  }
  /**
   * texture size
   */
  get textureSize(): Vector2 {
    return this.shaderData.getVector2(BillboardMaterial._textureSize);
  }

  set textureSize(val: Vector2) {
    this.shaderData.setVector2(BillboardMaterial._textureSize, val);
  }
  /**
   * origin world position of the texture
   */
  get originPos(): Vector3 {
    return this.shaderData.getVector3(BillboardMaterial._originPos);
  }

  set originPos(val: Vector3) {
    this.shaderData.setVector3(BillboardMaterial._originPos, val);
  }
  /**
   * whether texture size keeps the same regardless of relative postive with camera
   */
  set isFixedSize(mode: boolean) {
    mode ? this.shaderData.disableMacro("RENDER_MODE_3D") : this.shaderData.enableMacro("RENDER_MODE_3D");
  }
  /**
   * whether the camera is ortho or perspective
   */
  set isCameraOrtho(mode: boolean) {
    mode ? this.shaderData.enableMacro("CAMERA_ORTHO") : this.shaderData.disableMacro("CAMERA_ORTHO");
  }

  constructor(engine: Engine) {
    super(engine, Shader.find("billboard"));
    this.shaderData.setFloat(BillboardMaterial._scale, 1.0);
    this.shaderData.setVector2(BillboardMaterial._canvasSize, new Vector2(engine.canvas.width, engine.canvas.height));
    this.shaderData.setVector3(BillboardMaterial._originPos, new Vector3(0, 0, 0));

    this.shaderData.setVector2(BillboardMaterial._textureSize, new Vector2(100, 100));

    this.shaderData.enableMacro("RENDER_MODE_3D");
    this.shaderData.disableMacro("CAMERA_ORTHO");
  }
}
