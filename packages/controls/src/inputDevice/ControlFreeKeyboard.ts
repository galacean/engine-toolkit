import { InputManager, Keys, Vector3 } from "@galacean/engine";
import { FreeControl } from "../FreeControl";
import { ControlHandlerType } from "../enums/ControlHandlerType";
export class ControlFreeKeyboard {
  onUpdateHandler(input: InputManager): ControlHandlerType {
    if (
      input.isKeyHeldDown(Keys.ArrowLeft) ||
      input.isKeyHeldDown(Keys.KeyA) ||
      input.isKeyHeldDown(Keys.ArrowUp) ||
      input.isKeyHeldDown(Keys.KeyW) ||
      input.isKeyHeldDown(Keys.ArrowDown) ||
      input.isKeyHeldDown(Keys.KeyS) ||
      input.isKeyHeldDown(Keys.ArrowRight) ||
      input.isKeyHeldDown(Keys.KeyD)
    ) {
      return ControlHandlerType.PAN;
    } else {
      return ControlHandlerType.None;
    }
  }

  onUpdateDelta(control: FreeControl, outDelta: Vector3): void {
    const { movementSpeed, input } = control;
    outDelta.x = outDelta.y = outDelta.z = 0;
    if (input.isKeyHeldDown(Keys.ArrowLeft) || input.isKeyHeldDown(Keys.KeyA)) {
      outDelta.x -= movementSpeed;
    }
    if (input.isKeyHeldDown(Keys.ArrowRight) || input.isKeyHeldDown(Keys.KeyD)) {
      outDelta.x += movementSpeed;
    }
    if (input.isKeyHeldDown(Keys.ArrowUp) || input.isKeyHeldDown(Keys.KeyW)) {
      outDelta.z -= movementSpeed;
    }
    if (input.isKeyHeldDown(Keys.ArrowDown) || input.isKeyHeldDown(Keys.KeyS)) {
      outDelta.z += movementSpeed;
    }
  }
}
