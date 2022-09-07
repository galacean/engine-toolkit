import {
  Camera,
  Color,
  Entity,
  Quaternion,
  Script,
  TextRenderer,
} from "oasis-engine";
import * as TWEEN from "@tweenjs/tween.js";
import { NavigationGizmo } from "./NavigationGizmo";
import { OrbitControl } from "@oasis-engine-toolkit/controls";

const targetQuaternion = {
  x: new Quaternion(0, -1, 0, 1),
  y: new Quaternion(1, 0, 0, 1),
  z: new Quaternion(0, 0, 0, 1),
  "-x": new Quaternion(0, 1, 0, 1),
  "-y": new Quaternion(-1, 0, 0, 1),
  "-z": new Quaternion(0, 1, 0, 0),
};

export class EndScript extends Script {
  private duration: number = 500;

  private _sceneCamera: Camera;
  private _sceneCameraEntity: Entity;
  private _orbitControl: OrbitControl | null;

  private _directionEntity: Entity;
  private _textRenderer: TextRenderer;
  private _textColor: Color;

  private _tween = new TWEEN.Tween({ t: 0 });
  private _normalQuat: Quaternion = new Quaternion();
  private _tempQuat: Quaternion = new Quaternion();

  constructor(entity: Entity) {
    super(entity);

    const rootEntity = this.entity.parent.parent.parent;
    this._directionEntity = rootEntity.findByName("direction");

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
    const targetQuat = targetQuaternion[this.entity.name];
    const currentQuat =
      this._directionEntity.transform.rotationQuaternion.clone();

    TWEEN.remove(this._tween);
    this._tween = new TWEEN.Tween({ t: 0 });
    this._tween
      .to({ t: 1 }, this.duration)
      .onStart(() => {
        if (this._orbitControl) {
          this._orbitControl.enabled = false;
        }

        this._sceneCamera.isOrthographic = true;
        this._textRenderer.color.set(0, 0, 0, 1);
        this._textColor = this._textRenderer.color.clone();
      })
      .onUpdate(({ t }) => {
        Quaternion.lerp(currentQuat, targetQuat, t, this._tempQuat);
        this._directionEntity.transform.rotationQuaternion = this._tempQuat;
        this._sceneCameraEntity.transform.rotation =
          this._directionEntity.transform.rotation;
      })
      .onComplete(() => {
        if (this._orbitControl) {
          this._orbitControl.enabled = true;
        }
      })
      .start();
  }

  onUpdate() {
    TWEEN.update();
    this.entity.transform.worldRotationQuaternion = this._normalQuat;
  }
}
