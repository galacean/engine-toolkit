import { Script, Camera } from "@galacean/engine";
import Monitor from "./Monitor";

/**
 * Display engine status data such as FPS.
 */
export class Stats extends Script {
  private monitor: Monitor;

  override set enabled(value: boolean) {
    value ? this._setupMonitor() : this.monitor.destroy();
  }

  override onBeginRender(camera: Camera): void {
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
    this.monitor = new Monitor(this.engine);
  }
}
