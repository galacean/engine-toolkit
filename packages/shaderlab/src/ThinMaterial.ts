import { Engine, PBRMaterial, Shader } from "@galacean/engine";

export class ThinMaterial extends PBRMaterial {
  constructor(engine: Engine) {
    const shader = Shader.find("thin.gs");
    super(engine);

    this.shader = shader;
  }
}
