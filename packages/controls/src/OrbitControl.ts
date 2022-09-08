import { Camera, Canvas, InputManager, Script, Transform, Vector3 } from "oasis-engine";
import { ControlHandlerType } from "./enums/ControlHandlerType";
import { IControlInput } from "./inputDevice/IControlInput";
import { ControlKeyboard } from "./inputDevice/ControlKeyboard";
import { ControlPointer } from "./inputDevice/ControlPointer";
import { ControlWheel } from "./inputDevice/ControlWheel";
import { Spherical } from "./Spherical";

/**
 * The camera's track controller, can rotate, zoom, pan, support mouse and touch events.
 */
export class OrbitControl extends Script {
  canvas: Canvas;
  input: InputManager;
  inputDevices: IControlInput[] = [ControlKeyboard, ControlPointer, ControlWheel];
  camera: Camera;
  cameraTransform: Transform;

  /** Target position. */
  target: Vector3 = new Vector3();
  /** Up vector */
  up: Vector3 = new Vector3(0, 1, 0);
  /** Whether to automatically rotate the camera, the default is false. */
  autoRotate: boolean = false;
  /** The radian of automatic rotation per second. */
  autoRotateSpeed: number = Math.PI;
  /** Whether to enable keyboard. */
  enableKeys: boolean = false;
  /** Whether to enable camera damping, the default is true. */
  enableDamping: boolean = true;
  /** Rotation speed, default is 1.0 . */
  rotateSpeed: number = 1.0;
  /** Camera zoom speed, the default is 1.0. */
  zoomSpeed: number = 1.0;
  /** Keyboard translation speed, the default is 7.0 . */
  keyPanSpeed: number = 7.0;
  /** Rotation damping parameter, default is 0.1 . */
  dampingFactor: number = 0.1;
  /** Zoom damping parameter, default is 0.2 . */
  zoomFactor: number = 0.2;
  /**  The minimum distance, the default is 0.1, should be greater than 0. */
  minDistance: number = 0.1;
  /** The maximum distance, the default is infinite, should be greater than the minimum distance. */
  maxDistance: number = Infinity;
  /** Minimum zoom speed, the default is 0.0. */
  minZoom: number = 0.0;
  /** Maximum zoom speed, the default is positive infinity. */
  maxZoom: number = Infinity;
  /** The minimum radian in the vertical direction, the default is 0 radian, the value range is 0 - Math.PI. */
  minPolarAngle: number = 0.0;
  /** The maximum radian in the vertical direction, the default is Math.PI, and the value range is 0 - Math.PI. */
  maxPolarAngle: number = Math.PI;
  /** The minimum radian in the horizontal direction, the default is negative infinity. */
  minAzimuthAngle: number = -Infinity;
  /** The maximum radian in the horizontal direction, the default is positive infinity.  */
  maxAzimuthAngle: number = Infinity;

  private _spherical: Spherical = new Spherical();
  private _sphericalDelta: Spherical = new Spherical();
  private _sphericalDump: Spherical = new Spherical();
  private _zoomFrag: number = 0;
  private _scale: number = 1;
  private _panOffset: Vector3 = new Vector3();
  private _tempVec3: Vector3 = new Vector3();
  private _enableHandler: number = ControlHandlerType.All;

  /**
   *  Return Whether to enable rotation, the default is true.
   */
  get enableRotate(): boolean {
    return (this._enableHandler & ControlHandlerType.ROTATE) !== 0;
  }

  set enableRotate(value: boolean) {
    if (value) {
      this._enableHandler |= ControlHandlerType.ROTATE;
    } else {
      this._enableHandler &= ~ControlHandlerType.ROTATE;
    }
  }

  /**
   *  Whether to enable camera damping, the default is true.
   */
  get enableZoom(): boolean {
    return (this._enableHandler & ControlHandlerType.ZOOM) !== 0;
  }

  set enableZoom(value: boolean) {
    if (value) {
      this._enableHandler |= ControlHandlerType.ZOOM;
    } else {
      this._enableHandler &= ~ControlHandlerType.ZOOM;
    }
  }

  /**
   *  Whether to enable translation, the default is true.
   */
  get enablePan(): boolean {
    return (this._enableHandler & ControlHandlerType.PAN) !== 0;
  }

  set enablePan(value: boolean) {
    if (value) {
      this._enableHandler |= ControlHandlerType.PAN;
    } else {
      this._enableHandler &= ~ControlHandlerType.PAN;
    }
  }

  onAwake(): void {
    const { engine, entity } = this;
    this.canvas = engine.canvas;
    this.input = engine.inputManager;
    this.camera = entity.getComponent(Camera);
    this.cameraTransform = entity.transform;
  }

