import { InputManager, Vector3 } from "oasis-engine";
import { ControlHandlerType } from "../enums/ControlHandlerType";
import { OrbitControl } from "../OrbitControl";

export abstract class ControlInputDevice {
  onUpdateHandler(input: InputManager): ControlHandlerType {
    return ControlHandlerType.None;
  }
  onUpdateDelta(control: OrbitControl, outDelta: Vector3): void {
    return null;
  }
}
