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

@dependentComponents(Camera)
export class OutlineManager extends Script {
  private static _outlineColorProp = Shader.getPropertyByName("u_outlineColor");
  private static _texSizeProp = Shader.getPropertyByName("u_texSize");

  private _material: BaseMaterial;
  private _renderTarget: RenderTarget;
  private _root: Entity;
  private _outlineRoot: Entity;
  private _screenEntity: Entity;

  get color(): Color {
    return this._material.shaderData.getColor(OutlineManager._outlineColorProp);
  }

  set color(value: Color) {
    this._material.shaderData.setColor(OutlineManager._outlineColorProp, value);
  }

  constructor(entity: Entity) {
    super(entity);
    const { width, height } = this.engine.canvas;
    const halfWidth = width / 1.5;
    const halfHeight = height / 1.5;
    const engine = this.engine;
    const scene = engine.sceneManager.activeScene;
    const material = new BaseMaterial(this.engine, Shader.find("outline-postprocess-shader"));

    const renderColorTexture = new Texture2D(engine, halfWidth, halfHeight);
    const renderTarget = new RenderTarget(engine, halfWidth, halfHeight, renderColorTexture);
    const outlineRoot = scene.createRootEntity();
    const screenEntity = scene.createRootEntity("screen");
    const screenRenderer = screenEntity.addComponent(MeshRenderer);

    screenRenderer.mesh = PrimitiveMesh.createPlane(engine, 2, 2);
    screenRenderer.setMaterial(material);
    material.isTransparent = true;
    material.shaderData.setTexture("u_texture", renderColorTexture);
    material.shaderData.setColor(OutlineManager._outlineColorProp, new Color(0, 0, 0, 1));
    material.shaderData.setVector2(OutlineManager._texSizeProp, new Vector2(1 / width, 1 / height));

    this._material = material;
    this._renderTarget = renderTarget;
    this._outlineRoot = outlineRoot;
    this._screenEntity = screenEntity;
    this._root = scene.getRootEntity();
  }

  clear() {
    this._outlineRoot.clearChildren();
  }

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

    this._root.isActive = true;
    camera.clearFlags = originalClearFlags;
    camera.enableFrustumCulling = originalEnableFrustumCulling;
  }

  /** @internal */
  onDestroy() {
    this._outlineRoot.destroy();
    this._renderTarget.getColorTexture().destroy();
    this._renderTarget.destroy();
  }
}

Shader.create("outline-postprocess-shader", vs, fs);
