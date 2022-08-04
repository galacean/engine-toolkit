import {
  BackgroundMode,
  BaseMaterial,
  Camera,
  CameraClearFlags,
  Color,
  dependentComponents,
  Entity,
  Material,
  Matrix,
  MeshRenderer,
  PrimitiveMesh,
  RenderTarget,
  Scene,
  Script,
  Shader,
  Texture2D,
  UnlitMaterial,
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

  private _outlineScene: Scene;
  private _material: BaseMaterial;
  private _replaceMaterial: BaseMaterial;
  private _renderTarget: RenderTarget;
  private _outlineRoot: Entity;
  private _screenEntity: Entity;
  private _size: number = 1;
  private _clearColor: Color = new Color(1, 1, 1, 1);
  private _outlineColor: Color = new Color(0, 0, 0, 1);
  private _replaceColor: Color = new Color(1, 0, 0, 1);
  private _outlineEntities: Entity[] = [];

  private _entityMap = new Map<
    Entity,
    {
      parent: Entity;
      worldMatrix: Matrix;
    }
  >();
  private _materialMap = new Map<MeshRenderer, Material>();
  private _renderers: MeshRenderer[] = [];

  /** outline color. */
  get color(): Color {
    return this._material.shaderData.getColor(OutlineManager._outlineColorProp);
  }

  set color(value: Color) {
    const color = this._material.shaderData.getColor(OutlineManager._outlineColorProp);
    if (value !== color) {
      color.copyFrom(value);
    }
  }

  /** Outline size.[1~6] */
  get size() {
    return this._size;
  }

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

  constructor(entity: Entity) {
    super(entity);
    const engine = this.engine;
    const outlineScene = new Scene(engine);
    const material = new BaseMaterial(engine, Shader.find("outline-postprocess-shader"));
    const replaceMaterial = new UnlitMaterial(engine);
    const outlineRoot = outlineScene.createRootEntity();
    const screenEntity = outlineScene.createRootEntity("screen");
    const screenRenderer = screenEntity.addComponent(MeshRenderer);

    replaceMaterial.baseColor = this._replaceColor;
    screenRenderer.mesh = PrimitiveMesh.createPlane(engine, 2, 2);
    screenRenderer.setMaterial(material);
    material.isTransparent = true;
    material.shaderData.setColor(OutlineManager._outlineColorProp, this._outlineColor);

    this._outlineScene = outlineScene;
    this._material = material;
    this._replaceMaterial = replaceMaterial;
    this._outlineRoot = outlineRoot;
    this._screenEntity = screenEntity;
    this.size = this._size;
  }

  /**
   * Clear all entities you want to outline.
   */
  clear() {
    this._outlineEntities.length = 0;
  }

  /**
   * Add the entity you want to outline.
   * @param entity - The entity you wanna add.
   */
  addEntity(entity: Entity) {
    if (this._outlineEntities.indexOf(entity) === -1) {
      this._outlineEntities.push(entity);
    }
  }

  /** @internal */
  onEndRender(camera: Camera): void {
    if (!this._outlineEntities.length) return;
    const scene = camera.scene;
    const originalClearFlags = camera.clearFlags;
    const originalEnableFrustumCulling = camera.enableFrustumCulling;
    const originalSolidColor = scene.background.solidColor;
    const originalBackgroundMode = scene.background.mode;
    const originalScene = this.engine.sceneManager.activeScene;

    const renderers = this._renderers;
    const materialMap = this._materialMap;
    const entityMap = this._entityMap;
    materialMap.clear();
    entityMap.clear();

    for (let i = 0, length = this._outlineEntities.length; i < length; i++) {
      const entity = this._outlineEntities[i];
      const originalWorldMatrix = entity.transform.worldMatrix.clone();
      const originalParent = entity.parent;

      this._outlineRoot.addChild(entity);
      entity.transform.worldMatrix = originalWorldMatrix;

      entityMap.set(entity, {
        parent: originalParent,
        worldMatrix: originalWorldMatrix
      });

      renderers.length = 0;
      entity.getComponentsIncludeChildren(MeshRenderer, renderers);
      for (let j = 0; j < renderers.length; j++) {
        const renderer = renderers[j];
        materialMap.set(renderer, renderer.getMaterial());
        renderer.setMaterial(this._replaceMaterial);
      }
    }

    this.engine.sceneManager.activeScene = this._outlineScene;
    this._screenEntity.isActive = false;
    this._outlineRoot.isActive = true;
    camera.renderTarget = this._renderTarget;
    scene.background.solidColor = this._clearColor;
    scene.background.mode = BackgroundMode.SolidColor;
    camera.render();

    this._outlineRoot.isActive = false;
    this._screenEntity.isActive = true;
    camera.renderTarget = null;
    camera.clearFlags = CameraClearFlags.None;
    camera.enableFrustumCulling = false;
    camera.render();

    this._screenEntity.isActive = false;
    this.engine.sceneManager.activeScene = originalScene;
    camera.clearFlags = originalClearFlags;
    camera.enableFrustumCulling = originalEnableFrustumCulling;
    scene.background.solidColor = originalSolidColor;
    scene.background.mode = originalBackgroundMode;

    entityMap.forEach(({ parent, worldMatrix }, entity) => {
      if (!parent) {
        scene.addRootEntity(entity);
      } else {
        parent.addChild(entity);
      }
      entity.transform.worldMatrix = worldMatrix;
    });
    materialMap.forEach((material, renderer) => {
      renderer.setMaterial(material);
    });
  }

  /** @internal */
  onDestroy() {
    this._outlineScene.destroy();
    this._renderTarget.getColorTexture().destroy(true);
    this._renderTarget.destroy();
    this._renderers = null;
    this._entityMap = null;
    this._materialMap = null;
  }
}

Shader.create("outline-postprocess-shader", vs, fs);
