import { InputManager, Keys, Vector3 } from "oasis-engine";
import { ControlHandlerType } from "../enums/ControlHandlerType";
import { OrbitControl } from "../OrbitControl";
import { ControlInputDevice } from "./ControlInputDevice";

export class ControlKeyboard extends ControlInputDevice {
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
      outDelta.set(0, 0, 0);
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