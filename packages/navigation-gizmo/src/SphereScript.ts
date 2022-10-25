import {
  Camera,
  Color,
  Entity,
  Layer,
  Matrix,
  Pointer,
  Quaternion,
  Ray,
  Script,
  TextRenderer,
  Vector2,
  Vector3
} from "oasis-engine";

import { OrbitControl } from "@oasis-engine-toolkit/controls";

/** @internal */
export class SphereScript extends Script {
  private static _startQuat: Quaternion = new Quaternion();
  private static _startPointer: Vector2 = new Vector2();
  private static _startPos: Vector3 = new Vector3();
  private static _startAxis: Vector3 = new Vector3();
  private static _tempMat: Matrix = new Matrix();

  private static _vector: Vector3 = new Vector3();

  private _isTriggered: boolean = false;
  private _speedXFactor: number = 0.02;
  private _speedYFactor: number = 0.004;
  private _isTargetMode: boolean = false;

  private _directionEntity: Entity;
  private _endEntity: Entity;
  private _xEntity: Entity;
  private _yEntity: Entity;
  private _zEntity: Entity;
  private _roundEntity: Entity;
  private _gizmoCamera: Camera;
  private _gizmoCameraEntity: Entity;
  private _textColor: Array<Color> = [];

  private _sceneCamera: Camera;
  private _sceneCameraEntity: Entity;
  private _controls: OrbitControl;

  private _tempQuat: Quaternion = new Quaternion();
  private _tempQuat2: Quaternion = new Quaternion();
  private _tempPointer: Vector2 = new Vector2();
  private _tempMat: Matrix = new Matrix();
  private _upVec: Vector3 = new Vector3();
  private _topVec: Vector3 = new Vector3(0, 1, 0);
  private _bottomVec: Vector3 = new Vector3(0, -1, 0);
  private _target: Vector3 = SphereScript._vector;
  private _currentPos: Vector3 = new Vector3();
  private _rotateVec: Vector3 = new Vector3();
  private _tempUpVec: Vector3 = new Vector3();

  private _ray: Ray = new Ray();

  /**
   * @return scene camera
   */
  get camera(): Camera {
    return this._sceneCamera;
  }

  set camera(camera: Camera) {
    this._sceneCamera = camera;
    this._sceneCameraEntity = this._sceneCamera.entity;

    this._controls = this._sceneCameraEntity.getComponent(OrbitControl);
  }

  /**
   * @return target point
   */
  get target(): Vector3 {
    return this._target;
  }

  set target(target: Vector3) {
    if (target) {
      this._target = target;
      this._isTargetMode = true;
    } else {
      this._isTargetMode = false;
      this._target = this._controls.target;
    }
  }

  onAwake() {
    const gizmoEntity = this.entity.parent;
    this._directionEntity = gizmoEntity.findByName("direction");
    this._roundEntity = this.entity.findByName("round");
    this._endEntity = this._directionEntity.findByName("end");
    this._gizmoCameraEntity = gizmoEntity.findByName("gizmo-camera");
    this._gizmoCamera = this._gizmoCameraEntity.getComponent(Camera);

    this._xEntity = this._endEntity.findByName("-x").findByName("back");
    this._yEntity = this._endEntity.findByName("-y").findByName("back");
    this._zEntity = this._endEntity.findByName("-z").findByName("back");

    // original text color
    this._getTextColor();
  }

  onPointerEnter() {
    this._roundEntity.isActive = true;
    this._xEntity.isActive = true;
    this._yEntity.isActive = true;
    this._zEntity.isActive = true;
  }

  onPointerExit() {
    if (!this._isTriggered) {
      this._roundEntity.isActive = false;
      this._xEntity.isActive = false;
      this._yEntity.isActive = false;
      this._zEntity.isActive = false;
    }
  }

