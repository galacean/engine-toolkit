import {
  Camera,
  CameraClearFlags,
  Component,
  Entity,
  Font,
  FontStyle,
  Layer,
  Material,
  Mesh,
  MeshRenderer,
  SphereColliderShape,
  StaticCollider,
  TextHorizontalAlignment,
  TextRenderer,
  Vector2,
  Vector3,
} from "oasis-engine";
import { EndScript } from "./EndScript";
import { SphereScript } from "./SphereScript";
import { Utils } from "./Utils";

export class NavigationGizmo extends Component {
  private _sceneCamera: Camera;
  private _gizmoLayer: Layer = Layer.Layer30;
  private _previousSceneCullingMaskLayer: Layer = Layer.Nothing;
  private _gizmoPosition: Vector2 = new Vector2(0, 0);
  private _gizmoSize: number = 0.2;

  private _gizmoCamera: Camera;
  private _gizmoEntity: Entity;
  private _utils: Utils;

  private _sphereScript: SphereScript;
  private _endScript = {
    X: EndScript,
    Y: EndScript,
    Z: EndScript,
    "-X": EndScript,
    "-Y": EndScript,
    "-Z": EndScript,
  };

  /** scene camera
   * @return current scene camera
   */
  get camera() {
    return this._sceneCamera;
  }

  set camera(camera: Camera) {
    if (this._sceneCamera !== camera) {
      if (camera) {
        // restore the previous camera cullingMask
        if (this._sceneCamera) {
          this._sceneCamera.cullingMask = this._previousSceneCullingMaskLayer;
        }

        this._sceneCamera = camera;
        this._sphereScript.camera = camera;
        Object.keys(this._endScript).forEach((key) => {
          this._endScript[key].camera = camera;
        });

        this._previousSceneCullingMaskLayer = this._sceneCamera.cullingMask;
        if ((this._sceneCamera.cullingMask & this._gizmoLayer) != 0) {
          this._sceneCamera.cullingMask ^= this._gizmoLayer;
        }
      } else {
        if (this._sceneCamera) {
          this._sceneCamera.cullingMask = this._previousSceneCullingMaskLayer;
        }
        throw new Error("navigation gizmo needs scene camera");
      }
    }
  }

  /**
   * gizmo layer, default Layer30
   * @return the layer for gizmo and gizmo camera's cullingMask
   * @remarks Layer duplicate warning, check whether this layer is taken
   */
  get layer() {
    return this._gizmoLayer;
  }

  set layer(layer: Layer) {
    if (this._gizmoLayer !== layer) {
      if (layer) {
        // restore previous layer
        if ((this._previousSceneCullingMaskLayer & this._gizmoLayer) != 0) {
          this._sceneCamera.cullingMask = this._previousSceneCullingMaskLayer;
        }
        this._gizmoLayer = layer;
        this._gizmoCamera.cullingMask = layer;
        this._gizmoEntity.layer = layer;

        if ((this._sceneCamera.cullingMask & this._gizmoLayer) != 0) {
          this._sceneCamera.cullingMask ^= this._gizmoLayer;
        }
      }
    }
  }

  /**
   * gizmo position, the left upper point of the gizmo area, default (0, 0).
   * Normalized expression, the upper left corner is (0, 0), and the lower right corner is (1, 1).
   * @return current gizmo position
   */
  get position() {
    return this._gizmoPosition;
  }

  set position(position: Vector2) {
    this._gizmoCamera.viewport.set(
      position.x,
      position.y,
      this._gizmoSize,
      this._gizmoSize
    );
    this._gizmoPosition = position;
  }

  /**
   * gizmo size, the length and width of the gizmo area, default 0.2.
   * @return current gizmo size
   */
  get size() {
    return this._gizmoSize;
  }

  set size(size: number) {
    this._gizmoCamera.viewport.set(
      this._gizmoPosition.x,
      this._gizmoPosition.y,
      size,
      size
    );
    this._gizmoSize = size;
  }

