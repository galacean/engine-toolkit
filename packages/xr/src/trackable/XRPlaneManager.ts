import { Entity, Logger } from "@galacean/engine";
import { XRPlaneMode, XRPlaneTracking, XRTrackedPlane } from "@galacean/engine-xr";
import { XRTrackedObjectManager } from "./XRTrackedObjectManager";

/**
 * Manage tracked planes and components in XR space.
 */
export class XRPlaneManager extends XRTrackedObjectManager<XRTrackedPlane> {
  /** The plane detection mode. */
  detectionMode: XRPlaneMode = XRPlaneMode.EveryThing;

  constructor(entity: Entity) {
    super(entity, XRPlaneTracking);
  }

  protected override _initXRFeature(): void {
    try {
      this.engine.xrManager.addFeature(XRPlaneTracking, this.detectionMode);
    } catch (error) {
      Logger.error("Plane Tracking is not supported.", error);
    }
  }
}
