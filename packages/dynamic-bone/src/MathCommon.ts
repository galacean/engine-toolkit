import { MathUtil, Vector3, Quaternion } from "@galacean/engine";

export class MathCommon {
  private static _tempVec = new Vector3();

  public static lerp(a: number, b: number, t: number): number {
    return a + (b - a) * MathUtil.clamp(t, 0, 1);
  }

  /// Creates a rotation which rotates from fromDirection to toDirection.
  /// - Parameters:
  ///   - from: the vector to start from
  ///   - to: the vector to rotate to
  /// - Returns: a rotation about an axis normal to the two vectors which takes one to the other via the shortest path
  public static shortestRotation(from: Vector3, target: Vector3, quat: Quaternion): Quaternion {
    const d = Vector3.dot(from, target);
    const cross = MathCommon._tempVec;
    Vector3.cross(from, target, cross);

    const q =
      d > -1
        ? quat.set(cross.x, cross.y, cross.z, 1 + d)
        : Math.abs(from.x) < 0.1
        ? quat.set(0.0, from.z, -from.y, 0.0)
        : quat.set(from.y, -from.x, 0.0, 0.0);

    return q.normalize();
  }
}
