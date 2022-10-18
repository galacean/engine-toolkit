import { InputManager, PointerButton, Vector3, Vector2 } from "oasis-engine";
import { ControlHandlerType } from "../enums/ControlHandlerType";
import { OrbitControl } from "../OrbitControl";
import { IControlInput } from "./IControlInput";
import { StaticInterfaceImplement } from "./StaticInterfaceImplement";

enum DeltaType {
  Moving,
  Distance
}
@StaticInterfaceImplement<IControlInput>()
export class ControlPointer {
  private static _deltaType: DeltaType = DeltaType.Moving;
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
          if (input.pointerMovingDelta.x !== 0 && input.pointerMovingDelta.y !== 0) {
            if (input.isPointerUp(PointerButton.Secondary)) {
              this._updateType(ControlHandlerType.PAN, DeltaType.Moving);
            } else if (input.isPointerUp(PointerButton.Auxiliary)) {
              this._updateType(ControlHandlerType.ZOOM, DeltaType.Moving);
            } else if (input.isPointerUp(PointerButton.Primary)) {
              this._updateType(ControlHandlerType.ROTATE, DeltaType.Moving);
            } else {
              this._updateType(ControlHandlerType.None, DeltaType.Moving);
            }
          } else {
            this._updateType(ControlHandlerType.None, DeltaType.Moving);
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
        this._updateType(ControlHandlerType.None, DeltaType.Moving);
        break;
    }
    return this._handlerType;
  }

  static onUpdateDelta(control: OrbitControl, outDelta: Vector3): void {
    const { _frameIndex: frameIndex } = this;
    switch (this._deltaType) {
      case DeltaType.Moving:
        if (this._lastUsefulFrameIndex === frameIndex - 1) {
          const { pointerMovingDelta } = control.input;
          outDelta.x = pointerMovingDelta.x;
          outDelta.y = pointerMovingDelta.y;
        } else {
          outDelta.x = 0;
          outDelta.y = 0;
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
