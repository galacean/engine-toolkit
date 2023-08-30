import {
  BackgroundMode,
  BaseMaterial,
  Camera,
  CameraClearFlags,
  Color,
  DependentMode,
  Entity,
  Layer,
  MeshRenderer,
  PrimitiveMesh,
  RenderTarget,
  Script,
  Shader,
  ShaderProperty,
  Texture2D,
  TextureWrapMode,
  Vector2,
  Vector4,
  dependentComponents
} from "@galacean/engine";

import outlineFs from "./outline.fs.glsl";
import outlineVs from "./outline.vs.glsl";
import replaceFs from "./replace.fs.glsl";
import replaceVs from "./replace.vs.glsl";

/**
 * Show outline of entities.
 * @decorator `@dependentComponents(Camera)`
 */
@dependentComponents(Camera, DependentMode.CheckOnly)
export class OutlineManager extends Script {
  /** whether outline children of selected entities with subColor, default false */
  isChildrenIncluded: boolean = false;

  private static _traverseEntity(entity: Entity, callback: (entity: Entity) => void) {
    callback(entity);
    for (let i = entity.children.length - 1; i >= 0; i--) {
      this._traverseEntity(entity.children[i], callback);
    }
  }

  private static _outlineColorProp = ShaderProperty.getByName("material_OutlineColor");
  private static _outlineTextureProp = ShaderProperty.getByName("material_OutlineTexture");
  private static _texSizeProp = ShaderProperty.getByName("material_TexSize");
  private static _replaceColorProp = ShaderProperty.getByName("camera_OutlineReplaceColor");

  private _outlineMaterial: BaseMaterial;
  private _replaceShader: Shader;
  private _renderTarget: RenderTarget;
  private _screenEntity: Entity;
  private _size: number = 1;
  private _clearColor: Color = new Color(1, 1, 1, 1);
  private _replaceColor: Color = new Color(1, 0, 0, 1);
  private _outlineMainColor: Color = new Color(0.95, 0.35, 0.14, 1);
  private _outlineSubColor: Color = new Color(0.16, 0.67, 0.89, 1);
  private _layer: Layer = Layer.Layer11;
  private _outlineEntities: Entity[] = [];
  private _subLineEntities: Entity[] = [];

  private _renderers: MeshRenderer[] = [];
  private _layerMap: Array<{ entity: Entity; layer: Layer }> = [];
  private _cameraViewport: Vector4 = new Vector4();
  private _outLineViewport: Vector4 = new Vector4(0, 0, 1, 1);

  /** Outline main color. */
  get mainColor(): Color {
    return this._outlineMainColor;
  }

  set mainColor(value: Color) {
    const color = this._outlineMainColor;
    if (value !== color) {
      color.copyFrom(value);
    }
  }

  /** Outline sub color. */
  get subColor(): Color {
    return this._outlineSubColor;
  }

  set subColor(value: Color) {
    const color = this._outlineSubColor;
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

    this._outlineMaterial.shaderData.setTexture(OutlineManager._outlineTextureProp, renderColorTexture);
    this._outlineMaterial.shaderData.setVector2(OutlineManager._texSizeProp, new Vector2(1 / offWidth, 1 / offHeight));
    renderColorTexture.wrapModeU = renderColorTexture.wrapModeV = TextureWrapMode.Clamp;
    this._renderTarget = renderTarget;
  }

