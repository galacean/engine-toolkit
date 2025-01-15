import {
  Camera,
  Color,
  Component,
  Entity,
  Layer,
  MathUtil,
  Matrix,
  Pointer,
  PointerEventData,
  Quaternion,
  Ray,
  Script,
  TextRenderer,
  Vector2,
  Vector3
} from "@galacean/engine";

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

  private _tempQuat: Quaternion = new Quaternion();
  private _tempQuat2: Quaternion = new Quaternion();
  private _deltaPointer: Vector2 = new Vector2();
  private _tempMat: Matrix = new Matrix();
  private _upVec: Vector3 = new Vector3(0, 1, 0);
  private _topVec: Vector3 = new Vector3(0, 1, 0);
  private _bottomVec: Vector3 = new Vector3(0, -1, 0);
  private _target: Vector3 = SphereScript._vector;
  private _currentPos: Vector3 = new Vector3();
  private _rotateVec: Vector3 = new Vector3();
  private _tempUpVec: Vector3 = new Vector3();
  private _startRadian: number = 0;

  private _ray: Ray = new Ray();
  private _isBack: boolean = false;

  private _disabledCompArray: Array<Component> = [];

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
   * @return target point
   */
  get target(): Vector3 {
    return this._target;
  }

  set target(value: Vector3) {
    this._target.copyFrom(value);
  }

  override onAwake() {
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

  override onPointerEnter() {
    this._roundEntity.isActive = true;
    this._xEntity.isActive = true;
    this._yEntity.isActive = true;
    this._zEntity.isActive = true;
  }

  override onPointerExit() {
    if (!this._isTriggered) {
      this._roundEntity.isActive = false;
      this._xEntity.isActive = false;
      this._yEntity.isActive = false;
      this._zEntity.isActive = false;
    }
  }

  override onPointerDown(eventData: PointerEventData) {
    this._disableComponent();
    this._recoverTextColor();

    // get targetPoint
    SphereScript._startPos.copyFrom(this._sceneCameraEntity.transform.worldPosition);

    SphereScript._startQuat.copyFrom(this._directionEntity.transform.worldRotationQuaternion);
    SphereScript._startPointer.copyFrom(eventData.pointer.position);

    this._tempUpVec.copyFrom(this._sceneCameraEntity.transform.worldUp);
    this._isBack = this._tempUpVec.y <= 0;
    this._upVec.copyFrom(this._isBack ? this._bottomVec : this._topVec);
    SphereScript._startAxis.copyFrom(this._sceneCameraEntity.transform.worldForward);
    Vector3.cross(SphereScript._startAxis, this._upVec, SphereScript._startAxis);

    Vector3.subtract(SphereScript._startPos, this._target, this._tempUpVec);
    const radius = this._tempUpVec.length();
    const dot = Vector3.dot(this._tempUpVec, this._upVec);
    if (this._isBack) {
      this._startRadian = Math.PI + Math.acos(MathUtil.clamp(dot / radius, -1, 1));
    } else {
      this._startRadian = Math.acos(MathUtil.clamp(dot / radius, -1, 1));
    }

    this._isTriggered = true;
    this._navigateCamera(eventData.pointer);
  }

  override onPointerDrag(eventData: PointerEventData) {
    this._navigateCamera(eventData.pointer);
  }

  override onPointerUp(eventData: PointerEventData) {
    if (this._isTriggered) {
      this._gizmoCamera.screenPointToRay(eventData.pointer.position, this._ray);
      const result = this.engine.physicsManager.raycast(this._ray, Number.MAX_VALUE, Layer.Everything);
      if (!result) {
        this._roundEntity.isActive = false;
        this._xEntity.isActive = false;
        this._yEntity.isActive = false;
        this._zEntity.isActive = false;
      }

      this._isTriggered = false;
      this._enableComponent();
    }
  }
  override onUpdate() {
    if (this._isTriggered) {
      this._upVec.copyFrom(this._isBack ? this._bottomVec : this._topVec);
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
    Vector2.subtract(SphereScript._startPointer, movePointer, this._deltaPointer);

    let x = -this._deltaPointer.x * this._speedXFactor;
    let y = -this._deltaPointer.y * this._speedYFactor;

    const isBetween = this._startRadian - y > Math.PI && this._startRadian - y < 2 * Math.PI;

    this._isBack = this._startRadian - y <= 0 || isBetween;

    const { _tempQuat: tempQuat, _tempQuat2: tempQuat2 } = this;

    Quaternion.rotationAxisAngle(SphereScript._startAxis, y, tempQuat);
    Quaternion.rotationYawPitchRoll(0, x, 0, tempQuat2);
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
