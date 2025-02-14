import {
  BoolUpdateFlag,
  Camera,
  CameraModifyFlags,
  Component,
  Entity,
  Layer,
  MathUtil,
  Matrix,
  MeshRenderer,
  Pointer,
  PointerButton,
  PointerPhase,
  Ray,
  Script,
  Vector2,
  Vector3
} from "@galacean/engine";
import { FramebufferPicker } from "@galacean/engine-toolkit-framebuffer-picker";
import { Group, GroupDirtyFlag } from "./Group";
import { RectControl } from "./Rect";
import { RotateControl } from "./Rotate";
import { ScaleControl } from "./Scale";
import { TranslateControl } from "./Translate";
import { GizmoComponent } from "./Type";
import { Utils } from "./Utils";
import { State } from "./enums/GizmoState";
import { SearchComponentType } from "./enums/GroupState";
/**
 * Gizmo controls, including translate, rotate, scale
 */
export class Gizmo extends Script {
  epsilon = 0.05;

  private _initialized = false;
  private _isStarted = false;

  private _sceneCamera: Camera;
  private _layer: Layer;
  private _framebufferPicker: FramebufferPicker;

  private _controlMap: Array<GizmoComponent> = [];
  private _currentControl: GizmoComponent;

  private _group: Group = new Group();

  private _tempVec30: Vector3 = new Vector3();
  private _tempVec31: Vector3 = new Vector3();
  private _worldMat: Matrix = new Matrix();

  private _tempRay: Ray = new Ray();
  private _tempRay2: Ray = new Ray();

  private _type: State = null;
  private _scalar: number = 1;

  private _cameraTransformFlag: BoolUpdateFlag;
  private _cameraModifyDirtyFlag: number = 0;

  /**
   * initial scene camera & select group in gizmo
   */
  init(camera: Camera, group: Group) {
    const preCamera = this._sceneCamera;
    if (camera !== preCamera) {
      if (preCamera) {
        this._cameraTransformFlag?.clearFromManagers();
        this._cameraTransformFlag = null;
        // @ts-ignore
        preCamera._unRegisterModifyListener(this._onCameraModifyListener);
      }
      if (camera) {
        this._group = group;
        this._sceneCamera = camera;
        const cameraEntity = camera.entity;
        this._cameraTransformFlag = cameraEntity.registerWorldChangeFlag();
        // @ts-ignore
        camera._registerModifyListener(this._onCameraModifyListener);
        this._framebufferPicker = cameraEntity.addComponent(FramebufferPicker);
        this._framebufferPicker.frameBufferSize = new Vector2(256, 256);

        this._controlMap.forEach((gizmoControl) => {
          gizmoControl.init(camera, this._group);
        });

        this._initialized = true;
      } else {
        this._initialized = false;
      }
    }
  }

  /**
   * 监听相机的属性改变
   * @param flag - 相机属性标记
   */
  private _onCameraModifyListener(flag: CameraModifyFlags): void {
    this._cameraModifyDirtyFlag |= flag;
  }

  /**
   * gizmo layer, default Layer31
   * @return the layer for gizmo entity and gizmo's inner framebuffer picker
   * @remarks Layer duplicate warning, check whether this layer is taken
   */
  get layer(): Layer {
    return this._layer;
  }

  set layer(layer: Layer) {
    if (this._layer !== layer) {
      this._layer = layer;
      this._traverseEntity(this.entity, (entity) => {
        entity.layer = layer;
      });
    }
  }

  /**
   * change gizmo type
   * @return current gizmo type - translate, or rotate, scale, null, all, default null
   */
  get state(): State {
    return this._type;
  }

  set state(targetState: State) {
    this._type = targetState;
    this._group.searchComponentType =
      targetState === State.rect ? SearchComponentType.CurrentEntity : SearchComponentType.IncludeChildren;
    this._traverseControl(
      targetState,
      (control) => {
        control.entity.isActive = true;
        targetState === State.all ? control.onUpdate(true) : control.onUpdate(false);
      },
      (control) => {
        control.entity.isActive = false;
      }
    );
  }

  /**
   * change gizmo size
   * @return current gizmo size - min 0.01, default 1
   */
  get size(): number {
    return this._scalar;
  }

