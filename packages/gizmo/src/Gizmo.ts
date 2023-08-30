import {
  Camera,
  Entity,
  Ray,
  Layer,
  PointerButton,
  SphereColliderShape,
  StaticCollider,
  Vector3,
  MathUtil,
  Script,
  Pointer,
  PointerPhase,
  Vector2,
  Component,
  MeshRenderer
} from "@galacean/engine";
import { ScaleControl } from "./Scale";
import { TranslateControl } from "./Translate";
import { RotateControl } from "./Rotate";
import { GizmoComponent } from "./Type";
import { Utils } from "./Utils";
import { State } from "./enums/GizmoState";
import { Group, GroupDirtyFlag } from "./Group";
import { FramebufferPicker } from "@galacean/engine-toolkit-framebuffer-picker";
/**
 * Gizmo controls, including translate, rotate, scale
 */
export class Gizmo extends Script {
  private _initialized = false;
  private _isStarted = false;
  private _isHovered = false;
  private _lastDistance: number = -1;
  private _lastOrthoSize: number = -1;
  private _lastIsOrtho: boolean = false;

  private _sceneCamera: Camera;
  private _layer: Layer;
  private _framebufferPicker: FramebufferPicker;

  private _controlMap: Array<GizmoComponent> = [];
  private _currentControl: GizmoComponent;

  private _group: Group = new Group();

  private _tempVec: Vector3 = new Vector3();
  private _tempRay: Ray = new Ray();
  private _tempRay2: Ray = new Ray();

  private _type: State = null;

  private _sphereColliderEntity: Entity;

  /**
   * initial scene camera & select group in gizmo
   */
  init(camera: Camera, group: Group) {
    if (camera !== this._sceneCamera) {
      if (camera) {
        this._group = group;
        this._sceneCamera = camera;
        this._framebufferPicker = camera.entity.addComponent(FramebufferPicker);
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
   * gizmo layer, default Layer29
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

  constructor(entity: Entity) {
    super(entity);
    // @ts-ignore
    if (!this.entity.engine._physicsInitialized) {
      throw new Error("PhysicsManager is not initialized");
    }

    Utils.init(this.engine);

    // setup mesh
    this._createGizmoControl(State.translate, TranslateControl);
    this._createGizmoControl(State.rotate, RotateControl);
    this._createGizmoControl(State.scale, ScaleControl);

    this.layer = Layer.Layer29;
    // gizmo collider
    this._sphereColliderEntity = entity.createChild("gizmoCollider");
    const sphereCollider = this._sphereColliderEntity.addComponent(StaticCollider);
    const colliderShape = new SphereColliderShape();
    colliderShape.radius = Utils.rotateCircleRadius + 0.8;
    sphereCollider.addShape(colliderShape);

    this.state = this._type;
  }

  override onUpdate() {
    if (!this._initialized) {
      return;
    }

    const { pointers } = this.engine.inputManager;
    const pointer = pointers.find((pointer: Pointer) => {
      return pointer.phase !== PointerPhase.Up && pointer.phase !== PointerPhase.Leave;
    });

    if (this._lastIsOrtho !== this._sceneCamera.isOrthographic) {
      this._lastIsOrtho = this._sceneCamera.isOrthographic;
      this._traverseControl(this._type, (control) => {
        this._type === State.all ? control.onSwitch(true) : control.onSwitch(false);
      });
    }
    this._group.getWorldPosition(this._tempVec);
    this._sphereColliderEntity.transform.setPosition(this._tempVec.x, this._tempVec.y, this._tempVec.z);
    if (this._isStarted) {
      if (pointer && (pointer.pressedButtons & PointerButton.Primary) !== 0) {
        if (pointer.deltaPosition.x !== 0 || pointer.deltaPosition.y !== 0) {
          this._triggerGizmoMove();
        }
      } else {
        this._triggerGizmoEnd();
      }
      if (this._group._gizmoTransformDirty) {
        this._traverseControl(this._type, (control) => {
          this._type === State.all ? control.onUpdate(true) : control.onUpdate(false);
        });
        this._group._gizmoTransformDirty = false;
      }
    } else {
      this._group.getWorldPosition(this._tempVec);
      this._sphereColliderEntity.transform.setPosition(this._tempVec.x, this._tempVec.y, this._tempVec.z);

      const cameraPosition = this._sceneCamera.entity.transform.worldPosition;
      const currDistance = Vector3.distance(cameraPosition, this._tempVec);
      let distanceDirty = false;
      if (Math.abs(this._lastDistance - currDistance) > MathUtil.zeroTolerance) {
        distanceDirty = true;
        this._lastDistance = currDistance;
      }

      let orthoSizeDirty = false;
      if (
        this._sceneCamera.isOrthographic &&
        Math.abs(this._lastOrthoSize - this._sceneCamera.orthographicSize) > MathUtil.zeroTolerance
      ) {
        orthoSizeDirty = true;
        this._lastOrthoSize = this._sceneCamera.orthographicSize;
      }

      if (this._group._gizmoTransformDirty || distanceDirty || orthoSizeDirty) {
        this._traverseControl(this._type, (control) => {
          this._type === State.all ? control.onUpdate(true) : control.onUpdate(false);
        });
        this._group._gizmoTransformDirty = false;
      }
      if (pointer) {
        if ((pointer.pressedButtons & PointerButton.Primary) !== 0) {
          this._framebufferPicker.pick(pointer.position.x, pointer.position.y).then((result) => {
            if (result) {
              this._selectHandler(result, pointer.position);
            }
          });
        } else {
          this._sceneCamera.screenPointToRay(pointer.position, this._tempRay);
          const isHit = this.engine.physicsManager.raycast(this._tempRay, Number.MAX_VALUE, this._layer);

          if (isHit) {
            const originLayer = this._sceneCamera.cullingMask;
            this._sceneCamera.cullingMask = this._layer;

            const result = this._framebufferPicker.pick(pointer.position.x, pointer.position.y);
            this._sceneCamera.cullingMask = originLayer;

            result.then((result) => {
              this._onGizmoHoverEnd();
              if (result) {
                this._overHandler(result);
              }
            });
          }
        }
      }
    }
  }

  private _createGizmoControl(type: State, gizmoComponent: new (entity: Entity) => GizmoComponent): void {
    const control = this.entity.createChild(type.toString()).addComponent(gizmoComponent);
    this._controlMap.push(control);
  }

  private _onGizmoHoverStart(currentType: State, axisName: string): void {
    if (!this._isHovered) {
      this._isHovered = true;
      this._traverseControl(currentType, (control) => {
        this._currentControl = control;
      });

      this._currentControl.onHoverStart(axisName);
    }
  }

  private _onGizmoHoverEnd(): void {
    if (this._isHovered) {
      this._currentControl && this._currentControl.onHoverEnd();
      this._isHovered = false;
    }
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
    const material = (<MeshRenderer>result).getMaterial();
    const currentControl = parseInt(material.name);
    const hoverEntity = result.entity;
    this._onGizmoHoverStart(currentControl, hoverEntity.name);
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
}
