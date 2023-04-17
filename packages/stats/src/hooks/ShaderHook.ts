import { log } from "../log";

/**
 * @class ShaderHook
 */
export default class ShaderHook {
  public shaders: number = 0;
  private readonly realAttachShader: any;
  private readonly realDetachShader: any;
  private readonly gl: WebGLRenderingContext | WebGL2RenderingContext;
  private hooked: boolean;

  constructor(gl: WebGLRenderingContext | WebGL2RenderingContext) {
    this.realAttachShader = gl.attachShader;
    this.realDetachShader = gl.detachShader;

    gl.attachShader = this.hookedAttachShader.bind(this);
    gl.detachShader = this.hookedDetachShader.bind(this);

    this.hooked = true;
    this.gl = gl;

    log(`Shader is hooked.`);
  }

  private hookedAttachShader(program: any, shader: any): void {
    this.realAttachShader.call(this.gl, program, shader);

    this.shaders++;

    log(`AttachShader:`, shader, `shaders: ${this.shaders}`);
  }

  private hookedDetachShader(program: any, shader: any): void {
    this.realDetachShader.call(this.gl, program, shader);

    this.shaders--;

    log(`DetachShader. shaders: ${this.shaders}`);
  }

  public reset(): void {
    this.shaders = 0;
  }

  public release(): void {
    if (this.hooked) {
      this.gl.attachShader = this.realAttachShader;
      this.gl.detachShader = this.realDetachShader;
    }

    this.hooked = false;
  }
}
