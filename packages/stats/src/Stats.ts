import { Script, Camera } from "@galacean/engine";
import { hookRequest } from "./hooks/RequestHook";
import Monitor from "./Monitor";

/**
 * Display engine status data such as FPS.
 */
export class Stats extends Script {
  private monitor: Monitor;
  private camera: Camera;

  static hookRequest() {
    hookRequest();
  }

  override set enabled(value: boolean) {
    value ? this._setupMonitor() : this.monitor.destroy();
  }

  override onBeginRender(camera: Camera): void {
    this.camera = camera;
    if (!this.monitor) {
      this._setupMonitor();
    }
  }

  override onEndRender(camera: Camera): void {
    if (this.monitor) {
      this.monitor.update();
    }
  }

  private _setupMonitor() {
    // @ts-ignore
    const gl = this.camera.engine._hardwareRenderer.gl;
    if (gl) {
      this.monitor = new Monitor(gl);
    }
  }
}
