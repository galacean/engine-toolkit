import {
  Camera,
  dependentComponents,
  Logger,
  Renderer,
  RenderTarget,
  Scene,
  Script,
  Shader,
  Texture2D,
  Vector3
} from "oasis-engine";
import fs from "./color.fs.glsl";
import vs from "./color.vs.glsl";

const pickShader = Shader.create("framebuffer-picker-color", vs, fs);

/**
 * Framebuffer picker.
 * @remarks Can pick up renderer at pixel level.
 */
dependentComponents(Camera);
export class FramebufferPicker extends Script {
  private static _rootEntityRenderers: Renderer[] = [];
  private static _pickPixel = new Uint8Array(4);

  private _renderersMap: Renderer[] = [];
  private _camera: Camera;
  private _pickRenderTarget: RenderTarget;

  /**
   * @override
   */
  onAwake(): void {
    const width = 1024;
    const height = 1024;
    const pickRenderTarget = new RenderTarget(this.engine, width, height, new Texture2D(this.engine, width, height));
    const camera = this.entity.getComponent(Camera);
    this._pickRenderTarget = pickRenderTarget;
    this._camera = camera;
  }

  /**
   * Pick up renderer at screen coordinate.
   * @param x - The x coordinate of screen
   * @param y - The y coordinate of screen
   * @returns Pike up renderer
   */
  pick(x: number, y: number): Renderer {
    const camera = this._camera;
    if (camera) {
      this._updateRenderersPickColor(camera.scene);
      // Prepare render target and shader
      const lastRenderTarget = camera.renderTarget;
      camera.renderTarget = this._pickRenderTarget;
      camera.setReplacementShader(pickShader);

      camera.render();

      // Revert render target and shader
      camera.resetReplacementShader();
      camera.renderTarget = lastRenderTarget;

      // Pick up renderer
      const pickPixel = this._readColorFromRenderTarget(camera, x, y);
      return this._getRendererByPixel(pickPixel);
    }
    return null;
  }

  private _updateRenderersPickColor(scene: Scene): void {
    let currentRendererIndex = 0;

    const renderersMap = this._renderersMap;
    const rootEntityRenderers = FramebufferPicker._rootEntityRenderers;
    const { rootEntities } = scene;

    for (let i = 0, n = rootEntities.length; i < n; i++) {
      rootEntities[i].getComponentsIncludeChildren(Renderer, rootEntityRenderers);
      for (let j = 0, m = rootEntityRenderers.length; j < m; j++) {
        const renderer = rootEntityRenderers[j];
        renderer.shaderData.setVector3("u_colorId", this._id2Color(++currentRendererIndex));
        renderersMap[currentRendererIndex] = renderer;
      }
    }
  }

  private _readColorFromRenderTarget(camera: Camera, x: number, y: number): Uint8Array {
    const pickRenderTarget = this._pickRenderTarget;
    const { canvas } = this.engine;

    const viewport = camera.viewport;
    const viewWidth = (viewport.z - viewport.x) * canvas.width;
    const viewHeight = (viewport.w - viewport.y) * canvas.height;

    const nx = (x - viewport.x) / viewWidth;
    const ny = (y - viewport.y) / viewHeight;
    const left = Math.floor(nx * (pickRenderTarget.width - 1));
    const bottom = Math.floor((1 - ny) * (pickRenderTarget.height - 1));

    const pickPixel = FramebufferPicker._pickPixel;
    (<Texture2D>pickRenderTarget.getColorTexture()).getPixelBuffer(left, bottom, 1, 1, 0, pickPixel);
    return pickPixel;
  }

  private _getRendererByPixel(color: Uint8Array): Renderer {
    return this._renderersMap[this._color2Id(color)];
  }

  private _id2Color(id: number): Vector3 {
    if (id >= 0xffffff) {
      Logger.warn("Framebuffer Picker encounter primitive's id greater than " + 0xffffff);
      return new Vector3(0, 0, 0);
    }

    const color = new Vector3((id & 0xff) / 255, ((id & 0xff00) >> 8) / 255, ((id & 0xff0000) >> 16) / 255);
    return color;
  }

  private _color2Id(pixel: Uint8Array): number {
    return pixel[0] | (pixel[1] << 8) | (pixel[2] << 16);
  }
}