  set size(value: number) {
    this._scalar = MathUtil.clamp(value, 0.01, Infinity);
    Utils.scaleFactor = this._scalar * 0.05773502691896257;
  }

  constructor(entity: Entity) {
    super(entity);
    if (!this.entity.engine.physicsManager) {
      throw new Error("PhysicsManager is not initialized");
    }

    this._onCameraModifyListener = this._onCameraModifyListener.bind(this);

    Utils.init(this.engine);

    // setup mesh
    this._createGizmoControl(State.translate, TranslateControl);
    this._createGizmoControl(State.rotate, RotateControl);
    this._createGizmoControl(State.scale, ScaleControl);
    this._createGizmoControl(State.rect, RectControl);

    this.layer = Layer.Layer31;
    this.state = this._type;
  }

  override onUpdate() {
    if (!this._initialized) {
      return;
    }
    const { inputManager } = this.engine;
    const { pointers } = inputManager;
    const pointer = pointers.find((pointer: Pointer) => {
      return pointer.phase !== PointerPhase.Up && pointer.phase !== PointerPhase.Leave;
    });
    const isAll = this._type === State.all;
    const groupTransformFlag = this._group._transformFlag;
    const cameraTransformFlag = this._cameraTransformFlag;
    const cameraModifyDirtyFlag = this._cameraModifyDirtyFlag;
    if (cameraModifyDirtyFlag & CameraModifyFlags.ProjectionType) {
      this._traverseControl(this._type, (control) => {
        control.onSwitch(isAll);
      });
    }
    if (
      groupTransformFlag.flag ||
      cameraTransformFlag.flag ||
      (cameraModifyDirtyFlag & CameraModifyFlags.OrthographicSize && this._sceneCamera.isOrthographic)
    ) {
      this._traverseControl(this._type, (control) => {
        control.onUpdate(isAll);
      });
      groupTransformFlag.flag = false;
      cameraTransformFlag.flag = false;
    }
    this._cameraModifyDirtyFlag = 0;
    if (this._isStarted) {
      if (pointer && (pointer.pressedButtons & PointerButton.Primary) !== 0) {
        if (pointer.deltaPosition.x !== 0 || pointer.deltaPosition.y !== 0) {
          this._triggerGizmoMove();
        }
      } else {
        this._triggerGizmoEnd();
      }
    } else {
      if (pointer) {
        const { x, y } = pointer.position;
        const { canvas } = this.engine;
        if (x <= 0 || y <= 0 || x > canvas.width || y > canvas.height) {
          return;
        }
        if (inputManager.isPointerDown(PointerButton.Primary)) {
          this._framebufferPicker.pick(pointer.position.x, pointer.position.y).then((result) => {
            if (result) {
              this._selectHandler(result, pointer.position);
            }
          });
        } else {
          const originLayer = this._sceneCamera.cullingMask;
          this._sceneCamera.cullingMask = this._layer;
          const result = this._framebufferPicker.pick(pointer.position.x, pointer.position.y);
          this._sceneCamera.cullingMask = originLayer;
          result.then((result) => {
            this._overHandler(result);
          });
        }
      }
    }
  }

  override onLateUpdate(deltaTime: number): void {
    this._adjustAxisAlpha();
  }

  private _createGizmoControl(type: State, gizmoComponent: new (entity: Entity) => GizmoComponent): void {
    const control = this.entity.createChild(type.toString()).addComponent(gizmoComponent);
    this._controlMap.push(control);
  }

  private _onGizmoHoverStart(currentType: State, axisName: string): void {
    this._traverseControl(currentType, (control) => {
      this._currentControl = control;
    });
    this._currentControl.onHoverStart(axisName);
  }

  private _onGizmoHoverEnd(): void {
    this._currentControl && this._currentControl.onHoverEnd();
  }

  private _triggerGizmoStart(currentType: State, axisName: string): void {
    this._isStarted = true;
    this._onGizmoHoverEnd();
    const pointer = this.engine.inputManager.pointers.find((pointer: Pointer) => {
      return pointer.phase !== PointerPhase.Up && pointer.phase !== PointerPhase.Leave;
    });
    if (pointer) {
      this._sceneCamera.screenPointToRay(pointer.position, this._tempRay);
      this._traverseControl(
        currentType,
        (control) => {
          this._currentControl = control;
        },
        (control) => {
          control.entity.isActive = false;
        }
      );

      this._currentControl.onMoveStart(this._tempRay, axisName);
      this.engine.dispatch("gizmo-move-start", axisName);
    }
  }

