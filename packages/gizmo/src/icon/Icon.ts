import {
  AssetType,
  Camera,
  Entity,
  MeshRenderer,
  MeshTopology,
  ModelMesh,
  Script,
  SubMesh,
  Texture2D,
  Vector2,
  Vector3,
  Vector4
} from "@galacean/engine";
import { IconMaterial } from "./IconMaterial";

/**
 * Viewport Icon 只能被一个 Viewport Camera 观测
 */
export class Icon extends Script {
  // 观测此 Icon 的相机
  private _camera: Camera;
  // 缩放模式
  private _scaleMode: IconScaleMode = IconScaleMode.Screen;
  // 若缩放模式为 world ，则此值为世界空间中的尺寸，若缩放模式为 screen，则此值为屏幕空间中的尺寸
  private _size: Vector2 = new Vector2(1, 1);
  private _material: IconMaterial;
  private _renderer: MeshRenderer;
  private _pixelViewport: Vector4 = new Vector4();
  private _texture: string | Texture2D;

  get material(): IconMaterial {
    return this._material;
  }

  get size(): Vector2 {
    return this._size;
  }

  set size(val: Vector2) {
    if (this._size !== val) {
      this._size.copyFrom(val);
    }
    this._material.shaderData.setVector2("u_size", this._size);
  }

  get texture(): string | Texture2D {
    return this._texture;
  }

  set texture(value: string | Texture2D) {
    if (this._texture !== value) {
      this._texture = value;
      if (value instanceof Texture2D) {
        this._material.baseTexture = value;
      } else {
        this.engine.resourceManager.load({ url: value, type: AssetType.Texture2D }).then((texture: Texture2D) => {
          this._material.baseTexture = texture;
        });
      }
    }
  }

  constructor(entity: Entity) {
    super(entity);
    const engine = this._engine;
    const meshRenderer = entity.addComponent(MeshRenderer);
    this._renderer = meshRenderer;
    //  2 ---- 3
    //  |      |
    //  0 ---- 1
    //  0-1-2, 2-1-3
    const mesh = new ModelMesh(engine);
    mesh.setPositions([
      new Vector3(-0.5, -0.5, 0),
      new Vector3(0.5, -0.5, 0),
      new Vector3(-0.5, 0.5, 0),
      new Vector3(0.5, 0.5, 0)
    ]);
    mesh.setUVs([new Vector2(0, 0), new Vector2(1, 0), new Vector2(0, 1), new Vector2(1, 1)]);
    mesh.setIndices(new Uint8Array([0, 1, 2, 2, 1, 3]));
    mesh.bounds.min.set(-Number.MAX_SAFE_INTEGER, -Number.MAX_SAFE_INTEGER, -Number.MAX_SAFE_INTEGER);
    mesh.bounds.max.set(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
    mesh.addSubMesh(new SubMesh(0, 6, MeshTopology.Triangles));
    mesh.uploadData(true);
    meshRenderer.mesh = mesh;
    meshRenderer.priority = 1;
    const iconMaterial = new IconMaterial(engine);
    iconMaterial.renderState.depthState.enabled = false;
    iconMaterial.isTransparent = true;
    meshRenderer.setMaterial(iconMaterial);
    this._material = iconMaterial;
    iconMaterial.shaderData.setVector2("u_size", this._size);
    meshRenderer.enabled = false;
  }

  registerIconToViewportCamera(camera: Camera): void {
    if (this._camera !== camera) {
      this._camera = camera;
      this._renderer.enabled = !!camera;
    }
  }

  override onUpdate(deltaTime: number): void {
    const { _camera: camera, _material: material } = this;
    if (!camera || !material) {
      return;
    }
    // 传递屏幕的像素尺寸，从而保持 Icon 的像素尺寸大小不变
    const shaderData = material.shaderData;
    const cameraPixelViewport = camera.pixelViewport;
    const pixelViewport = this._pixelViewport;
    pixelViewport.set(
      cameraPixelViewport.x,
      cameraPixelViewport.y,
      cameraPixelViewport.width,
      cameraPixelViewport.height
    );
    shaderData.setVector4("u_pixelViewport", pixelViewport);
  }
}

export enum IconScaleMode {
  World,
  Screen
}
