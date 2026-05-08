import { BaseMaterial, Color, Engine, Shader } from "@galacean/engine";
import shaderSource from "./PlainColor.shader";

Shader.find("plain-color") || Shader.create(shaderSource);

/**
 * plain color Material. don't effected by light and fog.
 */
export class PlainColorMaterial extends BaseMaterial {
  /**
   * Base color.
   */
  get baseColor(): Color {
    return this.shaderData.getColor(PlainColorMaterial._baseColorProp);
  }

  set baseColor(value: Color) {
    const baseColor = this.shaderData.getColor(PlainColorMaterial._baseColorProp);
    if (value !== baseColor) {
      baseColor.copyFrom(value);
    }
  }

  /**
   * Create a plain color material instance.
   * @param engine - Engine to which the material belongs
   */
  constructor(engine: Engine) {
    super(engine, Shader.find("plain-color"));

    const shaderData = this.shaderData;

    shaderData.enableMacro("MATERIAL_OMIT_NORMAL");

    shaderData.setColor(PlainColorMaterial._baseColorProp, new Color(1, 1, 1, 1));

    // depth test on by default; gizmo overlays opt out by setting `depthEnabled` to 0.
    shaderData.setInt("depthEnabled", 1);
  }

  override clone(): PlainColorMaterial {
    const dest = new PlainColorMaterial(this.engine);
    this.cloneTo(dest);
    return dest;
  }
}
