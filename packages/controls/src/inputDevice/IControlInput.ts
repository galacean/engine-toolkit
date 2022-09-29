import { InputManager, Vector3 } from "oasis-engine";
import { ControlHandlerType } from "../enums/ControlHandlerType";
import { FreeControl } from "../FreeControl";
import { OrbitControl } from "../OrbitControl";
import { OrthoControl } from "../OrthoControl";

export interface IControlInput {
  onUpdateHandler(input: InputManager): ControlHandlerType;
  onUpdateDelta(control: OrbitControl | OrthoControl | FreeControl, outDelta: Vector3): void;
}
