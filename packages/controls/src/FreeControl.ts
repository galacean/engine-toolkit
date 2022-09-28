import { Entity, InputManager, MathUtil, Script, Transform, Vector3 } from "oasis-engine";
import { ControlHandlerType } from "./enums/ControlHandlerType";
import { ControlFreeKeyboard } from "./inputDevice/ControlFreeKeyboard";
import { ControlFreePointer } from "./inputDevice/ControlFreePointer";
import { IControlInput } from "./inputDevice/IControlInput";
import { Spherical } from "./Spherical";

/**
 * The camera's roaming controller, can move up and down, left and right, and rotate the viewing angle.
 */
export class FreeControl extends Script {
  input: InputManager;
  inputDevices: IControlInput[] = [ControlFreeKeyboard, ControlFreePointer];

  /** Movement distance per second, the unit is the unit before MVP conversion. */
  movementSpeed: number = 1.0;
  /** Rotate speed. */
  rotateSpeed: number = 1.0;
  /** Simulate a ground. */
  floorMock: boolean = true;
  /** Simulated ground height. */
  floorY: number = 0;

  private _cameraTransform: Transform;
  private _spherical: Spherical = new Spherical();
  private _tempVec: Vector3 = new Vector3();

  constructor(entity: Entity) {
    super(entity);
    this.input = this.engine.inputManager;
    const transform = (this._cameraTransform = entity.transform);
    /** Init spherical. */
    const { _tempVec: tempVec, _spherical: spherical } = this;
    Vector3.transformByQuat(tempVec.set(0, 0, -1), transform.rotationQuaternion, tempVec);
    spherical.setFromVec3(tempVec);
  }

  onUpdate(deltaTime: number): void {
    if (this.enabled === false) return;
    let curHandlerType = ControlHandlerType.None;
    const { _tempVec: delta } = this;
    const { inputDevices, input } = this;
    for (let i = inputDevices.length - 1; i >= 0; i--) {
      const handler = inputDevices[i];
      const handlerType = handler.onUpdateHandler(input);
      if (handlerType) {
        curHandlerType |= handlerType;
        handler.onUpdateDelta(this, delta);
        switch (handlerType) {
          case ControlHandlerType.ROTATE:
            this._rotate(delta);
            break;
          case ControlHandlerType.PAN:
            this._pan(delta, deltaTime);
            break;
          default:
            break;
        }
      }
    }
    if (this.floorMock) {
      const position = this._cameraTransform.position;
      if (position.y !== this.floorY) {
        this._cameraTransform.setPosition(position.x, this.floorY, position.z);
      }
    }
  }

  private _pan(moveDelta: Vector3, delta: number): void {
    const actualMoveSpeed = (delta / 1000) * this.movementSpeed;
    moveDelta.normalize().scale(actualMoveSpeed);
    this._cameraTransform.translate(moveDelta, true);
  }

  private _rotate(moveDelta: Vector3): void {
    if (moveDelta.x !== 0 || moveDelta.y !== 0) {
      const canvas = this.engine.canvas;
      const deltaAlpha = (-moveDelta.x * 180) / canvas.width;
      const deltaPhi = (moveDelta.y * 180) / canvas.height;
      this._spherical.theta += MathUtil.degreeToRadian(deltaAlpha);
      this._spherical.phi += MathUtil.degreeToRadian(deltaPhi);
      this._spherical.makeSafe();
      this._spherical.setToVec3(this._tempVec);
      Vector3.add(this._cameraTransform.position, this._tempVec, this._tempVec);
      this._cameraTransform.lookAt(this._tempVec, new Vector3(0, 1, 0));
    }
  }
}
