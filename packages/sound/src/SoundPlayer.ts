import { Component } from "@galacean/engine";
import { makeSound } from "./global";
import { Sound } from "./Sound";

export class SoundPlayer extends Component {
  private _ctx = new AudioContext();
  private _gainNode = this._ctx.createGain();
  private _source: AudioBufferSourceNode | null = null;
  private _volume = 1;
  private _playbackRate = 1;
  private static _isUserGestureTriggered = false;

  static triggerUserGesture() {
    SoundPlayer._isUserGestureTriggered = true;
    makeSound();
  }

  loop = false;
  sound: Sound | null = null;;

  get volume(): number {
    return this._volume;
  }

  set volume(v: number) {
    this._gainNode.gain.value = v;
    this._volume = v;
  }

  get playbackRate(): number {
    return this._playbackRate;
  }

  set playbackRate(v: number) {
    if (this._source) {
      this._source.playbackRate.value = v;
    }
    this._playbackRate = v;
  }

  play() {
    if (!SoundPlayer._isUserGestureTriggered) {
      console.warn("User gesture should be triggered first before audio created or play.");
      return;
    }
    if (this.sound) {
      this.stop();
      this._source = this._ctx.createBufferSource();
      this._source.buffer = this.sound.buffer;
      this._source.connect(this._gainNode).connect(this._ctx.destination);
      this._source.playbackRate.value = this._playbackRate;
      this._source.loop = this.loop;
      this._source.start();
    }
  }

  pause() {
    if (this._ctx.state === "running") {
      this._ctx.suspend();
    }
  }

  resume() {
    if (this._ctx.state === "suspended") {
      this._ctx.resume();
    }
  }

  stop(when?: number) {
    if (this._source) {
      this._source.stop(when);
      this._source.onended = this._source.disconnect;
    }
  }
}
