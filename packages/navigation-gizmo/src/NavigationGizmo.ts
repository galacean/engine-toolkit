import {
  Camera,
  CameraClearFlags,
  Color,
  Entity,
  Font,
  FontStyle,
  Layer,
  Material,
  MeshRenderer,
  Script,
  SphereColliderShape,
  StaticCollider,
  TextHorizontalAlignment,
  TextRenderer,
  Vector2,
  Vector3
} from "@galacean/engine";
import { EndScript } from "./EndScript";
import { SphereScript } from "./SphereScript";
import { Utils } from "./Utils";

function traverseEntity(entity: Entity, callback: (entity: Entity) => any) {
  callback(entity);
  for (const child of entity.children) {
    traverseEntity(child, callback);
  }
}

export class NavigationGizmo extends Script {
  private _sceneCamera: Camera;
  private _gizmoLayer: Layer = Layer.Layer30;

  private _gizmoCamera: Camera;
  private _gizmoEntity: Entity;
  private _utils: Utils;
  private _target: Vector3 = new Vector3();

  private _sphereScript: SphereScript;
  private _endScript = {
    X: EndScript,
    Y: EndScript,
    Z: EndScript,
    "-X": EndScript,
    "-Y": EndScript,
    "-Z": EndScript
  };

  /**
   * @position - gizmo position, the left upper point of the gizmo area, default (0, 0).
   * Normalized expression, the upper left corner is (0, 0), and the lower right corner is (1, 1).
   */
  public position: Vector2 = new Vector2(0, 0);

  /**
   * @size gizmo size, the length and width of the gizmo area, default (0.12,0.12).
   */
  public size: Vector2 = new Vector2(0.12, 0.12);

  /** scene camera
   * @return current scene camera
   */
  get camera(): Camera {
    return this._sceneCamera;
  }

  set camera(camera: Camera) {
    let sceneCamera = this._sceneCamera;
    if (sceneCamera !== camera) {
      if (camera) {
        sceneCamera = this._sceneCamera = camera;
        this._sphereScript.camera = camera;
        Object.keys(this._endScript).forEach((key) => {
          this._endScript[key].camera = camera;
        });
      } else {
        throw new Error("navigation gizmo needs scene camera");
      }
    }
  }

  /**
   * target point for gizmo, default (0,0,0)
   * @return target point
   */
  get target(): Vector3 {
    return this._target;
  }

  set target(value: Vector3) {
    if (value !== this._target) {
      this._target.copyFrom(value);
    }
  }

  /**
   * gizmo layer, default Layer30
   */
  get layer(): Layer {
    return this._gizmoLayer;
  }

  set layer(layer: Layer) {
    if (this._gizmoLayer !== layer) {
      this._gizmoLayer = layer;
      this._gizmoCamera.cullingMask = layer;

      traverseEntity(this._gizmoEntity, (entity) => {
        entity.layer = layer;
      });
    }
  }

  /**
   * @return gizmo camera's priority, larger than any other camera in scene, default 100
   */
  get priority(): number {
    return this._gizmoCamera.priority;
  }

  set priority(priority: number) {
    this._gizmoCamera.priority = priority;
  }

  constructor(entity: Entity) {
    super(entity);
    if (!entity.engine.physicsManager) {
      throw new Error("PhysicsManager is not initialized");
    }

    this._utils = new Utils(this.engine);

    this._gizmoEntity = entity.createChild("navigation-gizmo");
    this._gizmoEntity.layer = this._gizmoLayer;

    const gizmoCameraEntity = this._gizmoEntity.createChild("gizmo-camera");
    gizmoCameraEntity.transform.setPosition(0, 0, 10);

    const gizmoCamera = gizmoCameraEntity.addComponent(Camera);
    gizmoCamera.isOrthographic = true;
    gizmoCamera.cullingMask = this._gizmoLayer;
    gizmoCamera.clearFlags = CameraClearFlags.Depth;
    gizmoCamera.priority = 100;
    this._gizmoCamera = gizmoCamera;

    this._createGizmo();

    this._setTarget = this._setTarget.bind(this);
    //@ts-ignore
    this._target._onValueChanged = this._setTarget;
  }

  override onUpdate() {
    this._gizmoCamera.viewport.set(this.position.x, this.position.y, this.size.x, this.size.y);
  }

