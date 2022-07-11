import { InputManager, Vector3 } from "oasis-engine";
import { ControlHandlerType } from "../enums/ControlHandlerType";
import { OrbitControl } from "../OrbitControl";
import { IControlInput } from "./IControlInput";
import { StaticInterfaceImplement } from "./StaticInterfaceImplement";

@StaticInterfaceImplement<IControlInput>()
export class ControlWheel {
  static onUpdateHandler(input: InputManager): ControlHandlerType {
    const { wheelDelta } = input;
    if (wheelDelta.x === 0 && wheelDelta.y === 0 && wheelDelta.z === 0) {
      return ControlHandlerType.None;
    } else {
      return ControlHandlerType.ZOOM;
    }
  }

  static onUpdateDelta(control: OrbitControl, outDelta: Vector3): void {
    outDelta.copyFrom(control.input.wheelDelta);
  }
}
