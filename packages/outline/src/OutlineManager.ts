import {
  BackgroundMode,
  BaseMaterial,
  Camera,
  CameraClearFlags,
  Color,
  dependentComponents,
  Entity,
  Layer,
  Material,
  MeshRenderer,
  PrimitiveMesh,
  RenderTarget,
  Script,
  Shader,
  Texture2D,
  TextureWrapMode,
  Vector2
} from "oasis-engine";
import fs from "./outline.fs.glsl";
import vs from "./outline.vs.glsl";
import { PlainColorMaterial } from "@oasis-engine-toolkit/custom-material";

/**
 * Show outline of entities.
 * @decorator `@dependentComponents(Camera)`
 */
@dependentComponents(Camera)
export class OutlineManager extends Script {
  private static _traverseEntity(entity: Entity, callback: (entity: Entity) => void) {
    callback(entity);
    for (let i = entity.children.length - 1; i >= 0; i--) {
      this._traverseEntity(entity.children[i], callback);
    }
  }
  private static _outlineColorProp = Shader.getPropertyByName("u_outlineColor");
  private static _texSizeProp = Shader.getPropertyByName("u_texSize");

  private _outlineMaterial: BaseMaterial;
  private _replaceMaterial: BaseMaterial;
  private _renderTarget: RenderTarget;
  private _screenEntity: Entity;
  private _size: number = 1;
  private _clearColor: Color = new Color(1, 1, 1, 1);
  private _replaceColor: Color = new Color(1, 0, 0, 1);
  private _outlineMainColor: Color = new Color(0.95, 0.35, 0.14, 1);
  private _outlineSubColor: Color = new Color(0.16, 0.67, 0.89, 1);
  private _layer: Layer = Layer.Layer11;
  private _outlineEntities: Entity[] = [];

  private _renderers: MeshRenderer[] = [];
  private _materialMap: Array<{ renderer: MeshRenderer; material: Material }> = [];
  private _layerMap: Array<{ entity: Entity; layer: Layer }> = [];

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

    this._outlineMaterial.shaderData.setTexture("u_texture", renderColorTexture);
    this._outlineMaterial.shaderData.setVector2(OutlineManager._texSizeProp, new Vector2(1 / offWidth, 1 / offHeight));
    renderColorTexture.wrapModeU = renderColorTexture.wrapModeV = TextureWrapMode.Clamp;
    this._renderTarget = renderTarget;
  }

  constructor(entity: Entity) {
    super(entity);
    const engine = this.engine;
    const outlineMaterial = new BaseMaterial(engine, Shader.find("outline-postprocess-shader"));
    const replaceMaterial = new PlainColorMaterial(engine);
    const screenEntity = this.entity.createChild("screen");
    const screenRenderer = screenEntity.addComponent(MeshRenderer);
    screenRenderer.receiveShadows = false;
    screenRenderer.castShadows = false;

    replaceMaterial.baseColor = this._replaceColor;
    screenEntity.layer = this._layer;
    screenEntity.isActive = false;
    screenRenderer.mesh = PrimitiveMesh.createPlane(engine, 2, 2);
    screenRenderer.setMaterial(outlineMaterial);
    outlineMaterial.isTransparent = true;

    this._outlineMaterial = outlineMaterial;
    this._replaceMaterial = replaceMaterial;
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
    const outlineEntities = this._outlineEntities;
    if (!outlineEntities.length) return;

    const needSubRender = outlineEntities.length === 1 && outlineEntities[0].children.length > 0;
    if (needSubRender) {
      const parent = outlineEntities[0];
      this._renderEntity(camera, this.mainColor, parent);
      this._renderEntity(camera, this.subColor, null, parent.children);
    } else {
      this._renderEntity(camera, this.mainColor, null, outlineEntities);
    }
  }

  /** @internal */
  onDestroy() {
    this._renderTarget.getColorTexture().destroy(true);
    this._renderTarget.destroy();
    this._screenEntity.destroy();

    this._outlineEntities = null;
    this._renderers = null;
    this._materialMap = null;
    this._layerMap = null;
  }

  private _renderEntity(camera: Camera, outlineColor: Color, entity?: Entity, entities?: readonly Entity[]) {
    const scene = camera.scene;
    const originalClearFlags = camera.clearFlags;
    const originalCullingMask = camera.cullingMask;
    const originalEnableFrustumCulling = camera.enableFrustumCulling;
    const originalSolidColor = scene.background.solidColor;
    const originalBackgroundMode = scene.background.mode;

    const renderers = this._renderers;
    const materialMap = this._materialMap;
    const layerMap = this._layerMap;
    materialMap.length = 0;
    layerMap.length = 0;

    if (entity) {
      entity.getComponents(MeshRenderer, renderers);

      // replace material
      for (let j = renderers.length - 1; j >= 0; j--) {
        const renderer = renderers[j];
        materialMap.push({ renderer, material: renderer.getMaterial() });
        renderer.setMaterial(this._replaceMaterial);
      }

      // replace layer
      layerMap.push({
        entity,
        layer: entity.layer
      });
      entity.layer = this._layer;
    } else if (entities) {
      for (let i = entities.length - 1; i >= 0; i--) {
        const entity = entities[i];

        // replace material
        renderers.length = 0;
        entity.getComponentsIncludeChildren(MeshRenderer, renderers);
        for (let j = renderers.length - 1; j >= 0; j--) {
          const renderer = renderers[j];
          materialMap.push({ renderer, material: renderer.getMaterial() });
          renderer.setMaterial(this._replaceMaterial);
        }

        // replace layer
        OutlineManager._traverseEntity(entity, (entity) => {
          layerMap.push({
            entity,
            layer: entity.layer
          });
          entity.layer = this._layer;
        });
      }
    }

    // 1. render outline mesh with replace material
    this._screenEntity.isActive = false;
    camera.renderTarget = this._renderTarget;
    scene.background.solidColor = this._clearColor;
    scene.background.mode = BackgroundMode.SolidColor;
    camera.cullingMask = this._layer;
    this._outlineMaterial.shaderData.setColor(OutlineManager._outlineColorProp, outlineColor);
    camera.render();

    // 2. render screen only
    this._screenEntity.isActive = true;
    camera.renderTarget = null;
    camera.clearFlags = CameraClearFlags.None;
    camera.enableFrustumCulling = false;
    for (let i = materialMap.length - 1; i >= 0; i--) {
      const { material, renderer } = materialMap[i];
      renderer.setMaterial(material);
    }
    for (let i = layerMap.length - 1; i >= 0; i--) {
      const { entity, layer } = layerMap[i];
      entity.layer = layer;
    }
    camera.render();

    // 3. restore
    this._screenEntity.isActive = false;
    camera.clearFlags = originalClearFlags;
    camera.enableFrustumCulling = originalEnableFrustumCulling;
    camera.cullingMask = originalCullingMask;
    scene.background.solidColor = originalSolidColor;
    scene.background.mode = originalBackgroundMode;
  }
}

Shader.create("outline-postprocess-shader", vs, fs);
