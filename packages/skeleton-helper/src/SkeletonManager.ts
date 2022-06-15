import { Entity, Script, SkinnedMeshRenderer } from "oasis-engine";
import { SkeletonViewer } from "./SkeletonViewer";

export class SkeletonManager extends Script {
  private _skeletonViewer: SkeletonViewer[] = [];

  constructor(entity: Entity) {
    super(entity);
  }

  set skins(skins:SkinnedMeshRenderer[]) {
    this.hide();
    this._skeletonViewer.length = 0;
    for (let i = 0; i < skins.length; i++) {
      this._skeletonViewer[i] = new SkeletonViewer(this.engine, skins[i]);
      this._skeletonViewer[i].update();
    }
  }

  update() {
    for (let i = 0, length = this._skeletonViewer.length; i < length; i++) {
      this._skeletonViewer[i].update();
    }
  }

  hide() {
    for (let i = 0, length = this._skeletonViewer.length; i < length; i++) {
      this._skeletonViewer[i].destroy();
    }
  }

  onDestroy() {
    this.hide();
    this._skeletonViewer.length = 0;
  }
}
