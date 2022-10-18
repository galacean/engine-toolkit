import {
  Camera,
  Color,
  Entity,
  Layer,
  Matrix,
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

  private static _tempQuat: Quaternion = new Quaternion();
  private static _tempMat: Matrix = new Matrix();

  private static _vector: Vector3 = new Vector3();

  private _isTriggered: boolean = false;
  private _speedXFactor: number = 0.02;
  private _speedYFactor: number = 0.004;
  private _isTargetMode: boolean = false;

  private _directionEntity: Entity;
  private _endEntity: Entity;
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
  private _target: Vector3 = SphereScript._vector;
  private _currentPos: Vector3 = new Vector3();
  private _rotateVec: Vector3 = new Vector3();
  private _unitVec: Vector3 = new Vector3(1, 1, 1);

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
      this._target = SphereScript._vector;
    }
  }

  onAwake() {
    const gizmoEntity = this.entity.parent;
    this._directionEntity = gizmoEntity.findByName("direction");
    this._roundEntity = this.entity.findByName("round");
    this._endEntity = this._directionEntity.findByName("end");
    this._gizmoCameraEntity = gizmoEntity.findByName("gizmo-camera");
    this._gizmoCamera = this._gizmoCameraEntity.getComponent(Camera);

    // original text color
    this._getTextColor();
  }

  onPointerEnter() {
    this._roundEntity.isActive = true;
  }

  onPointerExit() {
    if (!this._isTriggered) {
      this._roundEntity.isActive = false;
    }
  }

  onPointerDown() {
    if (this._controls) {
      if (!this._isTargetMode) {
        this._target = this._controls.target;
      }

      this._controls.enabled = false;
    }

    this._sceneCamera.isOrthographic = false;
    this._recoverTextColor();

    // get targetPoint
    SphereScript._startPos.copyFrom(this._sceneCameraEntity.transform.worldPosition);

    SphereScript._startQuat.copyFrom(this._directionEntity.transform.rotationQuaternion);
    SphereScript._startPointer.copyFrom(this.engine.inputManager.pointerPosition);

    this._isTriggered = true;
  }

  onPointerDrag() {
    const movePointer = this.engine.inputManager.pointerPosition;

    Vector2.subtract(SphereScript._startPointer, movePointer, this._tempPointer);
    this._navigateCamera(-this._tempPointer.x * this._speedXFactor, -this._tempPointer.y * this._speedYFactor);
  }

  onPointerUp() {
    if (this._isTriggered) {
      this._isTriggered = false;
      this._gizmoCamera.screenPointToRay(this.engine.inputManager.pointerPosition, this._ray);
      const result = this.engine.physicsManager.raycast(this._ray, Number.MAX_VALUE, Layer.Everything);
      if (!result) {
        this._roundEntity.isActive = false;
      }
      if (this._controls) {
        this._sceneCameraEntity.transform.getWorldUp(this._upVec);

        this._controls.enabled = true;
        this._controls.up = this._upVec;
      }
    }
  }

  onUpdate() {
    if (this._isTriggered) {
      SphereScript._tempQuat.copyFrom(this._directionEntity.transform.rotationQuaternion);
      SphereScript._tempQuat.invert();

      Matrix.affineTransformation(this._unitVec, SphereScript._tempQuat, this._currentPos, this._tempMat);

      this._sceneCameraEntity.transform.worldMatrix = this._tempMat;
    } else {
      SphereScript._tempMat.copyFrom(this._sceneCamera.viewMatrix);
      const { elements: ele } = SphereScript._tempMat;
      // ignore translate
      ele[12] = ele[13] = ele[14] = 0;
      this._directionEntity.transform.worldMatrix = SphereScript._tempMat;
    }
  }

  // delta x translate to rotation around axis y
  // delta y translate to rotation around axis x
  private _navigateCamera(x: number, y: number) {
    Quaternion.rotationYawPitchRoll(x, y, 0, this._tempQuat);
    Quaternion.multiply(SphereScript._startQuat, this._tempQuat, this._tempQuat2);
    this._directionEntity.transform.rotationQuaternion = this._tempQuat2;
    Vector3.subtract(SphereScript._startPos, this._target, this._rotateVec);
    Vector3.transformByQuat(this._rotateVec, this._tempQuat.invert(), this._currentPos);
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
