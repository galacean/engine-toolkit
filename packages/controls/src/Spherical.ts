import { MathUtil, Vector3 } from "oasis-engine";

// Prevent gimbal lock.
const ESP = MathUtil.zeroTolerance;

// Spherical.
export class Spherical {
  constructor(public radius?: number, public phi?: number, public theta?: number) {
    this.radius = radius !== undefined ? radius : 1.0;
    this.phi = phi !== undefined ? phi : 0;
    this.theta = theta !== undefined ? theta : 0;
  }

  set(radius: number, phi: number, theta: number) {
    this.radius = radius;
    this.phi = phi;
    this.theta = theta;
    return this;
  }

  makeSafe() {
    this.phi = MathUtil.clamp(this.phi, ESP, Math.PI - ESP);
    return this;
  }

  setFromVec3(value: Vector3) {
    this.radius = value.length();
    if (this.radius === 0) {
      this.theta = 0;
      this.phi = 0;
    } else {
      this.theta = Math.atan2(value.x, value.z);
      this.phi = Math.acos(MathUtil.clamp(value.y / this.radius, -1, 1));
    }
    return this;
  }

  setToVec3(value: Vector3) {
    const { radius, phi, theta } = this;
    const sinPhiRadius = Math.sin(phi) * radius;
    value.set(sinPhiRadius * Math.sin(theta), radius * Math.cos(phi), sinPhiRadius * Math.cos(theta));
    return this;
  }
}
