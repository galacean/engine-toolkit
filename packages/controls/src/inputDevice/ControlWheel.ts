import { InputManager, Vector3 } from "@galacean/engine";
import { OrbitControl } from "../OrbitControl";
import { ControlHandlerType } from "../enums/ControlHandlerType";
import { IControlInput } from "./IControlInput";

export class ControlWheel implements IControlInput {
  onUpdateHandler(input: InputManager): ControlHandlerType {
    const { wheelDelta } = input;
    if (wheelDelta.x === 0 && wheelDelta.y === 0 && wheelDelta.z === 0) {
      return ControlHandlerType.None;
    } else {
      return ControlHandlerType.ZOOM;
    }
  }

  onUpdateDelta(control: OrbitControl, outDelta: Vector3): void {
    outDelta.copyFrom(control.input.wheelDelta);
  }
}