  onUpdate(deltaTime: number): void {
    /** Update this._sphericalDelta, this._scale and this._panOffset. */
    this._updateInputDelta(deltaTime);
    /** Update camera's transform. */
    this._updateTransform();
  }

  private _updateInputDelta(deltaTime: number): void {
    let curHandlerType = ControlHandlerType.None;
    const { _tempVec3: delta, _enableHandler: enableHandler } = this;
    const { inputDevices, input } = this;
    for (let i = inputDevices.length - 1; i >= 0; i--) {
      const handler = inputDevices[i];
      const handlerType = handler.onUpdateHandler(input);
      if (handlerType & enableHandler) {
        curHandlerType |= handlerType;
        handler.onUpdateDelta(this, delta);
        switch (handlerType) {
          case ControlHandlerType.ROTATE:
            this._rotate(delta);
            break;
          case ControlHandlerType.ZOOM:
            this._zoom(delta);
            break;
          case ControlHandlerType.PAN:
            this._pan(delta);
            break;
          default:
            break;
        }
      }
    }
    const { _sphericalDump, _sphericalDelta } = this;
    if (this.enableDamping) {
      if (enableHandler & ControlHandlerType.ZOOM && curHandlerType ^ ControlHandlerType.ZOOM) {
        this._zoomFrag *= 1 - this.zoomFactor;
      }
      if (enableHandler & ControlHandlerType.ROTATE && curHandlerType ^ ControlHandlerType.ROTATE) {
        _sphericalDelta.theta = _sphericalDump.theta *= 1 - this.dampingFactor;
        _sphericalDelta.phi = _sphericalDump.phi *= 1 - this.dampingFactor;
      }
    }
    if (curHandlerType === ControlHandlerType.None && this.autoRotate) {
      const rotateAngle = (this.autoRotateSpeed / 1000) * deltaTime;
      _sphericalDelta.theta -= rotateAngle;
    }
  }

  private _rotate(delta: Vector3): void {
    const radianLeft = ((2 * Math.PI * delta.x) / this.canvas.width) * this.rotateSpeed;
    this._sphericalDelta.theta -= radianLeft;
    const radianUp = ((2 * Math.PI * delta.y) / this.canvas.height) * this.rotateSpeed;
    this._sphericalDelta.phi -= radianUp;
    if (this.enableDamping) {
      this._sphericalDump.theta = -radianLeft;
      this._sphericalDump.phi = -radianUp;
    }
  }

  private _zoom(delta: Vector3): void {
    if (delta.y > 0) {
      this._scale /= Math.pow(0.95, this.zoomSpeed);
    } else if (delta.y < 0) {
      this._scale *= Math.pow(0.95, this.zoomSpeed);
    }
  }

  private _pan(delta: Vector3): void {
    const { cameraTransform } = this;
    const { elements } = cameraTransform.worldMatrix;
    const { height } = this.canvas;
    const targetDistance =
      Vector3.distance(cameraTransform.position, this.target) * (this.camera.fieldOfView / 2) * (Math.PI / 180);
    const distanceLeft = -2 * delta.x * (targetDistance / height);
    const distanceUp = 2 * delta.y * (targetDistance / height);
    this._panOffset.x += elements[0] * distanceLeft + elements[4] * distanceUp;
    this._panOffset.y += elements[1] * distanceLeft + elements[5] * distanceUp;
    this._panOffset.z += elements[2] * distanceLeft + elements[6] * distanceUp;
  }

  private _updateTransform(): void {
    const { cameraTransform, target, _tempVec3, _spherical, _sphericalDelta, _panOffset } = this;
    Vector3.subtract(cameraTransform.position, target, _tempVec3);
    _spherical.setFromVec3(_tempVec3);
    _spherical.theta += _sphericalDelta.theta;
    _spherical.phi += _sphericalDelta.phi;
    _spherical.theta = Math.max(this.minAzimuthAngle, Math.min(this.maxAzimuthAngle, _spherical.theta));
    _spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, _spherical.phi));
    _spherical.makeSafe();

    if (this._scale !== 1) {
      this._zoomFrag = _spherical.radius * (this._scale - 1);
    }
    _spherical.radius += this._zoomFrag;
    _spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, _spherical.radius));
    _spherical.setToVec3(_tempVec3);
    Vector3.add(target.add(_panOffset), _tempVec3, cameraTransform.position);
    cameraTransform.lookAt(target, this.up);
    /** Reset cache value. */
    this._zoomFrag = 0;
    this._scale = 1;
    _sphericalDelta.set(0, 0, 0);
    _panOffset.set(0, 0, 0);
  }
}
