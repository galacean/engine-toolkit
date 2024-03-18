import { BaseMaterial, Engine, Shader, ShaderProperty, Vector2, Vector4 } from "@galacean/engine";

export class BoxSelectionSSMaterial extends BaseMaterial {
  private static _borderWidth = ShaderProperty.getByName("u_width");
  private static _minPoint = ShaderProperty.getByName("u_min");
  private static _maxPoint = ShaderProperty.getByName("u_max");
  private static _boxColor = ShaderProperty.getByName("u_boxColor");
  private static _borderColor = ShaderProperty.getByName("u_borderColor");
  constructor(engine: Engine) {
    super(engine, Shader.find("box"));
    this.isTransparent = true;
    this.boxColor = new Vector4(0.29, 0.63, 1, 0.3);
    this.borderColor = new Vector4(0.22, 0.48, 1, 0.9);
    this.borderWidth = devicePixelRatio;
  }

  get minPoint(): Vector2 {
    return this.shaderData.getVector2(BoxSelectionSSMaterial._minPoint);
  }

  set minPoint(value: Vector2) {
    this.shaderData.setVector2(BoxSelectionSSMaterial._minPoint, value);
  }

  get maxPoint(): Vector2 {
    return this.shaderData.getVector2(BoxSelectionSSMaterial._maxPoint);
  }

  set maxPoint(value: Vector2) {
    this.shaderData.setVector2(BoxSelectionSSMaterial._maxPoint, value);
  }

  get boxColor(): Vector4 {
    return this.shaderData.getVector4(BoxSelectionSSMaterial._boxColor);
  }

  set boxColor(value: Vector4) {
    this.shaderData.setVector4(BoxSelectionSSMaterial._boxColor, value);
  }

  get borderColor(): Vector4 {
    return this.shaderData.getVector4(BoxSelectionSSMaterial._borderColor);
  }

  set borderColor(value: Vector4) {
    this.shaderData.setVector4(BoxSelectionSSMaterial._borderColor, value);
  }

  get borderWidth(): number {
    return this.shaderData.getFloat(BoxSelectionSSMaterial._borderWidth);
  }

  set borderWidth(value: number) {
    this.shaderData.setFloat(BoxSelectionSSMaterial._borderWidth, value);
  }
}

Shader.create(
  "box",
  `
#include <common>
#include <common_vert>

void main() {
  gl_Position = vec4(POSITION, 1.0);
}`,

  `
uniform vec2 u_min;
uniform vec2 u_max;
uniform vec4 u_boxColor;
uniform vec4 u_borderColor;
uniform float u_width;

void main() {
  float vColor = step(u_min.x + u_width, gl_FragCoord.x) * step(gl_FragCoord.x, u_max.x - u_width) * step(u_min.y + u_width, gl_FragCoord.y) * step(gl_FragCoord.y, u_max.y - u_width);
  float vBorder = step(u_min.x, gl_FragCoord.x) * step(gl_FragCoord.x, u_max.x) * step(u_min.y, gl_FragCoord.y) * step(gl_FragCoord.y, u_max.y);
  gl_FragColor = u_boxColor * vColor + (1. - vColor) * vBorder * u_borderColor;
}
`
);
