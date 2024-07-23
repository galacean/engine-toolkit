import { Entity } from "@galacean/engine";
import { XRImageTracking, XRReferenceImage, XRTrackedImage } from "@galacean/engine-xr";
import { XRTrackedObjectManager } from "./XRTrackedObjectManager";

/**
 * Manage tracked images and components in XR space.
 */
export class XRImageManager extends XRTrackedObjectManager<XRTrackedImage> {
  /** The image to tracking. */
  trackingImages: XRReferenceImage[] = [];

  constructor(entity: Entity) {
    super(entity, XRImageTracking);
  }

  protected override _initXRFeature(): void {
    try {
      this.engine.xrManager.addFeature(XRImageTracking, this.trackingImages);
    } catch (error) {
      console.error("Image Tracking is not supported.", error);
    }
  }
}
