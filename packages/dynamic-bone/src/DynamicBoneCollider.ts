import { Bound, Direction, DynamicBoneColliderBase } from "./DynamicBoneColliderBase";
import { Vector3 } from "@galacean/engine";
import { MathCommon } from "./MathCommon";

export class DynamicBoneCollider extends DynamicBoneColliderBase {
  private static tempVec1 = new Vector3();
  private static tempVec2 = new Vector3();
  private static tempVec3 = new Vector3();

  /// The radius of the sphere or capsule.
  public radius: number = 0.5;

  /// The height of the capsule.
  public height: number = 0;

  /// The other radius of the capsule.
  public radius2: number = 0;

  // prepare data
  /** @internal */
  _scaledRadius: number = 0;
  /** @internal */
  _scaledRadius2: number = 0;
  /** @internal */
  _c0: Vector3 = new Vector3();
  /** @internal */
  _c1: Vector3 = new Vector3();
  /** @internal */
  _c01Distance: number = 0;
  /** @internal */
  _collideType: number = 0;

  override prepare(): void {
    const worldMatrix = this.entity.transform.worldMatrix;
    const scale = Math.abs(this.entity.transform.lossyWorldScale.x);
    const halfHeight = this.height * 0.5;

    if (this.radius2 <= 0 || Math.abs(this.radius - this.radius2) < 0.01) {
      this._scaledRadius = this.radius * scale;

      const h = halfHeight - this.radius;
      if (h <= 0) {
        Vector3.transformCoordinate(this.center, worldMatrix, this._c0);

        if (this.bound == Bound.Outside) {
          this._collideType = 0;
        } else {
          this._collideType = 1;
        }
      } else {
        const c0 = DynamicBoneCollider.tempVec1;
        c0.copyFrom(this.center);
        const c1 = DynamicBoneCollider.tempVec2;
        c1.copyFrom(this.center);

        switch (this.direction) {
          case Direction.X:
            c0.x += h;
            c1.x -= h;
            break;
          case Direction.Y:
            c0.y += h;
            c1.y -= h;
            break;
          case Direction.Z:
            c0.z += h;
            c1.z -= h;
            break;
        }

        Vector3.transformCoordinate(c0, worldMatrix, this._c0);
        Vector3.transformCoordinate(c1, worldMatrix, this._c1);
        this._c01Distance = Vector3.distanceSquared(this._c1, this._c0);

        if (this.bound == Bound.Outside) {
          this._collideType = 2;
        } else {
          this._collideType = 3;
        }
      }
    } else {
      const r = Math.max(this.radius, this.radius2);
      if (halfHeight - r <= 0) {
        this._scaledRadius = r * scale;
        Vector3.transformCoordinate(this.center, worldMatrix, this._c0);

        if (this.bound == Bound.Outside) {
          this._collideType = 0;
        } else {
          this._collideType = 1;
        }
      } else {
        this._scaledRadius = this.radius * scale;
        this._scaledRadius2 = this.radius2 * scale;

        const h0 = halfHeight - this.radius;
        const h1 = halfHeight - this.radius2;
        const c0 = DynamicBoneCollider.tempVec1;
        c0.copyFrom(this.center);
        const c1 = DynamicBoneCollider.tempVec2;
        c1.copyFrom(this.center);

        switch (this.direction) {
          case Direction.X:
            c0.x += h0;
            c1.x -= h1;
            break;
          case Direction.Y:
            c0.y += h0;
            c1.y -= h1;
            break;
          case Direction.Z:
            c0.z += h0;
            c1.z -= h1;
            break;
        }

        Vector3.transformCoordinate(c0, worldMatrix, this._c0);
        Vector3.transformCoordinate(c1, worldMatrix, this._c1);
        this._c01Distance = Vector3.distance(this._c0, this._c1);

        if (this.bound == Bound.Outside) {
          this._collideType = 4;
        } else {
          this._collideType = 5;
        }
      }
    }
  }

  override collide(particlePosition: Vector3, particleRadius: number): boolean {
    switch (this._collideType) {
      case 0:
        return DynamicBoneCollider.outsideSphere(particlePosition, particleRadius, this._c0, this._scaledRadius);
      case 1:
        return DynamicBoneCollider.insideSphere(particlePosition, particleRadius, this._c0, this._scaledRadius);
      case 2:
        return DynamicBoneCollider.outsideCapsule(
          particlePosition,
          particleRadius,
          this._c0,
          this._c1,
          this._scaledRadius,
          this._c01Distance
        );
      case 3:
        return DynamicBoneCollider.insideCapsule(
          particlePosition,
          particleRadius,
          this._c0,
          this._c1,
          this._scaledRadius,
          this._c01Distance
        );
      case 4:
        return DynamicBoneCollider.outsideCapsule2(
          particlePosition,
          particleRadius,
          this._c0,
          this._c1,
          this._scaledRadius,
          this._scaledRadius2,
          this._c01Distance
        );
      case 5:
        return DynamicBoneCollider.insideCapsule2(
          particlePosition,
          particleRadius,
          this._c0,
          this._c1,
          this._scaledRadius,
          this._scaledRadius2,
          this._c01Distance
        );
      default:
        return false;
    }
  }

