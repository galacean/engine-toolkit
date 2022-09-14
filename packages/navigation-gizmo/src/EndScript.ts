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
import { NavigationGizmo } from "./NavigationGizmo";
import { OrbitControl } from "oasis-engine-toolkit";

export class EndScript extends Script {
  private duration: number = 100;

  private _sceneCamera: Camera;
  private _sceneCameraEntity: Entity;
  private _orbitControl: OrbitControl | null;

  private _textRenderer: TextRenderer;
  private _textColor: Color;

  private _tween = new TWEEN.Tween({ t: 0 });

  private _normalQuat: Quaternion = new Quaternion();
  private _tempMat: Matrix = new Matrix();
  private _tempVect: Vector3 = new Vector3();
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

  constructor(entity: Entity) {
    super(entity);

    const rootEntity = this.entity.parent.parent.parent;

    // scene camera
    this._sceneCamera =
      rootEntity.parent.getComponent(NavigationGizmo).sceneCamera;
    this._sceneCameraEntity = this._sceneCamera.entity;
    this._orbitControl = this._sceneCameraEntity.getComponent(OrbitControl);

    // text
    const textEntity = this.entity.findByName("text");
    this._textRenderer = textEntity.getComponent(TextRenderer);
    this._textColor = this._textRenderer.color.clone();
  }

  onPointerEnter() {
    this._textRenderer.color.set(1, 1, 1, 1);
  }

  onPointerExit() {
    Object.assign(this._textRenderer.color, this._textColor);
  }

  onPointerClick() {
    const currentAxisName = this.entity.name;

    const startMat = this._sceneCameraEntity.transform.worldMatrix.clone();
    const targetMat = this._getTargetMatrix(
      this._sceneCameraEntity,
      currentAxisName
    );

    const currentMat = this._sceneCameraEntity.transform.worldMatrix;

    TWEEN.remove(this._tween);
    this._tween = new TWEEN.Tween({ t: 0 })
      .to({ t: 1 }, this.duration)
      .onStart(() => {
        if (this._orbitControl) {
          this._orbitControl.enabled = false;
        }

        this._textRenderer.color.set(0, 0, 0, 1);
        this._textColor = this._textRenderer.color.clone();
      })
      .onUpdate(({ t }) => {
        Matrix.lerp(startMat, targetMat, t, currentMat);
        this._sceneCameraEntity.transform.worldMatrix = currentMat;
      })
      .onComplete(() => {
        if (this._orbitControl) {
          this._orbitControl.enabled = true;
        }
        this._sceneCamera.resetProjectionMatrix();
      });

    this._tween.start();
  }

  onUpdate() {
    TWEEN.update();
    this.entity.transform.worldRotationQuaternion = this._normalQuat;
  }

  _getTargetMatrix(entity: Entity, axisName: string) {
    const currentPos = entity.transform.worldPosition;

    const upVector = this.AxisFactor[axisName].upVector;
    const factor = this.AxisFactor[axisName].factor;
    const axis = this.AxisFactor[axisName].axis;

    const radius = this._sceneCameraEntity.transform.worldPosition.length();

    entity.transform.getWorldForward(this._tempVect);
    this._tempVect.scale(radius);

    this._tempRotateVect = new Vector3();
    this._tempRotateVect[axis] = factor * radius;

    // get rotate origin point
    Vector3.add(currentPos, this._tempVect, this._tempPointVect);

    // get position after rotation
    Vector3.add(
      this._tempRotateVect,
      this._tempPointVect,
      this._tempTargetVect
    );

    console.log(axisName, this._tempTargetVect, this._tempPointVect);

    // get worldMatrix for scene camera
    Matrix.lookAt(
      this._tempTargetVect,
      this._tempPointVect,
      upVector,
      this._tempMat
    );
    this._tempMat.invert();

    return this._tempMat;
  }
}
