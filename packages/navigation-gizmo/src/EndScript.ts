import { Camera, Color, Entity, MathUtil, Matrix, Quaternion, Script, TextRenderer, Vector3 } from "oasis-engine";

/** @internal */
export class EndScript extends Script {
  private static _vector: Vector3 = new Vector3();

  private _isTargetMode: boolean = false;

  private _flipView: boolean = false;
  private _flipSpeed = 3.0;
  private _progress: number = 0;

  private _sceneCamera: Camera;
  private _sceneCameraEntity: Entity;
  private _control: any;

  private _backEntity: Entity;
  private _textRenderer: TextRenderer;
  private _textColor: Color = new Color();

  private _target: Vector3 = EndScript._vector;

  private _normalQuat: Quaternion = new Quaternion();
  private _tempMat: Matrix = new Matrix();
  private _targetMat: Matrix = new Matrix();
  private _currentMat: Matrix = new Matrix();
  private _startMat: Matrix = new Matrix();
  private _tempVect: Vector3 = new Vector3();
  private _tempEyeVect: Vector3 = new Vector3();
  private _upVector: Vector3 = new Vector3(0, 1, 0);

  private AxisFactor = {
    x: {
      upVector: this._upVector,
      axis: "x",
      factor: 1,
      unit: new Vector3(0, 0.001, 0)
    },
    y: {
      upVector: this._upVector,
      axis: "y",
      factor: 1,
      unit: new Vector3(0, 0, 0.001)
    },
    z: {
      upVector: this._upVector,
      axis: "z",
      factor: 1,
      unit: new Vector3(0, 0.001, 0)
    },
    "-x": {
      upVector: this._upVector,
      axis: "x",
      factor: -1,
      unit: new Vector3(0, 0.001, 0)
    },
    "-y": {
      upVector: new Vector3(0, -1, 0),
      axis: "y",
      factor: -1,
      unit: new Vector3(0, 0, -0.001)
    },
    "-z": {
      upVector: this._upVector,
      axis: "z",
      factor: -1,
      unit: new Vector3(0, 0.001, 0)
    }
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
  }

  /**
   * @return control component on the same camera, such as orbitControl
   */
  get control(): any {
    return this._control;
  }

  set control(control: any) {
    this._control = control;
  }

  /**
   * @return target point
   */
  get target(): Vector3 {
    return this._target;
  }

  set target(target: Vector3) {
    if (target) {
      this._target.copyFrom(target);
      this._isTargetMode = true;
    } else {
      this._isTargetMode = false;
      this._target.copyFrom(EndScript._vector);
    }
  }

  onAwake() {
    const textEntity = this.entity.findByName("text");
    this._textRenderer = textEntity.getComponent(TextRenderer);
    this._textColor.copyFrom(this._textRenderer.color);

    this._backEntity = this.entity.findByName("back");
  }

  onPointerEnter() {
    this._textRenderer.color.set(1, 1, 1, 1);
    this._backEntity.isActive = true;
  }

  onPointerExit() {
    this._textRenderer.color.copyFrom(this._textColor);
    this._backEntity.isActive = false;
  }

  onPointerClick() {
    if (this._control) {
      if (!this._isTargetMode) {
        this._target.copyFrom(this._control.target);
      }
      this._control.enabled = false;
    }

    const currentAxisName = this.entity.name;
    this._startMat = this._sceneCameraEntity.transform.worldMatrix.clone();
    this._currentMat = this._sceneCameraEntity.transform.worldMatrix;
    this._targetMat = this._getTargetMatrix(this._sceneCameraEntity, currentAxisName);

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

        if (this._control) {
          this._control.enabled = true;
          this._control.target = this._target;
          this._control.up = this._upVector;
        }
      }

      Matrix.lerp(this._startMat, this._targetMat, t, this._currentMat);
      this._sceneCameraEntity.transform.worldMatrix = this._currentMat;
    }
  }

  private _getTargetMatrix(entity: Entity, axisName: string) {
    const { _target: tempTargetVect, _tempEyeVect: tempEyeVect, _tempVect: tempVect, _tempMat: tempMat } = this;
    const { upVector, factor, axis, unit } = this.AxisFactor[axisName];

    Vector3.subtract(entity.transform.worldPosition, tempTargetVect, tempVect);
    const radius = tempVect.length();
    unit[axis] = factor * radius;

    // get eye position
    Vector3.add(unit, tempTargetVect, tempEyeVect);

    // get worldMatrix for scene camera
    Matrix.lookAt(tempEyeVect, tempTargetVect, upVector, tempMat);
    tempMat.invert();
    return tempMat;
  }
}