  onPointerDown(pointer: Pointer) {
    if (this._controls) {
      if (!this._isTargetMode) {
        this._target.copyFrom(this._controls.target);
      }

      this._controls.enabled = false;
    }

    this._sceneCamera.isOrthographic = false;
    this._recoverTextColor();

    // get targetPoint
    SphereScript._startPos.copyFrom(this._sceneCameraEntity.transform.worldPosition);

    SphereScript._startQuat.copyFrom(this._directionEntity.transform.worldRotationQuaternion);
    SphereScript._startPointer.copyFrom(pointer.position);

    this._sceneCameraEntity.transform.getWorldUp(this._tempUpVec);
    this._tempUpVec.y > 0 ? this._upVec.copyFrom(this._topVec) : this._upVec.copyFrom(this._bottomVec);

    this._sceneCameraEntity.transform.getWorldForward(SphereScript._startAxis);
    Vector3.cross(SphereScript._startAxis, this._upVec, SphereScript._startAxis);

    this._isTriggered = true;
    this._navigateCamera(pointer);
  }

  onPointerDrag(pointer: Pointer) {
    this._navigateCamera(pointer);
  }

  onPointerUp(pointer: Pointer) {
    if (this._isTriggered) {
      this._gizmoCamera.screenPointToRay(pointer.position, this._ray);
      const result = this.engine.physicsManager.raycast(this._ray, Number.MAX_VALUE, Layer.Everything);
      if (!result) {
        this._roundEntity.isActive = false;
        this._xEntity.isActive = false;
        this._yEntity.isActive = false;
        this._zEntity.isActive = false;
      }

      this._isTriggered = false;

      if (this._controls) {
        this._controls.enabled = true;
        this._controls.target = this._target;
        this._controls.up = this._upVec;
      }
    }
  }
  onUpdate() {
    if (this._isTriggered) {
      this._sceneCameraEntity.transform.getWorldUp(this._tempUpVec);
      this._tempUpVec.y > 0 ? this._upVec.copyFrom(this._topVec) : this._upVec.copyFrom(this._bottomVec);
      Matrix.lookAt(this._currentPos, this._target, this._upVec, this._tempMat);
      this._tempMat.invert();
      this._sceneCameraEntity.transform.worldMatrix = this._tempMat;
    }
    SphereScript._tempMat.copyFrom(this._sceneCamera.viewMatrix);
    const { elements: ele } = SphereScript._tempMat;
    // ignore translate
    ele[12] = ele[13] = ele[14] = 0;
    this._directionEntity.transform.worldMatrix = SphereScript._tempMat;
  }

  // delta x translate to rotation around axis y
  // delta y translate to rotation around axis vertical to scene camera
  private _navigateCamera(pointer: Pointer) {
    const movePointer = pointer.position;

    Vector2.subtract(SphereScript._startPointer, movePointer, this._tempPointer);
    let x = -this._tempPointer.x * this._speedXFactor;
    let y = -this._tempPointer.y * this._speedYFactor;

    const { _tempQuat: tempQuat, _tempQuat2: tempQuat2 } = this;

    Quaternion.rotationAxisAngle(SphereScript._startAxis, y, tempQuat);
    Quaternion.rotationYawPitchRoll(x, 0, 0, tempQuat2);

    Quaternion.multiply(tempQuat, tempQuat2, tempQuat);
    Vector3.subtract(SphereScript._startPos, this._target, this._rotateVec);
    Vector3.transformByQuat(this._rotateVec, tempQuat.invert(), this._currentPos);
    Vector3.add(this._target, this._currentPos, this._currentPos);
  }

  private _getTextColor() {
    const entities = this._endEntity.children;
    for (let i = 0; i < entities.length; i++) {
      const textEntity = entities[i].findByName("text");
      const textRenderer = textEntity.getComponent(TextRenderer);
      const textColor = textRenderer.color.clone();
      this._textColor.push(textColor);
    }
  }

  private _recoverTextColor() {
    const entities = this._endEntity.children;
    for (let i = 0; i < entities.length; i++) {
      const textEntity = entities[i].findByName("text");
      const textRenderer = textEntity.getComponent(TextRenderer);
      textRenderer.color.copyFrom(this._textColor[i]);
    }
  }
}
