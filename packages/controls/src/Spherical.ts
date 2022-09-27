import { MathUtil, Matrix, Vector3 } from "oasis-engine";
// Prevent gimbal lock.
const ESP = MathUtil.zeroTolerance;
// Spherical.
export class Spherical {
  private static xAxis: Vector3 = new Vector3();
  private static yAxis: Vector3 = new Vector3();
  private static zAxis: Vector3 = new Vector3();
  private matrixInv: Matrix = new Matrix();
  constructor(public radius?: number, public phi?: number, public theta?: number) {
    this.radius = radius !== undefined ? radius : 1.0;
    this.phi = phi !== undefined ? phi : 0;
    this.theta = theta !== undefined ? theta : 0;
  }

  makeSafe() {
    const count = Math.floor(this.phi / Math.PI);
    this.phi = MathUtil.clamp(this.phi, count * Math.PI + ESP, (count + 1) * Math.PI - ESP);
    return this;
  }

  set(radius: number, phi: number, theta: number) {
    this.radius = radius;
    this.phi = phi;
    this.theta = theta;
    return this;
  }

  setUp(up: Vector3) {
    const { xAxis, yAxis, zAxis } = Spherical;
    if (Vector3.equals(xAxis.set(1, 0, 0), yAxis.copyFrom(up).normalize())) {
      xAxis.set(0, 1, 0);
    }
    Vector3.cross(xAxis, yAxis, zAxis);
    zAxis.normalize();
    Vector3.cross(yAxis, zAxis, xAxis);
    const { elements: eInv } = this.matrixInv;
    (eInv[0] = xAxis.x), (eInv[4] = xAxis.y), (eInv[8] = xAxis.z);
    (eInv[1] = yAxis.x), (eInv[5] = yAxis.y), (eInv[9] = yAxis.z);
    (eInv[2] = zAxis.x), (eInv[6] = zAxis.y), (eInv[10] = zAxis.z);
  }

  setFromVec3(value: Vector3, atTheBack: boolean = false) {
    value.transformNormal(this.matrixInv);
    this.radius = value.length();
    if (this.radius === 0) {
      this.theta = 0;
      this.phi = 0;
    } else {
      if (atTheBack) {
        this.phi = 2 * Math.PI - Math.acos(MathUtil.clamp(value.y / this.radius, -1, 1));
        this.theta = Math.atan2(-value.x, -value.z);
      } else {
        this.phi = Math.acos(MathUtil.clamp(value.y / this.radius, -1, 1));
        this.theta = Math.atan2(value.x, value.z);
      }
    }
    return this;
  }

  setToVec3(value: Vector3) {
    const { radius, phi, theta } = this;
    const sinPhiRadius = Math.sin(phi) * radius;
    this.phi -= Math.floor(this.phi / Math.PI / 2) * Math.PI * 2;
    value.set(sinPhiRadius * Math.sin(theta), radius * Math.cos(phi), sinPhiRadius * Math.cos(theta));
    return this.phi > Math.PI;
  }
}
