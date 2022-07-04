import { Entity, Component, SkinnedMeshRenderer } from "oasis-engine";
import { SkeletonViewer } from "./SkeletonViewer";

export class SkeletonManager extends Component {
  private _skeletonViewer: SkeletonViewer[] = [];

  constructor(entity: Entity) {
    super(entity);
  }

  showSkin(entity: Entity) {
    this.clear();
    const skinnedMeshRenderers = [];
    entity.getComponentsIncludeChildren(SkinnedMeshRenderer, skinnedMeshRenderers);
    this._skeletonViewer.length = 0;
    for (let i = 0; i < skinnedMeshRenderers.length; i++) {
      this._skeletonViewer[i] = new SkeletonViewer(this.engine, skinnedMeshRenderers[i]);
      this._skeletonViewer[i].update();
    }
  }

  update() {
    for (let i = 0, length = this._skeletonViewer.length; i < length; i++) {
      this._skeletonViewer[i].update();
    }
  }

  clear() {
    for (let i = 0, length = this._skeletonViewer.length; i < length; i++) {
      this._skeletonViewer[i].destroy();
    }
  }

  onDestroy() {
    this.clear();
    this._skeletonViewer.length = 0;
  }
}
