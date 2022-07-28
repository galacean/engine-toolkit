import { InputManager, Vector3 } from "oasis-engine";
import { ControlHandlerType } from "../enums/ControlHandlerType";
import { OrbitControl } from "../OrbitControl";
import { OrthoControl } from "../OrthoControl";

export interface IControlInput {
  onUpdateHandler(input: InputManager): ControlHandlerType;
  onUpdateDelta(control: OrbitControl | OrthoControl, outDelta: Vector3): void;
}
