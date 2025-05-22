import { errorLog, log } from "../log";

/**
 * @class DrawCallHook
 */
export default class DrawCallHook {
  public drawCall: number = 0;
  public triangles: number = 0;
  public lines: number = 0;
  public points: number = 0;
  private hooked: boolean;
  private readonly realDrawElements: any;
  private readonly realDrawArrays: any;
  private readonly realDrawElementsInstanced: any;
  private readonly realDrawArraysInstanced: any;
  private readonly gl: WebGLRenderingContext | WebGL2RenderingContext;

  constructor(gl: WebGLRenderingContext | WebGL2RenderingContext) {
    this.realDrawElements = gl.drawElements;
    this.realDrawArrays = gl.drawArrays;

    gl.drawElements = this.hookedDrawElements.bind(this);
    gl.drawArrays = this.hookedDrawArrays.bind(this);

    const hasInstancedFunc = this.hasInstancedFunction(gl);
    if (hasInstancedFunc) {
      // @ts-ignore
      this.realDrawElementsInstanced = gl.drawElementsInstanced;
      // @ts-ignore
      this.realDrawArraysInstanced = gl.drawArraysInstanced;

      // @ts-ignore
      gl.drawElementsInstanced = this.hookedDrawElementsInstanced.bind(this);
      // @ts-ignore
      gl.drawArraysInstanced = this.hookedDrawArraysInstanced.bind(this);
    } else {
      const extAngleInstancedArrays = gl.getExtension("ANGLE_instanced_arrays");
      if (extAngleInstancedArrays) {
        this.realDrawElementsInstanced = extAngleInstancedArrays.drawElementsInstancedANGLE;
        this.realDrawArraysInstanced = extAngleInstancedArrays.drawArraysInstancedANGLE;

        extAngleInstancedArrays.drawElementsInstancedANGLE = this.hookedDrawElementsInstanced.bind(this);
        extAngleInstancedArrays.drawArraysInstancedANGLE = this.hookedDrawArraysInstanced.bind(this);
      } else {
        errorLog(`GPU Instancing is not supported.`);
      }
    }

    this.hooked = true;
    this.gl = gl;

    log(`DrawCall is hooked.`);
  }

  private hasInstancedFunction(gl: WebGLRenderingContext | WebGL2RenderingContext): boolean {
    return (
      gl instanceof WebGL2RenderingContext ||
      ((gl as any).hasOwnProperty("drawElementsInstanced") && (gl as any).hasOwnProperty("drawArraysInstanced"))
    );
  }

  private hookedDrawElements(mode: number, count: number, type: number, offset: number): void {
    this.realDrawElements.call(this.gl, mode, count, type, offset);
    this.update(count, mode);
  }

  private hookedDrawArrays(mode: number, first: number, count: number): void {
    this.realDrawArrays.call(this.gl, mode, first, count);
    this.update(count, mode);
  }

  private hookedDrawElementsInstanced(
    mode: number,
    count: number,
    type: number,
    offset: number,
    primcount: number
  ): void {
    this.realDrawElementsInstanced.call(this.gl, mode, count, type, offset, primcount);
    this.update(count, mode);
  }

  private hookedDrawArraysInstanced(mode: number, first: number, count: number, primcount: number): void {
    this.realDrawArraysInstanced.call(this.gl, mode, first, count, primcount);
    this.update(count, mode);
  }

  private update(count: number, mode: number): void {
    const { gl } = this;

    this.drawCall++;

    switch (mode) {
      case gl.TRIANGLES:
        this.triangles += count / 3;
        break;

      case gl.TRIANGLE_STRIP:
      case gl.TRIANGLE_FAN:
        this.triangles += count - 2;
        break;

      case gl.LINES:
        this.lines += count / 2;
        break;

      case gl.LINE_STRIP:
        this.lines += count - 1;
        break;

      case gl.LINE_LOOP:
        this.lines += count;
        break;

      case gl.POINTS:
        this.points += count;
        break;

      default:
        errorLog(`Unknown draw mode: ${mode}`);
        break;
    }
  }

  public reset(): void {
    this.drawCall = 0;
    this.triangles = 0;
    this.lines = 0;
    this.points = 0;
  }

  public release(): void {
    if (this.hooked) {
      const { gl } = this;
      gl.drawElements = this.realDrawElements;
      gl.drawArrays = this.realDrawArrays;

      const hasInstancedFunc = this.hasInstancedFunction(gl);
      if (hasInstancedFunc) {
        // @ts-ignore
        gl.drawElementsInstanced = this.realDrawElementsInstanced;
        // @ts-ignore
        gl.drawArraysInstanced = this.realDrawArraysInstanced;
      } else {
        const extAngleInstancedArrays = gl.getExtension("ANGLE_instanced_arrays");
        if (extAngleInstancedArrays) {
          extAngleInstancedArrays.drawElementsInstancedANGLE = this.realDrawElementsInstanced;
          extAngleInstancedArrays.drawArraysInstancedANGLE = this.realDrawArraysInstanced;
        }
      }
    }

    this.hooked = false;
  }
}
