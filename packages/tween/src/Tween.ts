import { EventDispatcher, MathUtil, Script } from "@galacean/engine";
import { Easing, EasingFunc, EasingType } from "./easing";
import { Interpolation } from "./interfaces";

type Constructor<T = Object> = new (...a: any[]) => T;

export class Tween<T extends Interpolation> extends Script {
  private _target: T | null = null;
  private _from: T | null = null;
  private _to: T | null = null;
  private _oldValue: T | null = null;
  private _easingFunc: EasingFunc = Easing.Linear;
  private _easing: EasingType = "Linear";
  private _currentClass: Constructor<T>;
  private _tweenChains: Tween<any>[] = [];

  public static readonly Easing = Easing;

  public static readonly Events = {
    PAUSE: 'pause',
    START: 'start',
    END: 'end',
    RESUME: 'resume',
    LOOP: 'loop'
  }

  public static readonly State = {
    IDLE: "idle",
    PAUSED: "paused",
    PLAYING: "playing",
    STOPPED: "stopped"
  };

  public static readonly FillMode = {
    NONE: "none",
    BACKWARDS: "backwards",
    FORWARDS: "forwards",
    BOTH: "both"
  };

  fillMode: string = Tween.FillMode.BOTH;
  autoPlay: boolean = false;
  duration: number = 1;
  delay: number = 0;
  loop: number = 0;
  yoyo: boolean = false;
  progress: number = 0;
  currentTime = 0;
  currentLoop = 0;
  speed = 1;
  state: string = Tween.State.IDLE;
  event = new EventDispatcher();

  get easing() {
    return this._easing;
  }

  set easing(v: EasingType) {
    this._easing = v;

    if (typeof v === "function") {
      this._easingFunc = v;
    } else {
      this._easingFunc = Easing[v ?? "Linear"] ?? Easing.Linear;
    }
  }

  get target() {
    return this._target;
  }

  set target(v: T | null) {
    this._target = v;

    if (!v) {
      this._oldValue = null;
      return;
    }

    const ConstructorFunc = v.constructor as Constructor<typeof v>;
    this._currentClass = ConstructorFunc;
    this._oldValue = new ConstructorFunc();
    this._oldValue.copyFrom(v as any);
    if (!(this._from instanceof ConstructorFunc)) {
      this._from = new ConstructorFunc();
    }
    this._from.copyFrom(v as any);
    if (!(this._to instanceof ConstructorFunc)) {
      this._to = new ConstructorFunc();
    }
    this._to.copyFrom(v as any);
  }

  get from() {
    return this._from;
  }

  set from(v: T | null) {
    if (!v) {
      return;
    }

    if (v.constructor !== this._from?.constructor) {
      throw new Error(`Cannot set type "${v.constructor.name}" to type "${this._from?.constructor.name ?? null}"`)
    }

    this._from.copyFrom(v as any);

    if (this.state === Tween.State.IDLE && this.target && (this.fillMode === Tween.FillMode.FORWARDS || this.fillMode === Tween.FillMode.BOTH)) {
      this.target.copyFrom(v as any);
    }
  }


  get to() {
    return this._to;
  }

  set to(v: T | null) {
    if (!v) {
      return;
    }

    if (v.constructor !== this._to?.constructor) {
      throw new Error(`Cannot set type "${v.constructor.name}" to type "${this._to?.constructor.name ?? null}"`)
    }

    this._to.copyFrom(v as any);

    if (this.state === Tween.State.STOPPED && this.target && (this.fillMode === Tween.FillMode.BACKWARDS || this.fillMode === Tween.FillMode.BOTH)) {
      this.target.copyFrom(v as any);
    }
  }

  chain(...tweens: Tween<any>[]) {
    this._tweenChains = tweens;

    return this;
  }

  override onUpdate(delta: number) {
    if (!this.target) {
      this.state = Tween.State.STOPPED;
      return;
    }
    if (this.state === Tween.State.IDLE && this.autoPlay) {
      this.state = Tween.State.PLAYING;
      this.event.dispatch(Tween.Events.START, this);
    }
    if (this.state !== Tween.State.PLAYING) {
      return;
    }
    this.currentTime += delta * this.speed;
    this.update(this.target);
  }

  private update(target: T) {
    const t = this.currentTime - this.delay;
    if (t < 0) {
      return;
    }
    const loop = Math.floor(t / this.duration);
    if (loop > this.loop) {
      this.progress = 1;
      this.state = Tween.State.STOPPED;

      this.event.dispatch(Tween.Events.END, this);
      if (this.fillMode === Tween.FillMode.NONE || this.fillMode === Tween.FillMode.FORWARDS) {
        target.copyFrom(this._oldValue as any);
      } else {
        if (this.yoyo && (this.currentLoop & 1)) {
          target.copyFrom(this.from as any);
        } else {
          target.copyFrom(this.to as any);
        }
      }
      this.playChains();
      return;
    } else {
      this.progress = (t - this.currentLoop * this.duration) / this.duration;
      if (loop !== this.currentLoop) {
        this.currentLoop = loop;
        this.event.dispatch(Tween.Events.LOOP, this);
      }
    }

    if (this.yoyo && (this.currentLoop & 1)) {
      (this._currentClass as any).lerp(this.from, this.to, this._easingFunc(1 - this.progress), target);
    } else {
      (this._currentClass as any).lerp(this.from, this.to, this._easingFunc(this.progress), target);
    }
  }

  private playChains() {
    for (let i = 0, len = this._tweenChains.length; i < len; i++) {
      const tween = this._tweenChains[i];
      tween.reset();
      tween.play();
    }
  }

  setProgress(p: number, loop: number = 0) {
    p = MathUtil.clamp(p, 0, 1);
    this.currentLoop = loop;
    this.currentTime = this.delay + loop * this.duration + p;
    if (this.target) {
      this.update(this.target);
    }
  }

  setTime(v: number) {
    this.currentTime = v;
    if (this.target) {
      this.update(this.target);
    }
  }

  pause() {
    if (this.state === Tween.State.PLAYING) {
      this.state = Tween.State.PAUSED;
      this.event.dispatch(Tween.Events.PAUSE, this);
    }

    return this;
  }

  resume() {
    if (this.state === Tween.State.PAUSED) {
      this.state = Tween.State.PLAYING;
      this.event.dispatch(Tween.Events.RESUME, this);
    }

    return this;
  }

  play() {
    if (this.state === Tween.State.STOPPED || this.state === Tween.State.IDLE) {
      this.reset();
      this.state = Tween.State.PLAYING;
      this.event.dispatch(Tween.Events.START, this);
    }

    return this;
  }

  stop() {
    this.state = Tween.State.STOPPED;
  }

  reset() {
    this.currentLoop = 0;
    this.progress = 0;
    this.currentTime = 0;
    this.state = this.autoPlay ? Tween.State.PLAYING : Tween.State.IDLE;

    if (!this.target) {
      return;
    }
    if (this.fillMode === Tween.FillMode.BOTH || this.fillMode === Tween.FillMode.FORWARDS) {
      this.target.copyFrom(this.from as any);
    } else {
      this.target.copyFrom(this._oldValue as any);
    }

    return this;
  }
}
