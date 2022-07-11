import { InputManager, Vector3 } from "oasis-engine";
import { ControlHandlerType } from "../enums/ControlHandlerType";
import { OrbitControl } from "../OrbitControl";

export interface IControlInput {
  onUpdateHandler(input: InputManager): ControlHandlerType;
  onUpdateDelta(control: OrbitControl, outDelta: Vector3): void;
}
