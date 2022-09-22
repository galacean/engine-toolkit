import {
  Camera,
  Color,
  Entity,
  MathUtil,
  Matrix,
  Quaternion,
  Script,
  TextRenderer,
  Vector3,
} from "oasis-engine";

import { OrbitControl } from "@oasis-engine-toolkit/controls";

/** @internal */
export class EndScript extends Script {
  private static _vector: Vector3 = new Vector3();

  private _isTargetMode: boolean = false;

  private _flipView: boolean = false;
  private _flipSpeed = 3.0;
  private _progress: number = 0;

  private _sceneCamera: Camera;
  private _sceneCameraEntity: Entity;
  private _controls: OrbitControl;

  private _textRenderer: TextRenderer;
  private _textColor: Color = new Color();

  private _target: Vector3 = new Vector3();

  private _normalQuat: Quaternion = new Quaternion();
  private _tempMat: Matrix = new Matrix();
  private _targetMat: Matrix = new Matrix();
  private _currentMat: Matrix = new Matrix();
  private _startMat: Matrix = new Matrix();
  private _tempVect: Vector3 = new Vector3();
  private _tempUnit: Vector3 = new Vector3();
  private _tempEyeVect: Vector3 = new Vector3();
  private _upVector: Vector3 = new Vector3();
  private _tempRotateVect: Vector3 = new Vector3();

  private AxisFactor = {
    x: {
      upVector: new Vector3(0, 1, 0),
      axis: "x",
      factor: 1,
    },
    y: {
      upVector: new Vector3(0, 0, 1),
      axis: "y",
      factor: 1,
    },
    z: {
      upVector: new Vector3(0, 1, 0),
      axis: "z",
      factor: 1,
    },
    "-x": {
      upVector: new Vector3(0, 1, 0),
      axis: "x",
      factor: -1,
    },
    "-y": {
      upVector: new Vector3(0, 0, -1),
      axis: "y",
      factor: -1,
    },
    "-z": {
      upVector: new Vector3(0, 1, 0),
      axis: "z",
      factor: -1,
    },
  };

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

  set target(target: Vector3 | null) {
    if (target) {
      this._target = target;
      this._isTargetMode = true;
    } else {
      this._isTargetMode = false;
      this._target = EndScript._vector;
    }
  }
  onAwake() {
    const textEntity = this.entity.findByName("text");
    this._textRenderer = textEntity.getComponent(TextRenderer);
    this._textColor.copyFrom(this._textRenderer.color);
  }

  onPointerEnter() {
    this._textRenderer.color.set(1, 1, 1, 1);
  }

  onPointerExit() {
    this._textRenderer.color.copyFrom(this._textColor);
  }

  onPointerClick() {
    if (this._controls) {
      if (!this._isTargetMode) {
        this._target = this._controls.target;
      }
      this._controls.enabled = false;
    }

    this._textRenderer.color.set(0, 0, 0, 1);
    this._textColor.copyFrom(this._textRenderer.color);

    const currentAxisName = this.entity.name;
    this._startMat = this._sceneCameraEntity.transform.worldMatrix.clone();
    this._currentMat = this._sceneCameraEntity.transform.worldMatrix;
    this._targetMat = this._getTargetMatrix(
      this._sceneCameraEntity,
      currentAxisName
    );

    this._flipView = true;
  }

  onUpdate(deltaTime: number) {
    this.entity.transform.worldRotationQuaternion = this._normalQuat;

    if (this._flipView) {
      this._progress += deltaTime / 1000;
      let t = MathUtil.clamp(this._progress * this._flipSpeed, 0, 1);
      if (t >= 1) {
        this._flipView = false;
        this._progress = 0;

        this._sceneCameraEntity.transform.getWorldUp(this._upVector);
        if (this._controls) {
          this._controls.enabled = true;
          this._controls.up = this._upVector;
          this._controls.target = this._target;
        }
      }

      Matrix.lerp(this._startMat, this._targetMat, t, this._currentMat);
      this._sceneCameraEntity.transform.worldMatrix = this._currentMat;
    }
  }

  private _getTargetMatrix(entity: Entity, axisName: string) {
    const {
      _tempRotateVect: tempRotateVect,
      _target: tempTargetVect,
      _tempEyeVect: tempEyeVect,
      _tempVect: tempVect,
      _tempMat: tempMat,
      _tempUnit: tempUnit,
    } = this;
    const { upVector, factor, axis } = this.AxisFactor[axisName];

    Vector3.subtract(entity.transform.worldPosition, tempTargetVect, tempVect);
    const radius = tempVect.length();
    tempRotateVect.copyFrom(tempUnit);
    tempRotateVect[axis] = factor * radius;

    // get eye position
    Vector3.add(tempRotateVect, tempTargetVect, tempEyeVect);

    // get worldMatrix for scene camera
    Matrix.lookAt(tempEyeVect, tempTargetVect, upVector, tempMat);

    tempMat.invert();

    return tempMat;
  }
}
