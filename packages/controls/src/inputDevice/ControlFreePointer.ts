import { InputManager, PointerButton, Vector3 } from "@galacean/engine";
import { ControlHandlerType } from "../enums/ControlHandlerType";
import { OrbitControl } from "../OrbitControl";
import { IControlInput } from "./IControlInput";
import { StaticInterfaceImplement } from "./StaticInterfaceImplement";

enum DeltaType {
  Moving,
  Distance,
  None
}
@StaticInterfaceImplement<IControlInput>()
export class ControlFreePointer {
  private static _deltaType: DeltaType = DeltaType.Moving;
  private static _handlerType: ControlHandlerType = ControlHandlerType.None;
  private static _frameIndex: number = 0;
  private static _lastUsefulFrameIndex: number = -1;
  static onUpdateHandler(input: InputManager): ControlHandlerType {
    ++this._frameIndex;
    if (input.pointers.length === 1) {
      if (input.isPointerHeldDown(PointerButton.Primary)) {
        this._updateType(ControlHandlerType.ROTATE, DeltaType.Moving);
      } else {
        const { deltaPosition } = input.pointers[0];
        if ((deltaPosition.x !== 0 || deltaPosition.y !== 0) && input.isPointerUp(PointerButton.Primary)) {
          this._updateType(ControlHandlerType.ROTATE, DeltaType.Moving);
        } else {
          this._updateType(ControlHandlerType.None, DeltaType.None);
        }
      }
    } else {
      this._updateType(ControlHandlerType.None, DeltaType.None);
    }
    return this._handlerType;
  }

  static onUpdateDelta(control: OrbitControl, outDelta: Vector3): void {
    const { _frameIndex: frameIndex } = this;
    switch (this._deltaType) {
      case DeltaType.Moving:
        if (this._lastUsefulFrameIndex === frameIndex - 1) {
          const { deltaPosition } = control.input.pointers[0];
          outDelta.x = deltaPosition.x;
          outDelta.y = deltaPosition.y;
        } else {
          outDelta.x = 0;
          outDelta.y = 0;
        }
        break;
      default:
        break;
    }
    this._lastUsefulFrameIndex = frameIndex;
  }

  private static _updateType(handlerType: ControlHandlerType, deltaType: DeltaType) {
    if (this._handlerType !== handlerType || this._deltaType !== deltaType) {
      this._handlerType = handlerType;
      this._deltaType = deltaType;
      this._lastUsefulFrameIndex = -1;
    }
  }
}
