import { Material, Shader, Engine, CullMode, RenderQueueType, BlendFactor, BlendOperation } from "oasis-engine";

import "./lineShader";

export class LineMaterial extends Material {
  constructor(engine: Engine) {
    super(engine, Shader.find("line"));
    const {
      depthState,
      blendState: { targetBlendState },
      rasterState
    } = this.renderState;
    rasterState.cullMode = CullMode.Off;
    depthState.writeEnabled = false;
    this.renderQueueType = RenderQueueType.Transparent;

    targetBlendState.enabled = true;
    targetBlendState.sourceColorBlendFactor = BlendFactor.SourceAlpha;
    targetBlendState.destinationColorBlendFactor = BlendFactor.OneMinusSourceAlpha;
    targetBlendState.sourceAlphaBlendFactor = BlendFactor.SourceAlpha;
    targetBlendState.destinationAlphaBlendFactor = BlendFactor.OneMinusSourceAlpha;
    targetBlendState.colorBlendOperation = BlendOperation.Add;
    targetBlendState.alphaBlendOperation = BlendOperation.Add;
  }
}
