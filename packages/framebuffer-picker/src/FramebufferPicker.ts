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
  ShaderProperty,
  SubShader,
  Texture2D,
  TextureFormat,
  Vector2,
  Vector3
} from "@galacean/engine";
import fs from "./color.fs.glsl";
import vs from "./color.vs.glsl";

const pickShader = Shader.create("framebuffer-picker-color", vs, fs);
pickShader.subShaders.forEach((subShader: SubShader) => {
  subShader.passes.forEach((pass) => {
    pass.setTag("spriteDisableBatching", true);
  });
});

/**
 * GPU Frame buffer picker.
 * @decorator `@dependentComponents(Camera, DependentMode.CheckOnly)`
 */
@dependentComponents(Camera, DependentMode.CheckOnly)
export class FramebufferPicker extends Script {
  private static _rootEntityRenderers: Renderer[] = [];
  private static _pickPixel: Uint8Array = new Uint8Array(4);
  private static _pickIds: Set<number> = new Set();
  private static _pickColorProperty = ShaderProperty.getByName("u_pickColor");

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

  override onAwake(): void {
    this._camera = this.entity.getComponent(Camera);
  }

  /**
   * Pick up renderer at screen coordinate.
   * @param x - The x coordinate of screen
   * @param y - The y coordinate of screen
   * @returns Promise<Renderer>
   */
  pick(x: number, y: number): Promise<Renderer> {
    return new Promise((resolve, reject) => {
      this._setupRenderTarget();
      // Pick up renderer
      const pickedPixel = this._readPixelFromRenderTarget(x, y);
      const renderer = this._getRendererByPixel(pickedPixel);
      resolve(renderer);
    });
  }

  /**
   * Pick up renderers in a rectangular region of the screen.
   * @param startX - The start x coordinate of screen
   * @param startY - The start y coordinate of screen
   * @param endX - The end x coordinate of screen
   * @param endY - The end y coordinate of screen
   * @returns Promise<Array<Renderer>>
   */
  regionPick(startX: number, startY: number, endX: number, endY: number): Promise<Array<Renderer>> {
    return new Promise((resolve, reject) => {
      this._setupRenderTarget();
      const pickedPixel = this._readPixelFromRenderTarget(startX, startY, endX, endY);
      const renderer = this._getRenderersByPixel(pickedPixel);
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

  private _setupRenderTarget() {
    // Check frame buffer size
    this._checkFrameBufferSize();

    const camera = this._camera;
    this._updateRenderersPickColor(camera.scene);
    // Prepare render target and shader
    const lastRenderTarget = camera.renderTarget;
    const lastRatio = camera.aspectRatio;
    camera.renderTarget = this._pickRenderTarget;
    camera.setReplacementShader(pickShader);
    camera.aspectRatio = lastRatio;

    camera.render();

    // Revert render target and shader
    camera.resetReplacementShader();
    camera.renderTarget = lastRenderTarget;
    camera.resetAspectRatio();
  }

  private _readPixelFromRenderTarget(x: number, y: number, xEnd?: number, yEnd?: number): Uint8Array {
    let pickPixel: Uint8Array, width: number, height: number;
    const startCoord = this._getCoordOnRenderTarget(x, y);
    const argsLength = arguments.length;

    if (argsLength === 2) {
      pickPixel = FramebufferPicker._pickPixel;
      width = height = 1;
    } else if (argsLength === 4) {
      const endCoord = this._getCoordOnRenderTarget(xEnd, yEnd);

      width = Math.abs(startCoord.x - endCoord.x);
      height = Math.abs(startCoord.y - endCoord.y);

      startCoord.x = startCoord.x < endCoord.x ? startCoord.x : endCoord.x;
      startCoord.y = startCoord.y < endCoord.y ? startCoord.y : endCoord.y;

      pickPixel = new Uint8Array(width * height * 4);
    }
    (<Texture2D>this._pickRenderTarget.getColorTexture()).getPixelBuffer(
      startCoord.x,
      startCoord.y,
      width,
      height,
      0,
      pickPixel
    );
    return pickPixel;
  }

  private _getCoordOnRenderTarget(x: number, y: number): { x: number; y: number } {
    const pickRenderTarget = this._pickRenderTarget;
    const { canvas } = this.engine;

    const viewport = this._camera.viewport;
    const viewWidth = (viewport.z - viewport.x) * canvas.width;
    const viewHeight = (viewport.w - viewport.y) * canvas.height;

    return {
      x: Math.floor(((x - viewport.x) / viewWidth) * (pickRenderTarget.width - 1)),
      y: Math.floor(((y - viewport.y) / viewHeight) * (pickRenderTarget.height - 1))
    };
  }

  private _getRendererByPixel(color: Uint8Array): Renderer {
    return this._renderersMap[this._color2UniqueId(color)];
  }

  private _getRenderersByPixel(color: Uint8Array): Array<Renderer> {
    let pickedRenderers = [];
    const rendererIds = this._color2UniqueIds(color);
    rendererIds.forEach((value) => {
      this._renderersMap[value] && pickedRenderers.push(this._renderersMap[value]);
    });

    return pickedRenderers;
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

  private _color2UniqueIds(color: Uint8Array): Set<number> {
    FramebufferPicker._pickIds.clear();
    for (let i = 0; i < color.length; i += 4) {
      const a = color[i] | (color[i + 1] << 8) | (color[i + 2] << 16);
      FramebufferPicker._pickIds.add(a);
    }
    return FramebufferPicker._pickIds;
  }
}