  private _createGizmo() {
    const utils = this._utils;
    // setup gizmo shape
    const directionEntity = this._gizmoEntity.createChild("direction");
    const axisEntity = directionEntity.createChild("axis");

    // axis
    const axisXEntity = axisEntity.createChild("x");
    const axisYEntity = axisEntity.createChild("y");
    const axisZEntity = axisEntity.createChild("z");

    this._createAxis(axisXEntity, utils.xRotateVector, utils.xTranslateVector, utils.redMaterial);
    this._createAxis(axisYEntity, utils.yRotateVector, utils.yTranslateVector, utils.greenMaterial);
    this._createAxis(axisZEntity, utils.zRotateVector, utils.zTranslateVector, utils.blueMaterial);

    // end
    const endEntity = directionEntity.createChild("end");

    const endXEntity = endEntity.createChild("x");
    const endYEntity = endEntity.createChild("y");
    const endZEntity = endEntity.createChild("z");

    this._createEnd(endXEntity, utils.xEndTranslateVector, utils.redMaterial, "X", new Color(1.0, 0.25, 0.25, 1.0));
    this._createEnd(endYEntity, utils.yEndTranslateVector, utils.greenMaterial, "Y", new Color(0.5, 0.8, 0.2, 1.0));
    this._createEnd(endZEntity, utils.zEndTranslateVector, utils.blueMaterial, "Z", new Color(0.3, 0.5, 1.0, 1.0));

    const endNegativeXEntity = endEntity.createChild("-x");
    const endNegativeYEntity = endEntity.createChild("-y");
    const endNegativeZEntity = endEntity.createChild("-z");

    this._createEnd(
      endNegativeXEntity,
      utils.xEndTranslateVector.negate(),
      utils.greyMaterial,
      "-X",
      new Color(1, 1, 1, 0)
    );
    this._createEnd(
      endNegativeYEntity,
      utils.yEndTranslateVector.negate(),
      utils.greyMaterial,
      "-Y",
      new Color(1, 1, 1, 0)
    );
    this._createEnd(
      endNegativeZEntity,
      utils.zEndTranslateVector.negate(),
      utils.greyMaterial,
      "-Z",
      new Color(1, 1, 1, 0)
    );

    // sphere behind
    const sphereEntity = this._gizmoEntity.createChild("sphere");
    sphereEntity.transform.setPosition(0, 0, -(utils.radius + 0.5));

    const sphereCollider = sphereEntity.addComponent(StaticCollider);
    const sphereColliderShape = new SphereColliderShape();
    sphereColliderShape.radius = utils.radius;
    sphereCollider.addShape(sphereColliderShape);

    const roundEntity = sphereEntity.createChild("round");
    const roundRenderer = roundEntity.addComponent(MeshRenderer);
    roundRenderer.receiveShadows = false;
    roundRenderer.castShadows = false;
    roundRenderer.mesh = utils.bgMesh;
    roundRenderer.setMaterial(utils.bgMaterial);
    roundEntity.isActive = false;

    this._sphereScript = sphereEntity.addComponent(SphereScript);
  }

  private _createAxis(entity: Entity, rotation: Vector3, position: Vector3, material: Material) {
    entity.transform.setRotation(rotation.x, rotation.y, rotation.z);
    entity.transform.setPosition(position.x, position.y, position.z);

    const axisXRenderer = entity.addComponent(MeshRenderer);
    axisXRenderer.receiveShadows = false;
    axisXRenderer.castShadows = false;
    axisXRenderer.mesh = this._utils.axisMesh;
    axisXRenderer.setMaterial(material);
  }

  private _createEnd(entity: Entity, position: Vector3, material: Material, axisName: string, fontColor: Color) {
    const utils = this._utils;

    entity.transform.setPosition(position.x, position.y, position.z);

    const sphereCollider = entity.addComponent(StaticCollider);
    const colliderShape = new SphereColliderShape();
    colliderShape.radius = utils.endRadius;
    sphereCollider.addShape(colliderShape);

    const renderEntity = entity.createChild("back");
    const axisRenderer = renderEntity.addComponent(MeshRenderer);
    axisRenderer.receiveShadows = false;
    axisRenderer.castShadows = false;
    axisRenderer.mesh = utils.endMesh;
    axisRenderer.setMaterial(material);
    renderEntity.isActive = false;

    const textEntity = entity.createChild("text");
    textEntity.transform.setPosition(0, 0, 0.05);
    const axisXTextRenderer = textEntity.addComponent(TextRenderer);
    axisXTextRenderer.receiveShadows = false;
    axisXTextRenderer.castShadows = false;
    axisXTextRenderer.font = Font.createFromOS(this.engine, "Arial");
    axisXTextRenderer.text = axisName;
    axisXTextRenderer.fontStyle = FontStyle.Bold;
    axisXTextRenderer.fontSize = 200;

    axisXTextRenderer.color.copyFrom(fontColor);
    axisXTextRenderer.horizontalAlignment = TextHorizontalAlignment.Center;

    this._endScript[axisName] = entity.addComponent(EndScript);
  }

  private _setTarget(): void {
    this._sphereScript.target.copyFrom(this._target);
    Object.keys(this._endScript).forEach((key) => {
      this._endScript[key].target.copyFrom(this._target);
    });
  }
}
