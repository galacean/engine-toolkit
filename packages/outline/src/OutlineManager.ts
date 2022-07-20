import {
  BaseMaterial,
  Camera,
  CameraClearFlags,
  Color,
  dependentComponents,
  Entity,
  MeshRenderer,
  PrimitiveMesh,
  RenderTarget,
  Script,
  Shader,
  Texture2D,
  Vector2
} from "oasis-engine";
import fs from "./outline.fs.glsl";
import vs from "./outline.vs.glsl";

/**
 * Show outline of entities.
 * @decorator `@dependentComponents(Camera)`
 */
@dependentComponents(Camera)
export class OutlineManager extends Script {
  private static _outlineColorProp = Shader.getPropertyByName("u_outlineColor");
  private static _texSizeProp = Shader.getPropertyByName("u_texSize");

  private _material: BaseMaterial;
  private _renderTarget: RenderTarget;
  private _root: Entity;
  private _outlineRoot: Entity;
  private _screenEntity: Entity;
  private _size: number = 2;

  /** outline color. */
  get color(): Color {
    return this._material.shaderData.getColor(OutlineManager._outlineColorProp);
  }

  set color(value: Color) {
    this._material.shaderData.setColor(OutlineManager._outlineColorProp, value);
  }

  /** Outline size.[1~6] */
  set size(value: number) {
    value = Math.max(1, Math.min(value, 6));
    this._size = value;

    if (this._renderTarget) {
      this._renderTarget.getColorTexture().destroy(true);
      this._renderTarget.destroy();
    }
    const { width, height } = this.engine.canvas;
    const offWidth = width / value;
    const offHeight = height / value;
    const renderColorTexture = new Texture2D(this.engine, offWidth, offHeight);
    const renderTarget = new RenderTarget(this.engine, offWidth, offHeight, renderColorTexture);

    this._material.shaderData.setTexture("u_texture", renderColorTexture);
    this._material.shaderData.setVector2(OutlineManager._texSizeProp, new Vector2(1 / offWidth, 1 / offHeight));

    this._renderTarget = renderTarget;
  }

  get size() {
    return this._size;
  }

  constructor(entity: Entity) {
    super(entity);
    const engine = this.engine;
    const scene = engine.sceneManager.activeScene;
    const material = new BaseMaterial(this.engine, Shader.find("outline-postprocess-shader"));

    const outlineRoot = scene.createRootEntity();
    const screenEntity = scene.createRootEntity("screen");
    const screenRenderer = screenEntity.addComponent(MeshRenderer);

    screenRenderer.mesh = PrimitiveMesh.createPlane(engine, 2, 2);
    screenRenderer.setMaterial(material);
    material.isTransparent = true;
    material.shaderData.setColor(OutlineManager._outlineColorProp, new Color(0, 0, 0, 1));

    this._material = material;
    this._outlineRoot = outlineRoot;
    this._screenEntity = screenEntity;
    this._root = scene.getRootEntity();
    this.size = this._size;
  }

  /**
   * Clear all entities you want to outline.
   */
  clear() {
    const children = this._outlineRoot.children;
    for (let i = 0, length = children.length; i < length; i++) {
      const child = children[i];
      child.destroy();
    }
  }

  /**
   * Add the entity you want to outline.
   * @param entity - The entity you wanna add.
   */
  addEntity(entity: Entity) {
    this._outlineRoot.addChild(entity.clone());
  }

  /** @internal */
  onEndRender(camera: Camera): void {
    const originalClearFlags = camera.clearFlags;
    const originalEnableFrustumCulling = camera.enableFrustumCulling;

    this._root.isActive = false;
    this._screenEntity.isActive = false;
    this._outlineRoot.isActive = true;
    camera.renderTarget = this._renderTarget;
    camera.render();

    this._outlineRoot.isActive = false;
    this._screenEntity.isActive = true;
    camera.renderTarget = null;
    camera.clearFlags = CameraClearFlags.None;
    camera.enableFrustumCulling = false;
    camera.render();

    this._screenEntity.isActive = false;
    this._root.isActive = true;
    camera.clearFlags = originalClearFlags;
    camera.enableFrustumCulling = originalEnableFrustumCulling;
  }

  /** @internal */
  onDestroy() {
    this._outlineRoot.destroy();
    this._screenEntity.destroy();
    this._renderTarget.getColorTexture().destroy(true);
    this._renderTarget.destroy();
  }
}

Shader.create("outline-postprocess-shader", vs, fs);
