import { Color, Vector2 } from "oasis-engine";
import { DashMaterial } from "./material/DashMaterial";
import Line from "./Line";
import lineBuilder from "./vertexBuilder";

export default class DashLine extends Line {
  protected _material: DashMaterial = null;

  set dash(value: Vector2) {
    this._material.dash = value;
  }

  constructor(entity) {
    super(entity);
  }

  protected async generateData() {
    return await lineBuilder.dashLine(this._flattenPoints, this._join, this._cap, 0, -1);
  }

  /**
   * @override
   */
  protected initMaterial() {
    const material = new DashMaterial(this.engine);
    material.color = new Color(1, 0, 0, 1);
    material.join = this._join;
    material.cap = this._cap;
    material.width = 0.1;
    material.dash = new Vector2(0.2, 0.1);
    this._renderer.setMaterial(material);
    this._material = material;
  }

}