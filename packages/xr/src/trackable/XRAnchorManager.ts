import { Entity, Quaternion, Vector3 } from "@galacean/engine";
import { XRAnchor, XRAnchorTracking } from "@galacean/engine-xr";
import { XRTrackedObjectManager } from "./XRTrackedObjectManager";

/**
 * Manage tracked anchors and components in XR space.
 */
export class XRAnchorManager extends XRTrackedObjectManager<XRAnchor> {
  /** The anchors to tracking. */
  anchors: { position: Vector3; rotation: Quaternion }[] = [];

  constructor(entity: Entity) {
    super(entity, XRAnchorTracking);
  }

  protected override _initXRFeature(): void {
    const { anchors } = this;
    const { xrManager } = this.engine;
    try {
      const feature = xrManager.addFeature(XRAnchorTracking);
      for (let i = 0, n = anchors.length; i < n; i++) {
        const anchor = anchors[i];
        feature.addAnchor(anchor.position, anchor.rotation);
      }
    } catch (error) {
      console.error("Anchor Tracking is not supported.", error);
    }
  }
}
