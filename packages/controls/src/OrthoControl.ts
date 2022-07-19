import { Camera, Canvas, Entity, InputManager, Script, Transform, Vector3 } from "oasis-engine";
import { ControlHandlerType } from "./enums/ControlHandlerType";
import { IControlInput } from "./inputDevice/IControlInput";
import { ControlKeyboard } from "./inputDevice/ControlKeyboard";
import { ControlPointer } from "./inputDevice/ControlPointer";
import { ControlWheel } from "./inputDevice/ControlWheel";

/**
 * The camera's track controller, can rotate, zoom, pan, support mouse and touch events.
 */
export class OrthoControl extends Script {
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

  private _zoomScaleUnit: number = 25;
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

  constructor(entity: Entity) {
    super(entity);
    this.enableRotate = false;
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
    this._updateCamera();
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
  }

  private _zoom(delta: Vector3): void {
    if (delta.y > 0) {
      this._scale /= Math.pow(0.95, this.zoomSpeed);
    } else if (delta.y < 0) {
      this._scale *= Math.pow(0.95, this.zoomSpeed);
    }
  }

  private _pan(delta: Vector3): void {
    this._panOffset.copyFrom(delta);
  }

  private _updateCamera(): void {
    const { cameraTransform, camera, _panOffset } = this;

    // Update Zoom
    const sizeDiff = this._zoomScaleUnit * (this._scale - 1);
    const size = camera.orthographicSize + sizeDiff;
    camera.orthographicSize = Math.max(this.minZoom, Math.min(this.maxZoom, size));
    
    // Update X and Y
    const { width, height } = this.canvas;
    const { x, y } = _panOffset;
    const doubleOrthographicSize = camera.orthographicSize * 2;
    const width3D = doubleOrthographicSize * camera.aspectRatio;
    const height3D = doubleOrthographicSize;
    const cameraPosition = cameraTransform.position;
    const curPosition = this._tempVec3;
    curPosition.x = cameraPosition.x - (x * width3D) / width;
    curPosition.y = cameraPosition.y + (y * height3D) / height;
    curPosition.z = cameraPosition.z;
    
    // Update camera transform
    cameraTransform.position = curPosition;
    /** Reset cache value. */
    this._scale = 1;
    _panOffset.set(0, 0, 0);
  }
}
