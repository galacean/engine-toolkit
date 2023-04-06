import { AnimationClip, AnimationVector3Curve, Keyframe, Script, Transform, Vector3 } from "@galacean/engine";

export class WayPoint extends Script {
  duration: number = 1;
  currentNormalizedTime: number = 0;
  private _animationClip: AnimationClip;
  private _wayPointsPosition: Vector3[];
  private _wayPointsRotation: Vector3[];

  get wayPointsPosition() {
    return this._wayPointsPosition;
  }

  set wayPointsPosition(positions: Vector3[]) {
    const wayPointPositionCurve = new AnimationVector3Curve();
    const length = positions.length;
    positions.forEach((position, index) => {
      let keyframe = new Keyframe<Vector3>();
      keyframe.time = (index / (length - 1)) * this.duration;
      keyframe.value = position;
      wayPointPositionCurve.addKey(keyframe);
    });
    this._animationClip.addCurveBinding("", Transform, "position", wayPointPositionCurve);
  }

  get wayPointsRotation() {
    return this._wayPointsRotation;
  }

  set wayPointsRotation(rotations: Vector3[]) {
    const wayPointRotationCurve = new AnimationVector3Curve();
    const length = rotations.length;
    rotations.forEach((rotation, index) => {
      let keyframe = new Keyframe<Vector3>();
      keyframe.time = (index / (length - 1)) * this.duration;
      keyframe.value = rotation;
      wayPointRotationCurve.addKey(keyframe);
    });
    this._animationClip.addCurveBinding("", Transform, "rotation", wayPointRotationCurve);
  }

  onAwake() {
    this._animationClip = new AnimationClip("_wayPoint");
  }

  onUpdate() {
    // @ts-ignore
    this._animationClip._sampleAnimation(this.entity, this.currentNormalizedTime * this.duration);
  }

  clear() {
    this._animationClip.clearCurveBindings();
  }
}
