import { Color, Vector2, Texture2D } from "@galacean/engine";
import { DashMaterial } from "./material/DashMaterial";
import { Line } from "./Line";
import { LineVertexBuilder } from "./vertexBuilder";

/**
 * Dash Line.
 */
export class DashLine extends Line {
  protected override _material: DashMaterial = null;
  private _dash: Vector2;

  /**
   * The dash sequence is a series of on/off lengths in points. e.g. [3, 1] would be 3pt long lines separated by 1pt spaces.
   */
  get dash(): Vector2 {
    return this._dash;
  }

  set dash(val: Vector2) {
    this._dash = val;
    this._renderer?.shaderData.setVector2("u_dash", val);
    const texture = new Texture2D(this.engine, 1, Math.ceil((val.x + val.y) * 10));
    texture.setPixelBuffer(this._generateDashTexture(val));
    this._renderer?.shaderData.setTexture("u_texture", texture);
  }

  constructor(entity) {
    super(entity);
  }

  protected override async _generateData() {
    return await LineVertexBuilder.instance.dashLine(this._flattenPoints, this._join, this._cap, 0, -1);
  }

  protected override _initMaterial() {
    const material = new DashMaterial(this.engine);
    this._renderer.setMaterial(material);
    this._material = material;
  }

  private _generateDashTexture(dash) {
    const pixels: number[] = [];
    const length = Math.ceil((dash.x + dash.y) * 10);
    for (let index = 0; index < length; index++) {
      if (index < dash.x * 10) {
        pixels.push(255, 255, 255, 255);
      } else {
        pixels.push(255, 255, 255, 0);
      }
    }
    return new Uint8Array(pixels);
  }
}
