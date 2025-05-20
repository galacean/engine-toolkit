import DrawCallHook from "./hooks/DrawCallHook";
import { RequestHook } from "./hooks/RequestHook";
import ShaderHook from "./hooks/ShaderHook";
import TextureHook from "./hooks/TextureHook";

declare global {
  interface Performance {
    memory: any;
  }
}

/**
 * Hook gl to calculate stats
 */
export class Core {
  private readonly gl: WebGLRenderingContext | WebGL2RenderingContext;
  private drawCallHook: DrawCallHook;
  private textureHook: TextureHook;
  private shaderHook: ShaderHook;
  private requestHook: RequestHook;
  private samplingFrames: number = 60;
  private samplingIndex: number = 0;
  private updateCounter: number = 0;
  private updateTime: number = 0;

  constructor(gl: WebGLRenderingContext | WebGL2RenderingContext) {
    this.gl = gl;
    this.hook(gl);
  }

  private hook(gl: WebGLRenderingContext | WebGL2RenderingContext): void {
    this.drawCallHook = new DrawCallHook(gl);
    this.textureHook = new TextureHook(gl);
    this.shaderHook = new ShaderHook(gl);
    this.requestHook = new RequestHook();
  }

  /**
   * reset draw call hook
   */
  public reset(): void {
    this.drawCallHook && this.drawCallHook.reset();
  }

  /**
   * release hook
   */
  public release(): void {
    this.drawCallHook && this.drawCallHook.release();
    this.textureHook && this.textureHook.release();
    this.shaderHook && this.shaderHook.release();
  }

  /**
   * update performance data
   */
  public update(): PerformanceData {
    this.updateCounter++;
    let now = performance.now();
    if (now - this.updateTime < 1000) {
      return;
    }

    if (this.samplingIndex !== this.samplingFrames) {
      this.reset();
      this.samplingIndex++;
      return;
    }

    this.samplingIndex = 0;

    let data: PerformanceData = {
      fps: Math.round((this.updateCounter * 1000) / (now - this.updateTime)),
      memory: performance.memory && (performance.memory.usedJSHeapSize / 1048576) >> 0,
      drawCall: this.drawCallHook.drawCall,
      triangles: this.drawCallHook.triangles,
      lines: this.drawCallHook.lines,
      points: this.drawCallHook.points,
      textures: this.textureHook.textures,
      size: this.requestHook.size,
      shaders: this.shaderHook.shaders,
      webglContext:
        window.hasOwnProperty("WebGL2RenderingContext") && this.gl instanceof WebGL2RenderingContext ? "2.0" : "1.0"
    };

    this.reset();

    this.updateCounter = 0;
    this.updateTime = now;

    return data;
  }
}

interface PerformanceData {
  fps: number;
  memory: number;
  drawCall: number;
  triangles: number;
  lines: number;
  points: number;
  textures: number;
  shaders: number;
  size: string;
  webglContext: string;
}
