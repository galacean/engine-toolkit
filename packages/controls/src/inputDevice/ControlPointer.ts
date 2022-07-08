import { InputManager, PointerButton, Vector3 } from "oasis-engine";
import { ControlHandlerType } from "../enums/ControlHandlerType";
import { OrbitControl } from "../OrbitControl";
import { ControlInputDevice } from "./ControlInputDevice";

export class ControlPointer extends ControlInputDevice {
  onUpdateHandler(input: InputManager): ControlHandlerType {
    switch (input.pointers.length) {
      case 1:
        if (input.isPointerHeldDown(PointerButton.Secondary)) {
          return ControlHandlerType.PAN;
        } else if (input.isPointerHeldDown(PointerButton.Auxiliary)) {
          return ControlHandlerType.ZOOM;
        } else if (input.isPointerHeldDown(PointerButton.Primary)) {
          return ControlHandlerType.ROTATE;
        } else {
          return ControlHandlerType.None;
        }
      case 2:
        return ControlHandlerType.ZOOM;
      case 3:
        return ControlHandlerType.PAN;
      default:
        break;
    }
    return ControlHandlerType.None;
  }

  onUpdateDelta(control: OrbitControl, outDelta: Vector3): void {
    const { pointerMovingDelta } = control.input;
    outDelta.x = pointerMovingDelta.x;
    outDelta.y = pointerMovingDelta.y;
  }
}
