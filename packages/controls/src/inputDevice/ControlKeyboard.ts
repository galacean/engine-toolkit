import { InputManager, Keys, Vector3 } from "@galacean/engine";
import { OrbitControl } from "../OrbitControl";
import { ControlHandlerType } from "../enums/ControlHandlerType";
import { IControlInput } from "./IControlInput";

export class ControlKeyboard implements IControlInput {
  onUpdateHandler(input: InputManager): ControlHandlerType {
    if (
      input.isKeyHeldDown(Keys.ArrowLeft) ||
      input.isKeyHeldDown(Keys.ArrowRight) ||
      input.isKeyHeldDown(Keys.ArrowUp) ||
      input.isKeyHeldDown(Keys.ArrowDown)
    ) {
      return ControlHandlerType.PAN;
    } else {
      return ControlHandlerType.None;
    }
  }

  onUpdateDelta(control: OrbitControl, outDelta: Vector3): void {
    const { keyPanSpeed, input } = control;
    outDelta.x = outDelta.y = 0;
    if (input.isKeyHeldDown(Keys.ArrowLeft)) {
      outDelta.x += keyPanSpeed;
    }
    if (input.isKeyHeldDown(Keys.ArrowRight)) {
      outDelta.x -= keyPanSpeed;
    }
    if (input.isKeyHeldDown(Keys.ArrowUp)) {
      outDelta.y += keyPanSpeed;
    }
    if (input.isKeyHeldDown(Keys.ArrowDown)) {
      outDelta.y -= keyPanSpeed;
    }
  }
}
