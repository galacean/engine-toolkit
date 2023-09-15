import { Engine, ReferResource } from "@galacean/engine";

export class Sound extends ReferResource {
  name: string;
  buffer: AudioBuffer | null = null;;
  constructor(engine: Engine, name: string = "") {
    super(engine);
    this.name = name;
  }

  get duration(): number {
    return this.buffer?.duration ?? -1;
  }

  setAudioSource(buffer: AudioBuffer) {
    this.buffer = buffer;
  }

  destroy(): boolean {
    if (this._destroyed) {
      return false;
    }

    this.buffer = null;
    this._destroyed = true;

    return true;
  }
}
