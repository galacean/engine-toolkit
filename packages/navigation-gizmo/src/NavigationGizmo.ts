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
  Vector3,
  Vector4,
} from "oasis-engine";
import { EndScript } from "./EndScript";
import { SphereScript } from "./SphereScript";
import { utils } from "./Utils";

export class NavigationGizmo extends Component {
  public sceneCamera: Camera;

  private _gizmoCamera: Camera;
  private _gizmoLayer: Layer = Layer.Layer30;
  private _gizmoEntity: Entity;

  constructor(entity: Entity) {
    super(entity);
    utils.init(this.engine);

    this._gizmoEntity = entity.createChild("navigation-gizmo");
    this._gizmoEntity.layer = this._gizmoLayer;

    const gizmoCameraEntity = this._gizmoEntity.createChild("gizmo-camera");
    gizmoCameraEntity.transform.setPosition(0, 0, 10);

    this._gizmoCamera = gizmoCameraEntity.addComponent(Camera);
    this._gizmoCamera.isOrthographic = true;
    this._gizmoCamera.cullingMask = this._gizmoLayer;
    this._gizmoCamera.viewport.set(0.8, 0, 0.2, 0.2);
    this._gizmoCamera.clearFlags = CameraClearFlags.Depth;
  }

  _createGizmo() {
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

    sphereEntity.addComponent(SphereScript);
  }
  /**
   * @param camera - scene camera
   */
  set camera(camera: Camera) {
    this.sceneCamera = camera;

    this._createGizmo();
  }
  /**
   * viewport for the gizmo, default upper right corner (0.8, 0, 0.2, 0.2).
   * @param viewportRange - normalized expression, the upper left corner is (0, 0), and the lower right corner is (1, 1).
   */
  set viewport(viewportRange: Vector4) {
    Object.assign(this.sceneCamera.viewport, viewportRange);
  }
  /**
   * gizmo layer, default Layer30
   * @param layer - the layer for gizmo and gizmo camera's cullingMask
   */
  set layer(layer: Layer) {
    this._gizmoLayer = layer;

    this._gizmoCamera.cullingMask = layer;
    this._gizmoEntity.layer = layer;
  }

  _createAxis(
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

  _createPositiveEnd(
    entity: Entity,
    position: Vector3,
    material: Material,
    mesh: Mesh,
    name: string
  ) {
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
    axisXTextRenderer.text = name;
    axisXTextRenderer.fontStyle = FontStyle.Bold;
    axisXTextRenderer.fontSize = 110;
    axisXTextRenderer.color.set(0, 0, 0, 1);
    axisXTextRenderer.horizontalAlignment = TextHorizontalAlignment.Center;

    entity.addComponent(EndScript);
  }

  _createNegativeEnd(
    entity: Entity,
    position: Vector3,
    material: Material,
    mesh: Mesh,
    axisName: string
  ) {
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

    entity.addComponent(EndScript);
  }
}