  static outsideSphere(
    particlePosition: Vector3,
    particleRadius: number,
    sphereCenter: Vector3,
    sphereRadius: number
  ): boolean {
    const r = sphereRadius + particleRadius;
    const r2 = r * r;
    const d = DynamicBoneCollider.tempVec1;
    Vector3.subtract(particlePosition, sphereCenter, d);
    const dlen2 = d.lengthSquared();

    // if is inside sphere, project onto sphere surface
    if (dlen2 > 0 && dlen2 < r2) {
      const dlen = Math.sqrt(dlen2);
      d.scale(r / dlen);
      Vector3.add(sphereCenter, d, particlePosition);
      return true;
    }
    return false;
  }

  static insideSphere(
    particlePosition: Vector3,
    particleRadius: number,
    sphereCenter: Vector3,
    sphereRadius: number
  ): boolean {
    const r = sphereRadius - particleRadius;
    const r2 = r * r;
    const d = DynamicBoneCollider.tempVec1;
    Vector3.subtract(particlePosition, sphereCenter, d);
    const dlen2 = d.lengthSquared();

    // if is outside sphere, project onto sphere surface
    if (dlen2 > r2) {
      const dlen = Math.sqrt(dlen2);
      d.scale(r / dlen);
      Vector3.add(sphereCenter, d, particlePosition);
      return true;
    }
    return false;
  }

  static outsideCapsule(
    particlePosition: Vector3,
    particleRadius: number,
    capsuleP0: Vector3,
    capsuleP1: Vector3,
    capsuleRadius: number,
    dirlen: number
  ): boolean {
    const r = capsuleRadius + particleRadius;
    const r2 = r * r;
    const dir = DynamicBoneCollider.tempVec1;
    Vector3.subtract(capsuleP1, capsuleP0, dir);
    const d = DynamicBoneCollider.tempVec2;
    Vector3.subtract(particlePosition, capsuleP0, d);
    const t = Vector3.dot(d, dir);

    if (t <= 0) {
      // check sphere1
      const dlen2 = d.lengthSquared();
      if (dlen2 > 0 && dlen2 < r2) {
        const dlen = Math.sqrt(dlen2);
        d.scale(r / dlen);
        Vector3.add(capsuleP0, d, particlePosition);
        return true;
      }
    } else {
      const dirlen2 = dirlen * dirlen;
      if (t >= dirlen2) {
        // check sphere2
        const d = DynamicBoneCollider.tempVec3;
        Vector3.subtract(particlePosition, capsuleP1, d);
        const dlen2 = d.lengthSquared();
        if (dlen2 > 0 && dlen2 < r2) {
          const dlen = Math.sqrt(dlen2);
          d.scale(r / dlen);
          Vector3.add(capsuleP1, d, particlePosition);
          return true;
        }
      } else {
        // check cylinder
        const q = DynamicBoneCollider.tempVec3;
        dir.scale(t / dirlen2);
        Vector3.subtract(d, dir, q);
        const qlen2 = q.lengthSquared();
        if (qlen2 > 0 && qlen2 < r2) {
          const qlen = Math.sqrt(qlen2);
          q.scale((r - qlen) / qlen);
          particlePosition.add(q);
          return true;
        }
      }
    }
    return false;
  }

  static insideCapsule(
    particlePosition: Vector3,
    particleRadius: number,
    capsuleP0: Vector3,
    capsuleP1: Vector3,
    capsuleRadius: number,
    dirlen: number
  ): boolean {
    const r = capsuleRadius - particleRadius;
    const r2 = r * r;
    const dir = DynamicBoneCollider.tempVec1;
    Vector3.subtract(capsuleP1, capsuleP0, dir);
    const d = DynamicBoneCollider.tempVec2;
    Vector3.subtract(particlePosition, capsuleP0, d);
    const t = Vector3.dot(d, dir);

    if (t <= 0) {
      // check sphere1
      const dlen2 = d.lengthSquared();
      if (dlen2 > r2) {
        const dlen = Math.sqrt(dlen2);
        d.scale(r / dlen);
        Vector3.add(capsuleP0, d, particlePosition);
        return true;
      }
    } else {
      const dirlen2 = dirlen * dirlen;
      if (t >= dirlen2) {
        // check sphere2
        const d = DynamicBoneCollider.tempVec3;
        Vector3.subtract(particlePosition, capsuleP1, d);
        const dlen2 = d.lengthSquared();
        if (dlen2 > r2) {
          const dlen = Math.sqrt(dlen2);
          d.scale(r / dlen);
          Vector3.add(capsuleP1, d, particlePosition);
          return true;
        }
      } else {
        // check cylinder
        const q = DynamicBoneCollider.tempVec3;
        dir.scale(t / dirlen2);
        Vector3.subtract(d, dir, q);
        const qlen2 = q.lengthSquared();
        if (qlen2 > r2) {
          const qlen = Math.sqrt(qlen2);
          q.scale((r - qlen) / qlen);
          particlePosition.add(q);
          return true;
        }
      }
    }
    return false;
  }

