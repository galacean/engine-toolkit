import { log } from "../log";

/**
 * @class TextureHook
 */
export default class TextureHook {
  public textures: number = 0;
  private readonly realCreateTexture: any;
  private readonly realDeleteTexture: any;
  private readonly gl: WebGLRenderingContext | WebGL2RenderingContext;
  private hooked: boolean;

  constructor(gl: WebGLRenderingContext | WebGL2RenderingContext) {
    this.realCreateTexture = gl.createTexture;
    this.realDeleteTexture = gl.deleteTexture;

    gl.createTexture = this.hookedCreateTexture.bind(this);
    gl.deleteTexture = this.hookedDeleteTexture.bind(this);

    this.hooked = true;
    this.gl = gl;

    log(`Texture is hooked.`);
  }

  private hookedCreateTexture(): void {
    let texture = this.realCreateTexture.call(this.gl);

    this.textures++;

    log(`CreateTexture:`, texture, `textures: ${this.textures}`);

    return texture;
  }

  private hookedDeleteTexture(texture: any): void {
    this.realDeleteTexture.call(this.gl, texture);

    this.textures--;

    log(`DeleteTexture. textures: ${this.textures}`);
  }

  public reset(): void {
    this.textures = 0;
  }

  public release(): void {
    if (this.hooked) {
      this.gl.createTexture = this.realCreateTexture;
      this.gl.deleteTexture = this.realDeleteTexture;
    }

    this.hooked = false;
  }
}