  constructor(entity: Entity) {
    super(entity);
    const engine = this.engine;
    const outlineMaterial = new BaseMaterial(engine, Shader.find("outline-postprocess-shader"));
    const replaceShader = Shader.find("outline-replace-shader");
    const screenEntity = this.entity.createChild("screen");
    const screenRenderer = screenEntity.addComponent(MeshRenderer);
    screenRenderer.receiveShadows = false;
    screenRenderer.castShadows = false;

    screenEntity.layer = this._layer;
    screenEntity.isActive = false;
    screenRenderer.mesh = PrimitiveMesh.createPlane(engine, 2, 2);
    screenRenderer.setMaterial(outlineMaterial);
    outlineMaterial.isTransparent = true;

    this._outlineMaterial = outlineMaterial;
    this._replaceShader = replaceShader;
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

      this.isChildrenIncluded && this._calSublineEntites();
    }
  }

  /**
   * Remove the entity you do not want to outline.
   * @param entity - The entity you wanna remove.
   */
  removeEntity(entity: Entity) {
    const index = this._outlineEntities.indexOf(entity);
    const len = this._outlineEntities.length;
    if (index > -1) {
      if (index < len - 1) {
        this._outlineEntities[index] = this._outlineEntities[len - 1];
      }
      this._outlineEntities.length--;
      this.isChildrenIncluded && this._calSublineEntites();
    }
  }

  override onEndRender(camera: Camera): void {
    const outlineEntities = this._outlineEntities;
    if (!outlineEntities.length) return;
    this._renderEntity(camera, this.subColor, this._subLineEntities);
    this._renderEntity(camera, this.mainColor, outlineEntities);
  }

  override onDestroy() {
    this._renderTarget.getColorTexture().destroy(true);
    this._renderTarget.destroy();
    this._screenEntity.destroy();

    this._outlineEntities = null;
    this._renderers = null;
    this._layerMap = null;
  }

  private _renderEntity(camera: Camera, outlineColor: Color, entities: readonly Entity[]) {
    const scene = camera.scene;
    const originalClearFlags = camera.clearFlags;
    const originalCullingMask = camera.cullingMask;
    const originalEnableFrustumCulling = camera.enableFrustumCulling;
    const originalSolidColor = scene.background.solidColor;
    const originalBackgroundMode = scene.background.mode;

    const renderers = this._renderers;
    const layerMap = this._layerMap;
    layerMap.length = 0;

    for (let i = entities.length - 1; i >= 0; i--) {
      const entity = entities[i];

      // replace material
      renderers.length = 0;
      entity.getComponents(MeshRenderer, renderers);

      // replace layer
      if (renderers.length) {
        layerMap.push({
          entity,
          layer: entity.layer
        });
        entity.layer = this._layer;
      }
    }

    // 1. render outline mesh with replace material
    this._screenEntity.isActive = false;
   
  
    camera.renderTarget = this._renderTarget;
    scene.background.solidColor = this._clearColor;
    scene.background.mode = BackgroundMode.SolidColor;
    camera.cullingMask = this._layer;
    camera.setReplacementShader(this._replaceShader);
    camera.shaderData.setColor(OutlineManager._replaceColorProp, this._replaceColor);
    camera.render();

    // 2. render screen only
    this._cameraViewport.copyFrom(camera.viewport);
    this._screenEntity.isActive = true;
    camera.renderTarget = null;
    camera.viewport = this._outLineViewport;
    camera.clearFlags = CameraClearFlags.None;
    camera.enableFrustumCulling = false;
    camera.resetReplacementShader();

    for (let i = layerMap.length - 1; i >= 0; i--) {
      const { entity, layer } = layerMap[i];
      entity.layer = layer;
    }
    this._outlineMaterial.shaderData.setColor(OutlineManager._outlineColorProp, outlineColor);
    camera.render();

    // 3. restore
    this._screenEntity.isActive = false;
    camera.clearFlags = originalClearFlags;
    camera.enableFrustumCulling = originalEnableFrustumCulling;
    camera.cullingMask = originalCullingMask;
    camera.viewport = this._cameraViewport;
    
    scene.background.solidColor = originalSolidColor;
    scene.background.mode = originalBackgroundMode;
  }

  private _calSublineEntites() {
    this._subLineEntities.length = 0;
    for (let i = 0; i < this._outlineEntities.length; i++) {
      OutlineManager._traverseEntity(this._outlineEntities[i], (entity) => {
        this._subLineEntities.push(entity);
      });
    }
  }
}

Shader.create("outline-postprocess-shader", outlineVs, outlineFs);
Shader.create("outline-replace-shader", replaceVs, replaceFs);
