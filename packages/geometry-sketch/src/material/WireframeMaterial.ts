import { BaseMaterial, Color, Engine, RenderFace, Shader } from "@galacean/engine";

import shaderSource from "./Wireframe.shader";

Shader.find("wireframeShader") || Shader.create(shaderSource);

export class WireframeMaterial extends BaseMaterial {
  /**
   * Base color.
   */
  get baseColor(): Color {
    return this.shaderData.getColor(WireframeMaterial._baseColorProp);
  }

  set baseColor(value: Color) {
    const baseColor = this.shaderData.getColor(WireframeMaterial._baseColorProp);
    if (value !== baseColor) {
      baseColor.copyFrom(value);
    }
  }

  constructor(engine: Engine) {
    super(engine, Shader.find("wireframeShader"));
    this.shaderData.setColor(WireframeMaterial._baseColorProp, new Color(0, 0, 0, 1));
    this.isTransparent = true;
    this.renderFace = RenderFace.Double;
  }
}
