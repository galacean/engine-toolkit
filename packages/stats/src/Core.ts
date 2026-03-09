import { Engine } from "@galacean/engine";
import DrawCallHook from "./hooks/DrawCallHook";

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
  private readonly engine: Engine;
  private drawCallHook: DrawCallHook;

  private samplingFrames: number = 60;
  private samplingIndex: number = 0;
  private updateCounter: number = 0;
  private updateTime: number = 0;

  constructor(engine: Engine) {
    // @ts-ignore
    const gl = engine._hardwareRenderer.gl;
    this.gl = gl;
    this.engine = engine;
    this.hook(gl);
  }

  private hook(gl: WebGLRenderingContext | WebGL2RenderingContext): void {
    this.drawCallHook = new DrawCallHook(gl);
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

    const renderingStatistics = this.engine.renderingStatistics;
    let data: PerformanceData = {
      fps: Math.round((this.updateCounter * 1000) / (now - this.updateTime)),
      memory: performance.memory && (performance.memory.usedJSHeapSize / 1048576) >> 0,
      drawCall: this.drawCallHook.drawCall,
      triangles: this.drawCallHook.triangles,
      lines: this.drawCallHook.lines,
      points: this.drawCallHook.points,
      textureMemory: formatBytes(renderingStatistics.textureMemory),
      bufferMemory: formatBytes(renderingStatistics.bufferMemory),
      totalGraphicsMemory: formatBytes(renderingStatistics.totalMemory),
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
  textureMemory: string;
  bufferMemory: string;
  totalGraphicsMemory: string;
  webglContext: string;
}

function formatBytes(bytes: number): string {
  const mb = bytes / 1048576;
  return mb.toFixed(2);
}
