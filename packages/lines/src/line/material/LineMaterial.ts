import { Material, Shader, Engine } from "@galacean/engine";

import { LineSource } from "../../../compiledShaders";

// @ts-ignore
Shader.find("line") || Shader._createFromPrecompiled(LineSource);

export class LineMaterial extends Material {
  constructor(engine: Engine) {
    super(engine, Shader.find("line"));
    // Render state (transparent + back-blend + no depth-write + no cull) is
    // pinned in Line.shader / Dash.shader's ShaderLab DSL — fixed for all
    // line / dash materials, so const blocks suffice.
  }
}
