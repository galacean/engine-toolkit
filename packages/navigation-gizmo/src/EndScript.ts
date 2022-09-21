import {
  Camera,
  Color,
  Entity,
  Matrix,
  Quaternion,
  Script,
  TextRenderer,
  Vector3,
} from "oasis-engine";
import * as TWEEN from "@tweenjs/tween.js";

import { OrbitControl, FreeControl } from "@oasis-engine-toolkit/controls";

/** @internal */
export class EndScript extends Script {
  private static _startMat: Matrix = new Matrix();

  private duration: number = 100;

  private _sceneCamera: Camera;
  private _sceneCameraEntity: Entity;
  private _controls: OrbitControl | FreeControl;

  private _textRenderer: TextRenderer;
  private _textColor: Color = new Color();

  private _tween = new TWEEN.Tween({ t: 0 });

  private _normalQuat: Quaternion = new Quaternion();
  private _tempMat: Matrix = new Matrix();
  private _tempVect: Vector3 = new Vector3();
  private _tempUnit: Vector3 = new Vector3();
  private _tempTargetVect: Vector3 = new Vector3();
  private _tempPointVect: Vector3 = new Vector3();
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
  get camera() {
    return this._sceneCamera;
  }

  set camera(camera: Camera) {
    this._sceneCamera = camera;
    this._sceneCameraEntity = this._sceneCamera.entity;
    this._controls =
      this._sceneCameraEntity.getComponent(OrbitControl) ||
      this._sceneCameraEntity.getComponent(FreeControl);
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
    const currentAxisName = this.entity.name;

    EndScript._startMat.copyFrom(this._sceneCameraEntity.transform.worldMatrix);
    const targetMat = this._getTargetMatrix(
      this._sceneCameraEntity,
      currentAxisName
    );

    const currentMat = this._sceneCameraEntity.transform.worldMatrix;

    TWEEN.remove(this._tween);
    this._tween = new TWEEN.Tween({ t: 0 })
      .to({ t: 1 }, this.duration)
      .onStart(() => {
        if (this._controls) {
          this._controls.enabled = false;
        }

        this._textRenderer.color.set(0, 0, 0, 1);
        this._textColor.copyFrom(this._textRenderer.color);
      })
      .onUpdate(({ t }) => {
        Matrix.lerp(EndScript._startMat, targetMat, t, currentMat);
        this._sceneCameraEntity.transform.worldMatrix = currentMat;
      })
      .onComplete(() => {
        if (this._controls) {
          this._controls.enabled = true;
        }
        this._sceneCamera.resetProjectionMatrix();
      });

    this._tween.start();
  }

  onUpdate() {
    TWEEN.update();
    this.entity.transform.worldRotationQuaternion = this._normalQuat;
  }

  private _getTargetMatrix(entity: Entity, axisName: string) {
    const {
      _tempRotateVect: tempRotateVect,
      _tempPointVect: tempPointVect,
      _tempVect: tempVect,
      _tempTargetVect: tempTargetVect,
      _tempMat: tempMat,
      _tempUnit: tempUnit,
    } = this;

    const currentPos = entity.transform.worldPosition;
    const { upVector, factor, axis } = this.AxisFactor[axisName];
    const radius = this._sceneCameraEntity.transform.worldPosition.length();

    entity.transform.getWorldForward(tempVect);
    tempVect.scale(radius);

    tempRotateVect.copyFrom(tempUnit);
    tempRotateVect[axis] = factor * radius;

    // get rotate origin point
    Vector3.add(currentPos, tempVect, tempPointVect);

    // get position after rotation
    Vector3.add(tempRotateVect, tempPointVect, tempTargetVect);

    // get worldMatrix for scene camera
    Matrix.lookAt(tempTargetVect, tempPointVect, upVector, tempMat);
    tempMat.invert();

    return tempMat;
  }
}
