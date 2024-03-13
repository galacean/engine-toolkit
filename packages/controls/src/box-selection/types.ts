import { Vector2 } from "@galacean/engine";

export interface IBoxSelectionHelper {
  onSelectStart(vec2: Vector2): any;
  onSelecting(vec2: Vector2): any;
  onSelectEnd(vec2: Vector2): any;
}
