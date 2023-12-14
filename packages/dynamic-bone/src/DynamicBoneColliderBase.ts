import { Script, Vector3 } from "@galacean/engine";

export enum Direction {
  X,
  Y,
  Z
}

export enum Bound {
  Outside,
  Inside
}

export class DynamicBoneColliderBase extends Script {
  /// The axis of the capsule's height.
  public direction: Direction = Direction.Y;

  /// The center of the sphere or capsule, in the object's local space.
  public center = new Vector3();

  /// Constrain bones to outside bound or inside bound.
  public bound: Bound = Bound.Outside;

  public prepareFrame: number = 0;

  public prepare() {}

  public collide(particlePosition: Vector3, particleRadius: number): boolean {
    return false;
  }
}
