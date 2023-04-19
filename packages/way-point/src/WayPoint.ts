import { AnimationClip, AnimationVector3Curve, Keyframe, Script, Transform, Vector3 } from "@galacean/engine";

export class WayPoint extends Script {
  duration: number = 1;
  currentNormalizedTime: number = 0;
  private _animationClip: AnimationClip = new AnimationClip("_wayPoint");
  private _wayPointsPosition: Vector3[] = [];
  private _wayPointsRotation: Vector3[] = [];

  get wayPointsPosition(): Vector3[] {
    return this._wayPointsPosition;
  }

  set wayPointsPosition(positions: Vector3[]) {
    this._copy(this._wayPointsPosition, positions);
    const wayPointsPosition = this._wayPointsPosition;

    const wayPointPositionCurve = new AnimationVector3Curve();
    const length = wayPointsPosition.length;
    wayPointsPosition.forEach((position, index) => {
      let keyframe = new Keyframe<Vector3>();
      keyframe.time = (index / (length - 1)) * this.duration;
      keyframe.value = position;
      wayPointPositionCurve.addKey(keyframe);
    });
    this._animationClip.addCurveBinding("", Transform, "position", wayPointPositionCurve);
  }

  get wayPointsRotation(): Vector3[] {
    return this._wayPointsRotation;
  }

  set wayPointsRotation(rotations: Vector3[]) {
    this._copy(this._wayPointsRotation, rotations);
    const wayPointsRotation = this._wayPointsRotation;

    const wayPointRotationCurve = new AnimationVector3Curve();
    const length = wayPointsRotation.length;
    wayPointsRotation.forEach((rotation, index) => {
      let keyframe = new Keyframe<Vector3>();
      keyframe.time = (index / (length - 1)) * this.duration;
      keyframe.value = rotation;
      wayPointRotationCurve.addKey(keyframe);
    });
    this._animationClip.addCurveBinding("", Transform, "rotation", wayPointRotationCurve);
  }

  private _copy(dst: Vector3[], src: Vector3[]) {
    if (dst.length < src.length) {
      const count = src.length - dst.length;
      for (let i = 0; i < count; i++) {
        dst.push(new Vector3());
      }
    } else {
      dst.length = src.length;
    }

    for (let i = 0; i < src.length; i++) {
      dst[i].copyFrom(src[i]);
    }
  }

  override onUpdate() {
    // @ts-ignore
    this._animationClip._sampleAnimation(this.entity, this.currentNormalizedTime * this.duration);
  }

  clear() {
    this._animationClip.clearCurveBindings();
  }
}
