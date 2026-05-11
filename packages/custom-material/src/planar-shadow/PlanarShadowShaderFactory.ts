import { Color, Material, Shader, ShaderProperty, Vector3 } from "@galacean/engine";

import { PlanarShadowOnlySource } from "../../libs";

// @ts-ignore
Shader.find("PlanarShadowOnly") || Shader._createFromPrecompiled(PlanarShadowOnlySource);

export class PlanarShadowShaderFactory {
  private static _lightDirProp = ShaderProperty.getByName("u_lightDir");
  private static _planarHeightProp = ShaderProperty.getByName("u_planarHeight");
  private static _shadowColorProp = ShaderProperty.getByName("u_planarShadowColor");
  private static _shadowFalloffProp = ShaderProperty.getByName("u_planarShadowFalloff");

  private static _ensureCombinedShader(): void {
    if (Shader.find("planarShadowShader")) return;
    const planarShadowPass = Shader.find("PlanarShadowOnly").subShaders[0].passes[0];
    Shader.create("planarShadowShader", [Shader.find("PBR").subShaders[0].passes[2], planarShadowPass]);
  }

  /**
   * Replace material Shader and initialization.
   * @param material - Material to replace and initialization.
   */
  static replaceShader(material: Material) {
    PlanarShadowShaderFactory._ensureCombinedShader();
    material.shader = Shader.find("planarShadowShader");

    // Render state for the shadow pass (queue / blend / depth / stencil) is
    // pinned in PlanarShadowOnly.shader's ShaderLab DSL block.
    const shaderData = material.shaderData;
    shaderData.setFloat(PlanarShadowShaderFactory._shadowFalloffProp, 0);
    shaderData.setColor(PlanarShadowShaderFactory._shadowColorProp, new Color(1.0, 1.0, 1.0, 1.0));
    shaderData.setVector3(PlanarShadowShaderFactory._lightDirProp, new Vector3(0, 0, 0));
    shaderData.setFloat(PlanarShadowShaderFactory._planarHeightProp, 0);
  }

  /**
   * Set planar height.
   */
  static setPlanarHeight(material: Material, value: number) {
    material.shaderData.setFloat(PlanarShadowShaderFactory._planarHeightProp, value);
  }

  /**
   * Set light direction.
   */
  static setLightDirection(material: Material, value: Vector3) {
    const lightDir = material.shaderData.getVector3(PlanarShadowShaderFactory._lightDirProp);
    if (value !== lightDir) {
      lightDir.copyFrom(value.normalize());
    } else {
      value.normalize();
    }
  }

  /**
   * Set shadow color
   */
  static setShadowColor(material: Material, value: Color) {
    const shadowColor = material.shaderData.getColor(PlanarShadowShaderFactory._shadowColorProp);
    if (value !== shadowColor) {
      shadowColor.copyFrom(value);
    }
  }

  /**
   * Set Shadow falloff coefficient
   */
  static setShadowFalloff(material: Material, value: number) {
    material.shaderData.setFloat(PlanarShadowShaderFactory._shadowFalloffProp, value);
  }
}
