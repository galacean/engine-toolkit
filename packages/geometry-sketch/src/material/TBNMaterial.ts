import { BaseMaterial, Color, Engine, Shader } from "@galacean/engine";

import { TBNSource } from "../../libs";

// @ts-ignore
Shader.find("tbnShader") || Shader._createFromPrecompiled(TBNSource);

/**
 * Material for normal shading
 */
export class NormalMaterial extends BaseMaterial {
  /**
   * Base color.
   */
  get baseColor(): Color {
    return this.shaderData.getColor(NormalMaterial._baseColorProp);
  }

  set baseColor(value: Color) {
    const baseColor = this.shaderData.getColor(NormalMaterial._baseColorProp);
    if (value !== baseColor) {
      baseColor.copyFrom(value);
    }
  }

  constructor(engine: Engine) {
    super(engine, Shader.find("tbnShader"));
    this.shaderData.setColor(NormalMaterial._baseColorProp, new Color(1, 0, 0, 1));
    this.shaderData.enableMacro("SHOW_NORMAL");
  }
}

/**
 * Material for normal tangent
 */
export class TangentMaterial extends BaseMaterial {
  /**
   * Base color.
   */
  get baseColor(): Color {
    return this.shaderData.getColor(TangentMaterial._baseColorProp);
  }

  set baseColor(value: Color) {
    const baseColor = this.shaderData.getColor(TangentMaterial._baseColorProp);
    if (value !== baseColor) {
      baseColor.copyFrom(value);
    }
  }

  constructor(engine: Engine) {
    super(engine, Shader.find("tbnShader"));
    this.shaderData.setColor(TangentMaterial._baseColorProp, new Color(0, 1, 0, 1));
    this.shaderData.enableMacro("SHOW_TANGENT");
  }
}

/**
 * Material for normal bi-tangent
 */
export class BiTangentMaterial extends BaseMaterial {
  /**
   * Base color.
   */
  get baseColor(): Color {
    return this.shaderData.getColor(BiTangentMaterial._baseColorProp);
  }

  set baseColor(value: Color) {
    const baseColor = this.shaderData.getColor(BiTangentMaterial._baseColorProp);
    if (value !== baseColor) {
      baseColor.copyFrom(value);
    }
  }

  constructor(engine: Engine) {
    super(engine, Shader.find("tbnShader"));
    this.shaderData.setColor(BiTangentMaterial._baseColorProp, new Color(0, 0, 1, 1));
    this.shaderData.enableMacro("SHOW_BITANGENT");
  }
}
