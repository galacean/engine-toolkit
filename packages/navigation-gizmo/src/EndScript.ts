import {
  Camera,
  Color,
  Component,
  Entity,
  MathUtil,
  Matrix,
  Quaternion,
  Script,
  TextRenderer,
  Vector3
} from "oasis-engine";

/** @internal */
export class EndScript extends Script {
  private static _vector: Vector3 = new Vector3();

  private _flipView: boolean = false;
  private _flipSpeed = 3.0;
  private _progress: number = 0;

  private _sceneCamera: Camera;
  private _sceneCameraEntity: Entity;

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

  private _disabledCompArray: Array<Component> = [];

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
   * target point for gizmo, default (0,0,0)
   * @return target point
   */
  get target(): Vector3 {
    return this._target;
  }

  set target(value: Vector3) {
    this._target.copyFrom(value);
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
    this._disableComponent();

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

        this._enableComponent();
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

  private _disableComponent() {
    const components = [];
    this._sceneCameraEntity.getComponents(Script, components);
    for (let i = 0; i < components.length; i++) {
      const currentComponent = components[i];
      const proto = Object.getPrototypeOf(currentComponent);
      if (proto.onUpdate || proto.onLateUpdate || proto.onPhysicsUpdate) {
        if (currentComponent.enabled) {
          currentComponent.enabled = false;
          this._disabledCompArray.push(currentComponent);
        }
      }
    }
  }

  private _enableComponent() {
    for (let i = 0; i < this._disabledCompArray.length; i++) {
      const currentComponent = this._disabledCompArray[i];
      currentComponent.enabled = true;
    }
  }
}
