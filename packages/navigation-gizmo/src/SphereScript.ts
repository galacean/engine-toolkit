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
import { NavigationGizmo } from "./NavigationGizmo";
export class SphereScript extends Script {
  private isTriggered: boolean = false;
  private speedXFactor: number = 0.02;
  private speedYFactor: number = 0.002;

  private _radius: number = 15;

  private _directionEntity: Entity;
  private _endEntity: Entity;
  private _roundEntity: Entity;
  private _gizmoCamera: Camera;
  private _gizmoCameraEntity: Entity;
  private _textColor: Array<Color> = [];

  private _sceneCamera: Camera;
  private _sceneCameraEntity: Entity;
  private _orbitControl: OrbitControl | null;

  private _startQuat: Quaternion = new Quaternion();
  private _startPointer: Vector2 = new Vector2();

  private _tempQuat: Quaternion = new Quaternion();
  private _tempQuat2: Quaternion = new Quaternion();
  private _tempQuat3: Quaternion = new Quaternion();
  private _tempPointer: Vector2 = new Vector2();
  private _startPos: Vector3 = new Vector3();
  private _rotateVec: Vector3 = new Vector3();
  private _targetPoint: Vector3 = new Vector3();
  private _currentPos: Vector3 = new Vector3();
  private _unitVec: Vector3 = new Vector3(1, 1, 1);
  private _tempMat: Matrix = new Matrix();

  private _ray: Ray = new Ray();

  constructor(entity: Entity) {
    super(entity);

    const rootEntity = this.entity.parent;
    this._directionEntity = rootEntity.findByName("direction");
    this._roundEntity = this.entity.findByName("round");
    this._endEntity = this._directionEntity.findByName("end");
    this._gizmoCameraEntity = rootEntity.findByName("gizmo-camera");
    this._gizmoCamera = this._gizmoCameraEntity.getComponent(Camera);

    // scene camera
    this._sceneCamera = rootEntity.parent.getComponent(NavigationGizmo).camera;

    this._sceneCameraEntity = this._sceneCamera.entity;
    this._orbitControl = this._sceneCameraEntity.getComponent(OrbitControl);

    // original text color
    this._getTextColor();
  }

  onPointerEnter() {
    this._roundEntity.isActive = true;
  }

  onPointerExit() {
    if (!this.isTriggered) {
      this._roundEntity.isActive = false;
    }
  }

  onPointerDown() {
    if (this._orbitControl) {
      this._orbitControl.enabled = false;
    }

    this._sceneCamera.isOrthographic = false;
    this._recoverTextColor();

    // get targetPoint
    // TODO set as orbit target
    this._startPos = this._sceneCameraEntity.transform.worldPosition.clone();
    this._sceneCameraEntity.transform.getWorldForward(this._rotateVec);
    this._rotateVec.scale(this._radius);
    Vector3.add(this._startPos, this._rotateVec, this._targetPoint);

    this._startQuat = this._directionEntity.transform.rotationQuaternion.clone();
    this._startPointer = this.engine.inputManager.pointerPosition.clone();

    this.isTriggered = true;
  }

  onPointerDrag() {
    const movePointer = this.engine.inputManager.pointerPosition;

    Vector2.subtract(this._startPointer, movePointer, this._tempPointer);
    this._navigateCamera(this._tempPointer.x * this.speedXFactor, this._tempPointer.y * this.speedYFactor);
  }

  onPointerUp() {
    if (this.isTriggered) {
      this.isTriggered = false;
      this._gizmoCamera.screenPointToRay(this.engine.inputManager.pointerPosition, this._ray);
      const result = this.engine.physicsManager.raycast(this._ray, Number.MAX_VALUE, Layer.Everything);
      if (!result) {
        this._roundEntity.isActive = false;
      }
      if (this._orbitControl) {
        this._orbitControl.enabled = true;
      }
    }
  }

  // delta x translate to rotation around axis y
  // delta y translate to rotation around axis x
  _navigateCamera(x: number, y: number) {
    Quaternion.rotationYawPitchRoll(x, y, 0, this._tempQuat);
    Quaternion.multiply(this._startQuat, this._tempQuat, this._tempQuat2);
    this._directionEntity.transform.rotationQuaternion = this._tempQuat2;

    Vector3.transformByQuat(this._startPos, this._tempQuat.invert(), this._currentPos);

    Vector3.add(this._targetPoint, this._currentPos, this._currentPos);
  }

  _getTextColor() {
    const entities = this._endEntity.children;
    for (let i = 0; i < entities.length; i++) {
      const textEntity = entities[i].findByName("text");
      const textRenderer = textEntity.getComponent(TextRenderer);
      const textColor = textRenderer.color.clone();
      this._textColor.push(textColor);
    }
  }

  _recoverTextColor() {
    const entities = this._endEntity.children;
    for (let i = 0; i < entities.length; i++) {
      const textEntity = entities[i].findByName("text");
      const textRenderer = textEntity.getComponent(TextRenderer);
      Object.assign(textRenderer.color, this._textColor[i]);
    }
  }
  onUpdate() {
    if (this.isTriggered) {
      this._tempQuat3 = this._directionEntity.transform.rotationQuaternion.clone();
      this._tempQuat3.invert();

      Matrix.affineTransformation(this._unitVec, this._tempQuat3, this._currentPos, this._tempMat);

      this._sceneCameraEntity.transform.worldMatrix = this._tempMat;
    } else {
      const tempMat = this._sceneCamera.viewMatrix.clone();
      const { elements: ele } = tempMat;
      // ignore translate
      ele[12] = ele[13] = ele[14] = 0;
      this._directionEntity.transform.worldMatrix = tempMat;
    }
  }
}
