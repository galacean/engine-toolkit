import { Bound, Direction, DynamicBoneColliderBase } from "./DynamicBoneColliderBase";
import { CollisionUtil, Plane, Vector3 } from "@galacean/engine";

export class DynamicBonePlaneCollider extends DynamicBoneColliderBase {
  private static tempVec = new Vector3();

  /** @internal */
  _plane = new Plane();

  override prepare() {
    let normal: Vector3;
    switch (this.direction) {
      case Direction.X:
        normal = this.entity.transform.worldRight;
        break;
      case Direction.Y:
        normal = this.entity.transform.worldUp;
        break;
      case Direction.Z:
        normal = this.entity.transform.worldForward;
        break;
    }

    const plane = this._plane;
    const p = DynamicBonePlaneCollider.tempVec;
    Vector3.transformCoordinate(this.center, this.entity.transform.worldMatrix, p);
    Vector3.normalize(normal, plane.normal);
    plane.distance = Vector3.dot(plane.normal, p);
  }

  override collide(particlePosition: Vector3, particleRadius: number): boolean {
    const plane = this._plane;
    const d = CollisionUtil.distancePlaneAndPoint(plane, particlePosition);

    if (this.bound == Bound.Outside) {
      if (d < 0) {
        Vector3.scale(plane.normal, d, DynamicBonePlaneCollider.tempVec);
        particlePosition.subtract(DynamicBonePlaneCollider.tempVec);
        return true;
      }
    } else {
      if (d > 0) {
        Vector3.scale(plane.normal, d, DynamicBonePlaneCollider.tempVec);
        particlePosition.subtract(DynamicBonePlaneCollider.tempVec);
        return true;
      }
    }
    return false;
  }
}