  private _triggerGizmoMove(): void {
    const pointer = this.engine.inputManager.pointers.find((pointer: Pointer) => {
      return pointer.phase !== PointerPhase.Up && pointer.phase !== PointerPhase.Leave;
    });
    this._sceneCamera.screenPointToRay(pointer.position, this._tempRay2);
    this._currentControl.onMove(this._tempRay2, pointer);
  }

  private _triggerGizmoEnd(): void {
    this._currentControl && this._currentControl.onMoveEnd();
    this._group.setDirtyFlagTrue(GroupDirtyFlag.CoordinateDirty);
    this._traverseControl(this._type, (control) => {
      control.entity.isActive = true;
    });
    this._isStarted = false;
    this.engine.dispatch("gizmo-move-end");
  }

  private _selectHandler(result: Component, pointerPosition: Vector2): void {
    const material = (<MeshRenderer>result).getMaterial();
    const currentControl = parseInt(material.name);
    const selectedEntity = result.entity;
    switch (selectedEntity.layer) {
      case this._layer:
        this._triggerGizmoStart(currentControl, selectedEntity.name);
        break;
    }
  }

  private _overHandler(result: Component): void {
    if (result) {
      const material = (<MeshRenderer>result).getMaterial();
      const currentControl = parseInt(material.name);
      const hoverEntity = result.entity;
      this._onGizmoHoverStart(currentControl, hoverEntity.name);
    } else {
      this._onGizmoHoverEnd();
    }
  }

  private _traverseEntity(entity: Entity, callback: (entity: Entity) => any) {
    callback(entity);
    for (const child of entity.children) {
      this._traverseEntity(child, callback);
    }
  }

  private _traverseControl(
    targetType: State = this._type,
    callbackForTarget: (control: GizmoComponent) => any,
    callbackForOther?: (control: GizmoComponent) => any
  ) {
    this._controlMap.forEach((control) => {
      if ((targetType & control.type) != 0) {
        callbackForTarget(control);
      } else {
        if (callbackForOther) {
          callbackForOther(control);
        }
      }
    });
  }

  private _adjustAxisAlpha() {
    const { xAxisPositive, yAxisPositive, zAxisPositive } = Utils;

    this._traverseControl(this._type, (control) => {
      control.onAlphaChange("x", this._getAlphaFactor(xAxisPositive));
      control.onAlphaChange("y", this._getAlphaFactor(yAxisPositive));
      control.onAlphaChange("z", this._getAlphaFactor(zAxisPositive));
    });
  }

  private _getAlphaFactor(axis: Vector3): number {
    const { _worldMat: worldMat, _tempVec30: cameraDir, _tempVec31: tempVec, epsilon } = this;
    cameraDir.copyFrom(this._sceneCamera.entity.transform.worldForward).normalize();
    this._group.getWorldMatrix(worldMat);

    // angel between camera direction and gizmo axis direction
    Vector3.transformNormal(axis, worldMat, tempVec);
    const cosThetaDir = Math.abs(Vector3.dot(tempVec, cameraDir));

    if (this._sceneCamera.isOrthographic) {
      return 1 - cosThetaDir < epsilon ? MathUtil.clamp((1 - cosThetaDir) / epsilon, 0, 1) : 1;
    } else {
      // perspective camera needs to consider position
      // angle between camera direction and camera-entity position
      this._group.getWorldPosition(tempVec);
      Vector3.subtract(this._sceneCamera.entity.transform.worldPosition, tempVec, tempVec);
      const cosThetaPos = Math.abs(Vector3.dot(tempVec.normalize(), cameraDir));

      const minFactor = Math.min(cosThetaDir, cosThetaPos);
      const maxFactor = Math.max(cosThetaDir, cosThetaPos);
      return 1 - maxFactor < epsilon ? MathUtil.clamp((1 - minFactor) / epsilon, 0, 1) : 1;
    }
  }
}
