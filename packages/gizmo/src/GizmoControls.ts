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
  BoolUpdateFlag,
  Vector3,
  MathUtil,
  Script
} from "oasis-engine";
import { ScaleControl } from "./Scale";
import { TranslateControl } from "./Translate";
import { RotateControl } from "./Rotate";
import { GizmoComponent } from "./Type";
import { utils } from "./Utils";
import { GizmoState } from "./enums/GizmoState";
import { AnchorType, CoordinateType, Group, GroupDirtyFlag } from "./Group";
import { FramebufferPicker } from "@oasis-engine-toolkit/framebuffer-picker";
/**
 * Gizmo controls, including translate, rotate, scale
 */
export class GizmoControls extends Script {
  static _scaleFactor = 0.05773502691896257;

  public gizmoState: GizmoState;
  private _initialized = false;
  private _isStarted = false;
  private _isHovered = false;
  private _gizmoLayer: Layer = Layer.Layer22;
  private _gizmoMap: Record<string, GizmoComponent> = {};
  private _editorCamera: Camera;
  private _gizmoControl: GizmoComponent;
  private _group: Group = new Group();
  private _framebufferPicker: FramebufferPicker;
  private _lastDistance: number = -1;
  private _tempVec: Vector3 = new Vector3();
  private _tempRay: Ray = new Ray();
  private _tempRay2: Ray = new Ray();

  private _cameraTransformChangeFlag: BoolUpdateFlag;

  constructor(entity: Entity) {
    super(entity);

    utils.init(this.engine);
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
    colliderShape.radius = 2;
    sphereCollider.addShape(colliderShape);
  }

  /**
   * initial scene camera in gizmo
   * @param camera - The scene camera
   */
  initGizmoControl(camera: Camera) {
    if (camera !== this._editorCamera) {
      if (this._cameraTransformChangeFlag) {
        this._cameraTransformChangeFlag.destroy();
      }
      if (camera) {
        const { _group: group } = this;
        this._editorCamera = camera;
        this._framebufferPicker.camera = camera;
        Object.values(this._gizmoMap).forEach((gizmo) => {
          gizmo.init(camera, this._group);
        });
        group.reset();
        group.addEntity([this.entity]);
        this._cameraTransformChangeFlag = camera.entity.transform.registerWorldChangeFlag();
        this._initialized = true;
      } else {
        this._cameraTransformChangeFlag = null;
        this._initialized = false;
      }
    }
  }
  /**
   * toggle gizmo orientation type
   * @param isGlobal - true if orientation is global, false if orientation is local
   */
  onToggleGizmoOrient(isGlobal: boolean) {
    this._group.coordinateType = isGlobal ? CoordinateType.Global : CoordinateType.Local;
  }

  /**
   * toggle gizmo anchor type
   * @param isGlobal - true if anchor is center, false if anchor is pivot
   */
  onToggleGizmoAnchor(isCenter: boolean) {
    this._group.anchorType = isCenter ? AnchorType.Center : AnchorType.Pivot;
  }

  /**
   * toggle gizmo state
   * @param targetState - gizmo new state
   */
  onGizmoChange(targetState: GizmoState) {
    if (this.gizmoState !== targetState) {
      this.gizmoState = targetState;
      const { _gizmoMap: gizmoMap } = this;
      this._gizmoControl = gizmoMap[targetState];
      const states = Object.keys(gizmoMap);
      for (let i = states.length - 1; i >= 0; i--) {
        const state = states[i];
        gizmoMap[state].entity.isActive = targetState === state;
      }
      this._gizmoControl.onGizmoRedraw();
    }
  }

  /**
   * called when entity is selected
   * @param entity - the selected entity, could be empty
   */
  onEntitySelected(entity: Entity | null) {
    const { _group: group } = this;
    group.reset();
    entity && group.addEntity([entity]);
  }

  /**
   * called when pointer enters gizmo
   * @param axisName - the hovered axis name
   */
  private _onGizmoHoverStart(axisName: string) {
    this._isHovered = true;
    this._gizmoControl.onHoverStart(axisName);
  }

  /**
   * called when pointer leaves gizmo
   */
  private _onGizmoHoverEnd() {
    if (this._isHovered) {
      this._gizmoControl.onHoverEnd();
      this._isHovered = false;
    }
  }

  /**
   * called when gizmo starts to move
   * @param axisName - the hovered axis name
   */
  private _triggerGizmoStart(axisName: string) {
    this._isStarted = true;
    const pointerPosition = this.engine.inputManager.pointerPosition;
    if (pointerPosition) {
      this._editorCamera.screenPointToRay(pointerPosition, this._tempRay);
      this._gizmoControl.onMoveStart(this._tempRay, axisName);
    }
  }

  /**
   * called when gizmo move
   */
  private _triggerGizmoMove() {
    this._editorCamera.screenPointToRay(this.engine.inputManager.pointerPosition, this._tempRay2);
    this._gizmoControl.onMove(this._tempRay2);
  }

  /**
   * called when gizmo movement ends
   */
  private _triggerGizmoEnd() {
    this._gizmoControl.onMoveEnd();
    // todo:当且仅当 group 为世界坐标时，才去更新
    this._group.setDirtyFlagTrue(GroupDirtyFlag.CoordinateDirty);
    this._isStarted = false;
  }

  private _selectHandler(result): void {
    const selectedEntity = result?.component?.entity;
    switch (selectedEntity?.layer) {
      case this._gizmoLayer:
        this._triggerGizmoStart(selectedEntity.name);
        break;
    }
  }

  private _overHandler(result) {
    const hoverEntity = result?.component?.entity;
    if (hoverEntity?.layer === this._gizmoLayer) {
      this._onGizmoHoverEnd();
      this._onGizmoHoverStart(hoverEntity.name);
    } else {
      this._onGizmoHoverEnd();
    }
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
      const cameraPosition = this._editorCamera.entity.transform.worldPosition;
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
          this._framebufferPicker.pick(pointerPosition.x, pointerPosition.y).then((result) => {
            this._overHandler(result);
          });
        }
      }
    }
  }

  private _createGizmoControl(control: string, gizmoComponent: new (entity: Entity) => GizmoComponent) {
    const gizmoControl = this.entity.createChild(control).addComponent(gizmoComponent);
    this._gizmoMap[control] = gizmoControl;
  }
}
