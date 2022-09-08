import { Entity, InputManager, Keys, MathUtil, Script, Transform, Vector3 } from "oasis-engine";
import { Spherical } from "./Spherical";

// Prevent universal lock.
const ESP = MathUtil.zeroTolerance;

/**
 * The camera's roaming controller, can move up and down, left and right, and rotate the viewing angle.
 */
export class FreeControl extends Script {
  private _input: InputManager;
  private _cameraTransform: Transform;

  /** Movement distance per second, the unit is the unit before MVP conversion. */
  movementSpeed: number = 1.0;
  /** Rotate speed. */
  rotateSpeed: number = 1.0;
  /** Simulate a ground. */
  floorMock: boolean = true;
  /** Simulated ground height. */
  floorY: number = 0;

  private _theta: number;
  private _phi: number;
  private _spherical: Spherical = new Spherical();
  private _tempVec: Vector3 = new Vector3();

  constructor(entity: Entity) {
    super(entity);
    this._input = this.engine.inputManager;
    const transform = (this._cameraTransform = entity.transform);
    /** Init spherical. */
    const { _tempVec: tempVec, _spherical: spherical } = this;
    Vector3.transformByQuat(tempVec, transform.rotationQuaternion, tempVec);
    spherical.setFromVec3(tempVec);
    this._theta = spherical.theta;
    this._phi = spherical.phi;
  }

  onUpdate(delta: number): void {
    if (this.enabled === false) return;
    // 键盘位移
    const { _input: input, _cameraTransform: transform } = this;
    const actualMoveSpeed = (delta / 1000) * this.movementSpeed;
    transform.translate(new Vector3(0, 0, -1));
    const vec = new Vector3();
    if (input.isKeyHeldDown(Keys.ArrowLeft)) {
      vec.add(new Vector3(-1, 0, 0));
    }
    if (input.isKeyHeldDown(Keys.ArrowRight)) {
      vec.add(new Vector3(1, 0, 0));
    }
    if (input.isKeyHeldDown(Keys.ArrowUp)) {
      vec.add(new Vector3(0, 0, -1));
    }
    if (input.isKeyHeldDown(Keys.ArrowDown)) {
      vec.add(new Vector3(0, 0, 1));
    }
    vec.normalize().scale(actualMoveSpeed);
    transform.translate(vec, true);
    if (this.floorMock) {
      const position = transform.position;
      if (position.y !== this.floorY) {
        transform.setPosition(position.x, this.floorY, position.z);
      }
    }

    // 鼠标旋转
    const moveDelta = input.pointerMovingDelta;
    if (moveDelta && moveDelta.x !== 0 && moveDelta.y !== 0) {
      const canvas = this.engine.canvas;
      this._rotate((-moveDelta.x * 180) / canvas.width, (moveDelta.y * 180) / canvas.height);
    }
  }

  private _rotate(alpha: number = 0, beta: number = 0): void {
    this._theta += MathUtil.degreeToRadian(alpha);
    this._phi += MathUtil.degreeToRadian(beta);
    this._phi = MathUtil.clamp(this._phi, ESP, Math.PI - ESP);
    this._spherical.theta = this._theta;
    this._spherical.phi = this._phi;
    this._spherical.setToVec3(this._tempVec);
    Vector3.add(this._cameraTransform.position, this._tempVec, this._tempVec);
    this._cameraTransform.lookAt(this._tempVec, new Vector3(0, 1, 0));
  }
}
