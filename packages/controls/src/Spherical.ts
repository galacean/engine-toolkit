import { MathUtil, Matrix, Vector3 } from "@galacean/engine";
// Prevent gimbal lock.
const ESP = MathUtil.zeroTolerance;
// Spherical.
export class Spherical {
  private static _xAxis: Vector3 = new Vector3();
  private static _yAxis: Vector3 = new Vector3();
  private static _zAxis: Vector3 = new Vector3();
  private _matrix: Matrix = new Matrix();
  private _matrixInv: Matrix = new Matrix();
  constructor(public radius?: number, public phi?: number, public theta?: number) {
    this.radius = radius !== undefined ? radius : 1.0;
    this.phi = phi !== undefined ? phi : 0;
    this.theta = theta !== undefined ? theta : 0;
  }

  makeSafe(): Spherical {
    const count = Math.floor(this.phi / Math.PI);
    this.phi = MathUtil.clamp(this.phi, count * Math.PI + ESP, (count + 1) * Math.PI - ESP);
    return this;
  }

  set(radius: number, phi: number, theta: number): Spherical {
    this.radius = radius;
    this.phi = phi;
    this.theta = theta;
    return this;
  }

  setYAxis(up: Vector3): void {
    const { _xAxis: xAxis, _yAxis: yAxis, _zAxis: zAxis } = Spherical;
    if (Vector3.equals(xAxis.set(1, 0, 0), yAxis.copyFrom(up).normalize())) {
      xAxis.set(0, 1, 0);
    }
    Vector3.cross(xAxis, yAxis, zAxis);
    zAxis.normalize();
    Vector3.cross(yAxis, zAxis, xAxis);
    const { elements: es } = this._matrix;
    (es[0] = xAxis.x), (es[1] = xAxis.y), (es[2] = xAxis.z);
    (es[4] = yAxis.x), (es[5] = yAxis.y), (es[6] = yAxis.z);
    (es[8] = zAxis.x), (es[9] = zAxis.y), (es[10] = zAxis.z);

    const { elements: eInv } = this._matrixInv;
    (eInv[0] = xAxis.x), (eInv[4] = xAxis.y), (eInv[8] = xAxis.z);
    (eInv[1] = yAxis.x), (eInv[5] = yAxis.y), (eInv[9] = yAxis.z);
    (eInv[2] = zAxis.x), (eInv[6] = zAxis.y), (eInv[10] = zAxis.z);
  }

  setFromVec3(value: Vector3, atTheBack: boolean = false): Spherical {
    value.transformNormal(this._matrixInv);
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

  setToVec3(value: Vector3): boolean {
    const { radius, phi, theta } = this;
    const sinPhiRadius = Math.sin(phi) * radius;
    this.phi -= Math.floor(this.phi / Math.PI / 2) * Math.PI * 2;
    value.set(sinPhiRadius * Math.sin(theta), radius * Math.cos(phi), sinPhiRadius * Math.cos(theta));
    value.transformNormal(this._matrix);
    return this.phi > Math.PI;
  }
}