  constructor(entity: Entity) {
    super(entity);

    // @ts-ignore
    if (!entity.engine.physicsManager._initialized) {
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
    gizmoCamera.viewport.set(
      this._gizmoPosition.x,
      this._gizmoPosition.y,
      this._gizmoSize,
      this._gizmoSize
    );
    gizmoCamera.clearFlags = CameraClearFlags.Depth;

    this._gizmoCamera = gizmoCamera;

    this._createGizmo();
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

    this._createAxis(
      axisXEntity,
      utils.xRotateVector,
      utils.xTranslateVector,
      utils.redMaterial,
      utils.axisMesh
    );
    this._createAxis(
      axisYEntity,
      utils.yRotateVector,
      utils.yTranslateVector,
      utils.greenMaterial,
      utils.axisMesh
    );
    this._createAxis(
      axisZEntity,
      utils.zRotateVector,
      utils.zTranslateVector,
      utils.blueMaterial,
      utils.axisMesh
    );

    // end
    const endEntity = directionEntity.createChild("end");

    const endXEntity = endEntity.createChild("x");
    const endYEntity = endEntity.createChild("y");
    const endZEntity = endEntity.createChild("z");

    this._createPositiveEnd(
      endXEntity,
      utils.xEndTranslateVector,
      utils.redMaterial,
      utils.endMesh,
      "X"
    );
    this._createPositiveEnd(
      endYEntity,
      utils.yEndTranslateVector,
      utils.greenMaterial,
      utils.endMesh,
      "Y"
    );
    this._createPositiveEnd(
      endZEntity,
      utils.zEndTranslateVector,
      utils.blueMaterial,
      utils.endMesh,
      "Z"
    );

    const endNegativeXEntity = endEntity.createChild("-x");
    const endNegativeYEntity = endEntity.createChild("-y");
    const endNegativeZEntity = endEntity.createChild("-z");

    this._createNegativeEnd(
      endNegativeXEntity,
      utils.xEndTranslateVector,
      utils.redMaterial,
      utils.endMesh,
      "-X"
    );
    this._createNegativeEnd(
      endNegativeYEntity,
      utils.yEndTranslateVector,
      utils.greenMaterial,
      utils.endMesh,
      "-Y"
    );
    this._createNegativeEnd(
      endNegativeZEntity,
      utils.zEndTranslateVector,
      utils.blueMaterial,
      utils.endMesh,
      "-Z"
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
    roundRenderer.mesh = utils.bgMesh;
    roundRenderer.setMaterial(utils.bgMaterial);
    roundEntity.isActive = false;

    this._sphereScript = sphereEntity.addComponent(SphereScript);
  }

  private _createAxis(
    entity: Entity,
    rotation: Vector3,
    position: Vector3,
    material: Material,
    mesh: Mesh
  ) {
    entity.transform.setRotation(rotation.x, rotation.y, rotation.z);
    entity.transform.setPosition(position.x, position.y, position.z);

    const axisXRenderer = entity.addComponent(MeshRenderer);
    axisXRenderer.mesh = mesh;
    axisXRenderer.setMaterial(material);
  }

  private _createPositiveEnd(
    entity: Entity,
    position: Vector3,
    material: Material,
    mesh: Mesh,
    axisName: string
  ) {
    const utils = this._utils;

    entity.transform.setPosition(position.x, position.y, position.z);

    const sphereCollider = entity.addComponent(StaticCollider);
    const colliderShape = new SphereColliderShape();
    colliderShape.radius = utils.endRadius;
    sphereCollider.addShape(colliderShape);

    const axisXRenderer = entity.addComponent(MeshRenderer);
    axisXRenderer.mesh = mesh;
    axisXRenderer.setMaterial(material);

    const textEntity = entity.createChild("text");
    textEntity.transform.setPosition(0, 0, 0.05);
    const axisXTextRenderer = textEntity.addComponent(TextRenderer);
    axisXTextRenderer.font = Font.createFromOS(this.engine, "Arial");
    axisXTextRenderer.text = axisName;
    axisXTextRenderer.fontStyle = FontStyle.Bold;
    axisXTextRenderer.fontSize = 110;
    axisXTextRenderer.color.set(0, 0, 0, 1);
    axisXTextRenderer.horizontalAlignment = TextHorizontalAlignment.Center;

    const endComponent = entity.addComponent(EndScript);
    this._endScript[axisName] = endComponent;
  }

  private _createNegativeEnd(
    entity: Entity,
    position: Vector3,
    material: Material,
    mesh: Mesh,
    axisName: string
  ) {
    const utils = this._utils;

    entity.transform.setPosition(-position.x, -position.y, -position.z);

    const sphereCollider = entity.addComponent(StaticCollider);
    const colliderShape = new SphereColliderShape();
    colliderShape.radius = utils.endRadius;
    sphereCollider.addShape(colliderShape);

    const axisXRenderer = entity.addComponent(MeshRenderer);
    axisXRenderer.mesh = mesh;
    axisXRenderer.setMaterial(material);

    const innerEndEntity = entity.createChild("text");
    innerEndEntity.transform.setPosition(0, 0, 0.03);
    const axisXInnerRenderer = innerEndEntity.addComponent(MeshRenderer);
    axisXInnerRenderer.mesh = utils.endInnerMesh;
    axisXInnerRenderer.setMaterial(utils.darkMaterial);

    const textEntity = entity.createChild("text");
    textEntity.transform.setPosition(0, 0, 0.05);
    const axisXTextRenderer = textEntity.addComponent(TextRenderer);
    axisXTextRenderer.font = Font.createFromOS(this.engine, "Arial");
    axisXTextRenderer.text = axisName;
    axisXTextRenderer.fontStyle = FontStyle.Bold;
    axisXTextRenderer.fontSize = 110;
    axisXTextRenderer.color.set(1, 1, 1, 0);
    axisXTextRenderer.horizontalAlignment = TextHorizontalAlignment.Center;

    const endComponent = entity.addComponent(EndScript);
    this._endScript[axisName] = endComponent;
  }
}
