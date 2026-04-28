import {
  BlendFactor,
  Color,
  CompareFunction,
  Material,
  RenderQueueType,
  Shader,
  ShaderProperty,
  StencilOperation,
  Vector3
} from "@galacean/engine";

import planarShadowOnlySource from "./PlanarShadowOnly.shader";

export class PlanarShadowShaderFactory {
  private static _lightDirProp = ShaderProperty.getByName("u_lightDir");
  private static _planarHeightProp = ShaderProperty.getByName("u_planarHeight");
  private static _shadowColorProp = ShaderProperty.getByName("u_planarShadowColor");
  private static _shadowFalloffProp = ShaderProperty.getByName("u_planarShadowFalloff");

  /**
   * Replace material Shader and initialization.
   * @param material - Material to replace and initialization.
   */
  static replaceShader(material: Material) {
    material.shader = Shader.find("planarShadowShader");

    const shadowRenderState = material.renderStates[1];
    shadowRenderState.renderQueueType = RenderQueueType.Transparent;
    shadowRenderState.depthState.writeEnabled = false;

    const targetBlendState = shadowRenderState.blendState.targetBlendState;
    targetBlendState.enabled = true;
    targetBlendState.sourceColorBlendFactor = BlendFactor.SourceAlpha;
    targetBlendState.destinationColorBlendFactor = BlendFactor.OneMinusSourceAlpha;
    targetBlendState.sourceAlphaBlendFactor = BlendFactor.One;
    targetBlendState.destinationAlphaBlendFactor = BlendFactor.OneMinusSourceAlpha;

    // set shadow pass stencilState
    const stencilState = shadowRenderState.stencilState;
    stencilState.enabled = true;
    stencilState.referenceValue = 0;
    stencilState.compareFunctionFront = CompareFunction.Equal;
    stencilState.compareFunctionBack = CompareFunction.Equal;
    stencilState.failOperationFront = StencilOperation.Keep;
    stencilState.failOperationBack = StencilOperation.Keep;
    stencilState.zFailOperationFront = StencilOperation.Keep;
    stencilState.zFailOperationBack = StencilOperation.Keep;
    stencilState.passOperationFront = StencilOperation.IncrementWrap;
    stencilState.passOperationBack = StencilOperation.IncrementWrap;

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

if (!Shader.find("planarShadowShader")) {
  // The .shader file precompiles to a standalone Shader; we steal its single
  // pass and combine it with PBR's shadow caster pass for the actual material
  // shader.
  Shader.create(planarShadowOnlySource);
  const planarShadowPass = Shader.find("PlanarShadowOnly").subShaders[0].passes[0];
  Shader.create("planarShadowShader", [Shader.find("PBR").subShaders[0].passes[2], planarShadowPass]);
}
