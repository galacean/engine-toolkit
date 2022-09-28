import {
  Camera,
  Entity,
  Ray,
  Layer,
  RenderTarget,
  Texture2D,
  PointerButton,
  SphereColliderShape,
  StaticCollider,
  Vector3,
  MathUtil,
  Script,
  MeshRenderElement
} from "oasis-engine";
import { ScaleControl } from "./Scale";
import { TranslateControl } from "./Translate";
import { RotateControl } from "./Rotate";
import { GizmoComponent } from "./Type";
import { Utils } from "./Utils";
import { GizmoState, AnchorType, CoordinateType } from "./enums/GizmoState";
import { Group, GroupDirtyFlag } from "./Group";
import { FramebufferPicker } from "@oasis-engine-toolkit/framebuffer-picker";
/**
 * Gizmo controls, including translate, rotate, scale
 */
export class GizmoControls extends Script {
  private _initialized = false;
  private _isStarted = false;
  private _isHovered = false;
  private _gizmoLayer: Layer;
  private _gizmoMap: Array<GizmoComponent> = [];
  private _sceneCamera: Camera;
  private _gizmoControl: GizmoComponent | null;
  private _group: Group = new Group();
  private _framebufferPicker: FramebufferPicker;
  private _lastDistance: number = -1;
  private _tempVec: Vector3 = new Vector3();
  private _tempRay: Ray = new Ray();
  private _tempRay2: Ray = new Ray();

  private _gizmoState: GizmoState = GizmoState.null;

  /**
   * initial scene camera in gizmo
   * @return camera - The scene camera
   */
  get camera(): Camera {
    return this._sceneCamera;
  }

  set camera(camera: Camera) {
    if (camera !== this._sceneCamera) {
      if (camera) {
        const { _group: group } = this;
        this._sceneCamera = camera;
        this._framebufferPicker.camera = camera;

        this._gizmoMap.forEach((gizmoControl) => {
          gizmoControl.init(camera, this._group);
        });

        group.reset();
        this._initialized = true;
      } else {
        this._initialized = false;
      }
    }
  }

  /**
   * gizmo layer, default Layer29
   * @return the layer for gizmo entity and gizmo's inner framebuffer picker
   * @remarks Layer duplicate warning, check whether this layer is taken
   */
  get layer(): Layer {
    return this._gizmoLayer;
  }

  set layer(layer: Layer) {
    if (this._gizmoLayer !== layer) {
      this._gizmoLayer = layer;
      this.entity.layer = layer;
      this._framebufferPicker.colorRenderPass.mask = layer;
    }
  }

  /**
   * change gizmo state
   * @return current gizmo state - translate, or rotate, scale, null, default null
   */
  get gizmoState(): GizmoState {
    return this._gizmoState;
  }

  set gizmoState(targetState: GizmoState) {
    if (!(this._gizmoState & targetState)) {
      this._gizmoState = targetState;
      const { _gizmoMap: gizmoMap } = this;

      const targetIdx = gizmoMap.findIndex((gizmoControl) => {
        return gizmoControl.type === targetState;
      });
      this._gizmoControl = targetIdx > -1 ? gizmoMap[targetIdx] : null;

      gizmoMap.forEach((gizmoControl) => {
        gizmoControl.entity.isActive = (targetState & gizmoControl.type) != 0;
      });

      this._gizmoControl?.onGizmoRedraw();
    }
  }

  /**
   * toggle gizmo anchor type
   * @return current anchor type - center or pivot, default center
   */
  get gizmoAnchor(): AnchorType {
    return this._group.anchorType;
  }

  set gizmoAnchor(targetAnchor: AnchorType) {
    this._group.anchorType = targetAnchor;
  }

  /**
   * toggle gizmo orientation type
   * @return current orientation type - global or local, default local
   */
  get gizmoCoord(): CoordinateType {
    return this._group.coordinateType;
  }

  set gizmoCoord(targetCoord: CoordinateType) {
    this._group.coordinateType = targetCoord;
  }

  constructor(entity: Entity) {
    super(entity);

    const utils = new Utils();
    utils.init(this.engine);

    // setup mesh
    this._createGizmoControl(GizmoState.translate, TranslateControl);
    this._createGizmoControl(GizmoState.scale, ScaleControl);
    this._createGizmoControl(GizmoState.rotate, RotateControl);

    // framebuffer picker
    this._framebufferPicker = entity.addComponent(FramebufferPicker);
    this._framebufferPicker.colorRenderPass.mask = this._gizmoLayer;
    this._framebufferPicker.colorRenderTarget = new RenderTarget(
      this.engine,
      256,
      256,
      new Texture2D(this.engine, 256, 256)
    );
    this.layer = Layer.Layer29;

    // gizmo collider
    const sphereCollider = entity.addComponent(StaticCollider);
    const colliderShape = new SphereColliderShape();
    colliderShape.radius = Utils.rotateCircleRadius + 0.5;
    sphereCollider.addShape(colliderShape);

    this.gizmoState = this._gizmoState;
    this.gizmoAnchor = AnchorType.Center;
    this.gizmoCoord = CoordinateType.Local;
  }

