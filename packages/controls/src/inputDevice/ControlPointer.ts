import { InputManager, PointerButton, Vector3, Vector2 } "@galacean/engine";
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
export class ControlPointer {
  private static _deltaType: DeltaType = DeltaType.None;
  private static _handlerType: ControlHandlerType = ControlHandlerType.None;
  private static _frameIndex: number = 0;
  private static _lastUsefulFrameIndex: number = -1;
  private static _distanceOfPointers: number = 0;
  static onUpdateHandler(input: InputManager): ControlHandlerType {
    ++this._frameIndex;
    const { pointers } = input;
    switch (pointers.length) {
      case 1:
        if (input.isPointerHeldDown(PointerButton.Secondary)) {
          this._updateType(ControlHandlerType.PAN, DeltaType.Moving);
        } else if (input.isPointerHeldDown(PointerButton.Auxiliary)) {
          this._updateType(ControlHandlerType.ZOOM, DeltaType.Moving);
        } else if (input.isPointerHeldDown(PointerButton.Primary)) {
          this._updateType(ControlHandlerType.ROTATE, DeltaType.Moving);
        } else {
          // When `onPointerMove` happens on the same frame as `onPointerUp`
          // Need to record the movement of this frame
          const { deltaPosition } = input.pointers[0];
          if (deltaPosition.x !== 0 && deltaPosition.y !== 0) {
            if (input.isPointerUp(PointerButton.Secondary)) {
              this._updateType(ControlHandlerType.PAN, DeltaType.Moving);
            } else if (input.isPointerUp(PointerButton.Auxiliary)) {
              this._updateType(ControlHandlerType.ZOOM, DeltaType.Moving);
            } else if (input.isPointerUp(PointerButton.Primary)) {
              this._updateType(ControlHandlerType.ROTATE, DeltaType.Moving);
            } else {
              this._updateType(ControlHandlerType.None, DeltaType.None);
            }
          } else {
            this._updateType(ControlHandlerType.None, DeltaType.None);
          }
        }
        break;
      case 2:
        this._updateType(ControlHandlerType.ZOOM, DeltaType.Distance);
        break;
      case 3:
        this._updateType(ControlHandlerType.PAN, DeltaType.Moving);
        break;
      default:
        this._updateType(ControlHandlerType.None, DeltaType.None);
        break;
    }
    return this._handlerType;
  }

  static onUpdateDelta(control: OrbitControl, outDelta: Vector3): void {
    const { _frameIndex: frameIndex } = this;
    switch (this._deltaType) {
      case DeltaType.Moving:
        outDelta.x = 0;
        outDelta.y = 0;
        if (this._lastUsefulFrameIndex === frameIndex - 1) {
          const { pointers } = control.input;
          const length = pointers.length;
          for (let i = length - 1; i >= 0; i--) {
            const { deltaPosition } = pointers[i];
            outDelta.x += deltaPosition.x;
            outDelta.y += deltaPosition.y;
          }
          outDelta.x /= length;
          outDelta.y /= length;
        }
        break;
      case DeltaType.Distance:
        const { pointers } = control.input;
        const pointer1 = pointers[0];
        const pointer2 = pointers[1];
        const curDistance = Vector2.distance(pointer1.position, pointer2.position);
        if (this._lastUsefulFrameIndex === frameIndex - 1) {
          outDelta.set(0, this._distanceOfPointers - curDistance, 0);
        } else {
          outDelta.set(0, 0, 0);
        }
        this._distanceOfPointers = curDistance;
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
