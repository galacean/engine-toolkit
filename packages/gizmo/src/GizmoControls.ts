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
  RenderElement,
} from "oasis-engine";
import { ScaleControl } from "./Scale";
import { TranslateControl } from "./Translate";
import { RotateControl } from "./Rotate";
import { GizmoComponent } from "./Type";
import { utils } from "./Utils";
import { GizmoState, AnchorType, CoordinateType } from "./enums/GizmoState";
import { Group, GroupDirtyFlag } from "./Group";
import { FramebufferPicker } from "@oasis-engine-toolkit/framebuffer-picker";

/**
 * Gizmo controls, including translate, rotate, scale
 */
export class GizmoControls extends Script {
  static _scaleFactor = 0.05773502691896257;

  private _initialized = false;
  private _isStarted = false;
  private _isHovered = false;
  private _gizmoLayer: Layer = Layer.Layer30;
  private _gizmoMap: Record<number, GizmoComponent> = {};
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
        Object.values(this._gizmoMap).forEach((gizmo) => {
          gizmo.init(camera, this._group);
        });
        group.reset();
        this._initialized = true;
      } else {
        this._initialized = false;
      }
    }
  }

  /**
   * gizmo layer, default Layer30
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

      this._gizmoControl = targetState ? gizmoMap[targetState] : null;

      const states = Object.keys(gizmoMap);
      for (let i = states.length - 1; i >= 0; i--) {
        const state = states[i];
        gizmoMap[state].entity.isActive = (targetState & state) != 0;
      }

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

    // gizmo collider
    const sphereCollider = entity.addComponent(StaticCollider);
    const colliderShape = new SphereColliderShape();
    colliderShape.radius = utils.rotateCircleRadius + 0.5;
    sphereCollider.addShape(colliderShape);

    this.gizmoState = this._gizmoState;
    this.gizmoAnchor = AnchorType.Center;
    this.gizmoCoord = CoordinateType.Local;
  }

  /**
   * for single select, called when entity is selected
   * @param entity - the selected entity, could be empty
   */
  selectEntity(entity: Entity | null) {
    const { _group: group } = this;
    group.reset();
    entity && group.addEntity(entity);
  }

  /**
   * for multiple select, called when entity is selected
   * @param entity - the selected entity, could be empty
   */

  addEntity(entity: Entity | null) {
    const { _group: group } = this;
    entity && group.addEntity(entity);
    console.log("a", group);
  }

  /**
   * for multiple select, called when entity is deselected
   * @param entity - the selected entity, could be empty
   */
  deselectEntity(entity: Entity) {
    const { _group: group } = this;
    entity && group.deleteEntity(entity);
    console.log("s", group);
  }

  /**
   * get entity index in group
   * @param entity
   * @return number, -1 if not in group
   */
  getIndexOf(entity: Entity): number {
    const { _group: group } = this;
    return group.getIndexOf(entity);
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
      if (
        Math.abs(this._lastDistance - currDistance) > MathUtil.zeroTolerance
      ) {
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
          this._framebufferPicker
            .pick(pointerPosition.x, pointerPosition.y)
            .then((result) => {
              this._selectHandler(result);
            });
        } else {
          this._framebufferPicker
            .pick(pointerPosition.x, pointerPosition.y)
            .then((result) => {
              this._overHandler(result);
            });
        }
      }
    }
  }

  private _createGizmoControl(
    control: GizmoState,
    gizmoComponent: new (entity: Entity) => GizmoComponent
  ) {
    const gizmoControl = this.entity
      .createChild(control.toString())
      .addComponent(gizmoComponent);
    this._gizmoMap[control] = gizmoControl;
  }

  private _onGizmoHoverStart(axisName: string) {
    this._isHovered = true;
    this._gizmoControl.onHoverStart(axisName);
  }

  private _onGizmoHoverEnd() {
    if (this._isHovered) {
      this._gizmoControl.onHoverEnd();
      this._isHovered = false;
    }
  }

  private _triggerGizmoStart(axisName: string) {
    this._isStarted = true;
    const pointerPosition = this.engine.inputManager.pointerPosition;
    if (pointerPosition) {
      this._sceneCamera.screenPointToRay(pointerPosition, this._tempRay);
      this._gizmoControl.onMoveStart(this._tempRay, axisName);
    }
  }

  private _triggerGizmoMove() {
    this._sceneCamera.screenPointToRay(
      this.engine.inputManager.pointerPosition,
      this._tempRay2
    );
    this._gizmoControl.onMove(this._tempRay2);
  }

  private _triggerGizmoEnd() {
    this._gizmoControl.onMoveEnd();
    this._group.setDirtyFlagTrue(GroupDirtyFlag.CoordinateDirty);
    this._isStarted = false;
  }

  private _selectHandler(result: RenderElement) {
    const selectedEntity = result?.component?.entity;
    switch (selectedEntity?.layer) {
      case this._gizmoLayer:
        this._triggerGizmoStart(selectedEntity.name);
        break;
    }
  }

  private _overHandler(result: RenderElement) {
    const hoverEntity = result?.component?.entity;
    if (hoverEntity?.layer === this._gizmoLayer) {
      this._onGizmoHoverEnd();
      this._onGizmoHoverStart(hoverEntity.name);
    } else {
      this._onGizmoHoverEnd();
    }
  }
}
