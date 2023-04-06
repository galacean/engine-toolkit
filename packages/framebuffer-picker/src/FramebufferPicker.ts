import {
  Camera,
  dependentComponents,
  DependentMode,
  Logger,
  Renderer,
  RenderTarget,
  Scene,
  Script,
  Shader,
  Texture2D,
  TextureFormat,
  Vector2,
  Vector3
} from "@galacean/engine";
import fs from "./color.fs.glsl";
import vs from "./color.vs.glsl";

const pickShader = Shader.create("framebuffer-picker-color", vs, fs);

/**
 * GPU Frame buffer picker.
 * @decorator `@dependentComponents(Camera, DependentMode.CheckOnly)`
 */
@dependentComponents(Camera, DependentMode.CheckOnly)
export class FramebufferPicker extends Script {
  private static _rootEntityRenderers: Renderer[] = [];
  private static _pickPixel = new Uint8Array(4);
  private static _pickColorProperty = Shader.getPropertyByName("u_pickColor");

  private _renderersMap: Renderer[] = [];
  private _camera: Camera;
  private _pickRenderTarget: RenderTarget;
  private _frameBufferSize: Vector2 = new Vector2(1024, 1024);

  get frameBufferSize(): Vector2 {
    return this._frameBufferSize;
  }

  set frameBufferSize(value: Vector2) {
    this._frameBufferSize = value;
  }

  /**
   * @override
   */
  onAwake(): void {
    const camera = this.entity.getComponent(Camera);
    this._camera = camera;
  }

  /**
   * Pick up renderer at screen coordinate.
   * @param x - The x coordinate of screen
   * @param y - The y coordinate of screen
   * @returns Promise<Renderer>
   */
  pick(x: number, y: number): Promise<Renderer> {
    return new Promise((resolve, reject) => {
      // Check frame buffer size
      this._checkFrameBufferSize();

      const camera = this._camera;
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
      const pickedPixel = this._readPixelFromRenderTarget(camera, x, y);
      const renderer = this._getRendererByPixel(pickedPixel);
      resolve(renderer);
    });
  }

  private _checkFrameBufferSize(): void {
    const pickRenderTarget = this._pickRenderTarget;
    const engine = this.engine;
    const size = this._frameBufferSize;

    if (!pickRenderTarget || size.x != pickRenderTarget.width || size.y != pickRenderTarget.height) {
      pickRenderTarget && pickRenderTarget.destroy();
      this._pickRenderTarget = new RenderTarget(
        engine,
        size.x,
        size.y,
        new Texture2D(engine, size.x, size.y, TextureFormat.R8G8B8A8, false)
      );
    }
  }

  private _updateRenderersPickColor(scene: Scene): void {
    let currentRendererIndex = 0;

    const renderersMap = this._renderersMap;
    const rootEntityRenderers = FramebufferPicker._rootEntityRenderers;
    const { rootEntities } = scene;
    const pickColorProperty = FramebufferPicker._pickColorProperty;

    for (let i = 0, n = rootEntities.length; i < n; i++) {
      rootEntities[i].getComponentsIncludeChildren(Renderer, rootEntityRenderers);
      for (let j = 0, m = rootEntityRenderers.length; j < m; j++) {
        const renderer = rootEntityRenderers[j];
        const shaderData = renderer.shaderData;

        // Init pick color
        let pickColor = shaderData.getVector3(pickColorProperty);
        if (!pickColor) {
          pickColor = new Vector3();
          shaderData.setVector3(pickColorProperty, pickColor);
        }

        // Set pick color
        this._uniqueId2Color(++currentRendererIndex, pickColor);

        renderersMap[currentRendererIndex] = renderer;
      }
    }
  }

  private _readPixelFromRenderTarget(camera: Camera, x: number, y: number): Uint8Array {
    const pickRenderTarget = this._pickRenderTarget;
    const { canvas } = this.engine;

    const viewport = camera.viewport;
    const viewWidth = (viewport.z - viewport.x) * canvas.width;
    const viewHeight = (viewport.w - viewport.y) * canvas.height;

    const left = Math.floor(((x - viewport.x) / viewWidth) * (pickRenderTarget.width - 1));
    const bottom = Math.floor((1 - (y - viewport.y) / viewHeight) * (pickRenderTarget.height - 1));

    const pickPixel = FramebufferPicker._pickPixel;
    (<Texture2D>pickRenderTarget.getColorTexture()).getPixelBuffer(left, bottom, 1, 1, 0, pickPixel);
    return pickPixel;
  }

  private _getRendererByPixel(color: Uint8Array): Renderer {
    return this._renderersMap[this._color2UniqueId(color)];
  }

  private _uniqueId2Color(uniqueId: number, outColor: Vector3): void {
    if (uniqueId >= 0xffffff) {
      Logger.warn("Framebuffer Picker encounter primitive's id greater than " + 0xffffff);
      outColor.set(0, 0, 0);
    }

    outColor.set((uniqueId & 0xff) / 255, ((uniqueId & 0xff00) >> 8) / 255, ((uniqueId & 0xff0000) >> 16) / 255);
  }

  private _color2UniqueId(color: Uint8Array): number {
    return color[0] | (color[1] << 8) | (color[2] << 16);
  }
}
