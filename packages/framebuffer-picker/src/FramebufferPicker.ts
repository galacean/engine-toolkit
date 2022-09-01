import { Camera, Entity, RenderTarget, Script, Texture2D } from "oasis-engine";
import { ColorRenderPass } from "./ColorRenderPass";

/**
 * Framebuffer picker.
 * @remarks Can pick up renderer at pixel level.
 */
export class FramebufferPicker extends Script {
  public colorRenderTarget: RenderTarget;
  public colorRenderPass: ColorRenderPass;

  private _camera: Camera;
  private _needPick: boolean;
  private _pickPos: [number, number];

  /**
   * Camera.
   */
  get camera(): Camera {
    return this._camera;
  }

  set camera(value: Camera) {
    if (this._camera !== value) {
      this._camera = value;
      //@ts-ignore
      this.camera._renderPipeline.addRenderPass(this.colorRenderPass);
    }
  }

  constructor(entity: Entity) {
    super(entity);
    const width = 1024;
    const height = 1024;
    this.colorRenderTarget = new RenderTarget(this.engine, width, height, new Texture2D(this.engine, width, height));
    this.colorRenderPass = new ColorRenderPass("ColorRenderTarget_FBP", -1, this.colorRenderTarget, 0, this.engine);
  }

  /**
   * Pick the object at the screen coordinate position.
   * @param offsetX - Relative X coordinate of the drawingBuffer
   * @param offsetY - Relative Y coordinate of the drawingBuffer
   */
  pick(offsetX: number, offsetY: number): Promise<any> {
    if (this.enabled) {
      this._needPick = true;
      this._pickPos = [offsetX, offsetY];
      return new Promise((resolve) => {
        this.colorRenderPass._pickResolve = resolve;
      });
    }
  }

  onUpdate(deltaTime: number) {
    super.onUpdate(deltaTime);

    if (this.enabled && this._needPick) {
      this.colorRenderPass.pick(this._pickPos[0], this._pickPos[1]);
      this._needPick = false;
    }
  }

  onDestroy() {
    if (!this.camera.destroyed) {
      //@ts-ignore
      this.camera._renderPipeline.removeRenderPass(this.colorRenderPass);
    }
  }
}