  /**
   * add entity to the group
   * @param entity - the entity to add, could be empty
   * @return boolean, true if the entity is the previous group, false if not
   */
  addEntity(entity: Entity | null): boolean {
    const { _group: group } = this;
    return entity && group.addEntity(entity);
  }

  /**
   * remove entity from the group
   * @param entity - the entity to remove
   */
  removeEntity(entity: Entity): void {
    const { _group: group } = this;
    entity && group.deleteEntity(entity);
  }

  /**
   * clear all entities in the group
   */
  clearEntity(): void {
    this._group.reset();
  }

  /** @internal */
  onUpdate() {
    if (!this._initialized || !this._gizmoControl) {
      return;
    }
    const { inputManager } = this.engine;
    if (this._isStarted) {
      if (inputManager.isPointerHeldDown(PointerButton.Primary)) {
        const { pointerMovingDelta } = inputManager;
        if (pointerMovingDelta.x !== 0 || pointerMovingDelta.y !== 0) {
          this._triggerGizmoMove();
        }
      } else {
        this._triggerGizmoEnd();
      }
      if (this._group._gizmoTransformDirty) {
        this._gizmoControl.onGizmoRedraw();
        this._group._gizmoTransformDirty = false;
      }
    } else {
      this._group.getWorldPosition(this._tempVec);
      const cameraPosition = this._sceneCamera.entity.transform.worldPosition;
      const currDistance = Vector3.distance(cameraPosition, this._tempVec);
      let distanceDirty = false;
      if (Math.abs(this._lastDistance - currDistance) > MathUtil.zeroTolerance) {
        distanceDirty = true;
        this._lastDistance = currDistance;
      }

      if (this._group._gizmoTransformDirty || distanceDirty) {
        this._gizmoControl.onGizmoRedraw();
        this._group._gizmoTransformDirty = false;
      }
      const { pointerPosition } = inputManager;
      if (pointerPosition) {
        if (inputManager.isPointerHeldDown(PointerButton.Primary)) {
          this._framebufferPicker.pick(pointerPosition.x, pointerPosition.y).then((result) => {
            this._selectHandler(result);
          });
        } else {
          this.camera.screenPointToRay(inputManager.pointerPosition, this._tempRay);
          const result = this.engine.physicsManager.raycast(this._tempRay, Number.MAX_VALUE, this._gizmoLayer);
          if (result) {
            this._framebufferPicker.pick(pointerPosition.x, pointerPosition.y).then((result) => {
              this._overHandler(result);
            });
          }
        }
      }
    }
  }

  private _createGizmoControl(control: GizmoState, gizmoComponent: new (entity: Entity) => GizmoComponent): void {
    const gizmoControl = this.entity.createChild(control.toString()).addComponent(gizmoComponent);
    this._gizmoMap.push(gizmoControl);
  }

  private _onGizmoHoverStart(axisName: string): void {
    this._isHovered = true;
    this._gizmoControl.onHoverStart(axisName);
  }

  private _onGizmoHoverEnd(): void {
    if (this._isHovered) {
      this._gizmoControl.onHoverEnd();
      this._isHovered = false;
    }
  }

  private _triggerGizmoStart(axisName: string): void {
    this._isStarted = true;
    const pointerPosition = this.engine.inputManager.pointerPosition;
    if (pointerPosition) {
      this._sceneCamera.screenPointToRay(pointerPosition, this._tempRay);
      this._gizmoControl.onMoveStart(this._tempRay, axisName);
    }
  }

  private _triggerGizmoMove(): void {
    this._sceneCamera.screenPointToRay(this.engine.inputManager.pointerPosition, this._tempRay2);
    this._gizmoControl.onMove(this._tempRay2);
  }

  private _triggerGizmoEnd(): void {
    this._gizmoControl.onMoveEnd();
    this._group.setDirtyFlagTrue(GroupDirtyFlag.CoordinateDirty);
    this._isStarted = false;
  }

  private _selectHandler(result: MeshRenderElement): void {
    const selectedEntity = result?.component?.entity;
    switch (selectedEntity?.layer) {
      case this._gizmoLayer:
        this._triggerGizmoStart(selectedEntity.name);
        break;
    }
  }

  private _overHandler(result: MeshRenderElement): void {
    const hoverEntity = result?.component?.entity;
    if (hoverEntity?.layer === this._gizmoLayer) {
      this._onGizmoHoverEnd();
      this._onGizmoHoverStart(hoverEntity.name);
    } else {
      this._onGizmoHoverEnd();
    }
  }
}