  static outsideCapsule2(
    particlePosition: Vector3,
    particleRadius: number,
    capsuleP0: Vector3,
    capsuleP1: Vector3,
    capsuleRadius0: number,
    capsuleRadius1: number,
    dirlen: number
  ): boolean {
    const dir = DynamicBoneCollider.tempVec1;
    Vector3.subtract(capsuleP1, capsuleP0, dir);
    const d = DynamicBoneCollider.tempVec2;
    Vector3.subtract(particlePosition, capsuleP0, d);
    const t = Vector3.dot(d, dir);

    if (t <= 0) {
      // check sphere1
      const r = capsuleRadius0 + particleRadius;
      const r2 = r * r;
      const dlen2 = d.lengthSquared();
      if (dlen2 > 0 && dlen2 < r2) {
        const dlen = Math.sqrt(dlen2);
        d.scale(r / dlen);
        Vector3.add(capsuleP0, d, particlePosition);
        return true;
      }
    } else {
      const dirlen2 = dirlen * dirlen;
      if (t >= dirlen2) {
        // check sphere2
        const r = capsuleRadius1 + particleRadius;
        const r2 = r * r;
        const d = DynamicBoneCollider.tempVec3;
        Vector3.subtract(particlePosition, capsuleP1, d);
        const dlen2 = d.lengthSquared();
        if (dlen2 > 0 && dlen2 < r2) {
          const dlen = Math.sqrt(dlen2);
          d.scale(r / dlen);
          Vector3.add(capsuleP1, d, particlePosition);
          return true;
        }
      } else {
        // check cylinder
        const q = DynamicBoneCollider.tempVec3;
        Vector3.scale(dir, t / dirlen2, q);
        Vector3.subtract(d, q, q);
        const qlen2 = q.lengthSquared();

        dir.scale(1 / dirlen);
        const klen = Vector3.dot(d, dir);
        const r = MathCommon.lerp(capsuleRadius0, capsuleRadius1, klen / dirlen) + particleRadius;
        const r2 = r * r;

        if (qlen2 > 0 && qlen2 < r2) {
          const qlen = Math.sqrt(qlen2);
          q.scale((r - qlen) / qlen);
          particlePosition.add(q);
          return true;
        }
      }
    }
    return false;
  }

  static insideCapsule2(
    particlePosition: Vector3,
    particleRadius: number,
    capsuleP0: Vector3,
    capsuleP1: Vector3,
    capsuleRadius0: number,
    capsuleRadius1: number,
    dirlen: number
  ): boolean {
    const dir = DynamicBoneCollider.tempVec1;
    Vector3.subtract(capsuleP1, capsuleP0, dir);
    const d = DynamicBoneCollider.tempVec2;
    Vector3.subtract(particlePosition, capsuleP0, d);
    const t = Vector3.dot(d, dir);

    if (t <= 0) {
      // check sphere1
      const r = capsuleRadius0 - particleRadius;
      const r2 = r * r;
      const dlen2 = d.lengthSquared();
      if (dlen2 > r2) {
        const dlen = Math.sqrt(dlen2);
        d.scale(r / dlen);
        Vector3.add(capsuleP0, d, particlePosition);
        return true;
      }
    } else {
      const dirlen2 = dirlen * dirlen;
      if (t >= dirlen2) {
        // check sphere2
        const r = capsuleRadius1 - particleRadius;
        const r2 = r * r;
        const d = DynamicBoneCollider.tempVec3;
        Vector3.subtract(particlePosition, capsuleP1, d);
        const dlen2 = d.lengthSquared();
        if (dlen2 > r2) {
          const dlen = Math.sqrt(dlen2);
          d.scale(r / dlen);
          Vector3.add(capsuleP1, d, particlePosition);
          return true;
        }
      } else {
        // check cylinder
        const q = DynamicBoneCollider.tempVec3;
        Vector3.scale(dir, t / dirlen2, q);
        Vector3.subtract(d, q, q);
        const qlen2 = q.lengthSquared();

        dir.scale(1 / dirlen);
        const klen = Vector3.dot(d, dir);
        const r = MathCommon.lerp(capsuleRadius0, capsuleRadius1, klen / dirlen) - particleRadius;
        const r2 = r * r;

        if (qlen2 > r2) {
          const qlen = Math.sqrt(qlen2);
          q.scale((r - qlen) / qlen);
          particlePosition.add(q);
          return true;
        }
      }
    }
    return false;
  }
}
