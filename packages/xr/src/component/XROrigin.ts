import { Camera, Entity, Script } from "@galacean/engine";
import { XRSessionMode, XRTrackedInputDevice } from "@galacean/engine-xr";

/**
 * The XROrigin component is used to set the origin and camera of the XR space.
 */
export class XROrigin extends Script {
  /** The mode of the XR session.*/
  mode: XRSessionMode = XRSessionMode.AR;
  /** The entity that will be used as the origin of the XR session.*/
  origin: Entity;
  /** The Camera on the entity will be connected to the camera in XR space.*/
  camera: Entity;
  /** The Camera on the entity will be connected to the left camera in XR space.*/
  leftCamera: Entity;
  /** The Camera on the entity will be connected to the right camera in XR space.*/
  rightCamera: Entity;

  override onEnable(): void {
    const { xrManager } = this.engine;
    if (!xrManager) return;
    switch (this.mode) {
      case XRSessionMode.AR:
        xrManager.origin = this.origin;
        const camera = this.camera?.getComponent(Camera);
        if (camera) {
          xrManager.cameraManager.attachCamera(XRTrackedInputDevice.Camera, camera);
        } else {
          throw new Error("XROrigin: The Camera is not included on the Camera Entity");
        }
        break;
      case XRSessionMode.VR:
        xrManager.origin = this.origin;
        const leftCamera = this.leftCamera?.getComponent(Camera);
        if (leftCamera) {
          xrManager.cameraManager.attachCamera(XRTrackedInputDevice.LeftCamera, leftCamera);
        } else {
          throw new Error("XROrigin: The Camera is not included on the Left Camera Entity");
        }
        const rightCamera = this.rightCamera?.getComponent(Camera);
        if (rightCamera) {
          xrManager.cameraManager.attachCamera(XRTrackedInputDevice.RightCamera, rightCamera);
        } else {
          throw new Error("XROrigin: The Camera is not included on the Right Camera Entity");
        }
        break;
      default:
        break;
    }
  }
}
