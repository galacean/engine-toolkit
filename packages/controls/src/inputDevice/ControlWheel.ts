import { InputManager, Vector3 } from "oasis-engine";
import { ControlHandlerType } from "../enums/ControlHandlerType";
import { OrbitControl } from "../OrbitControl";
import { ControlInputDevice } from "./ControlInputDevice";

export class ControlWheel extends ControlInputDevice {
  onUpdateHandler(input: InputManager): ControlHandlerType {
    const { wheelDelta } = input;
    if (wheelDelta.x === 0 && wheelDelta.y === 0 && wheelDelta.z === 0) {
      return ControlHandlerType.None;
    } else {
      return ControlHandlerType.ZOOM;
    }
  }

  onUpdateDelta(control: OrbitControl, outDelta: Vector3): void {
    const deltaY = control.input.wheelDelta.y;
    let scale = Math.pow(0.95, control.zoomSpeed);
    if (deltaY < 0) {
      outDelta.x = scale;
    } else if (deltaY > 0) {
      outDelta.x = 1 / scale;
    } else {
      outDelta.x = 1;
    }
  }
}
