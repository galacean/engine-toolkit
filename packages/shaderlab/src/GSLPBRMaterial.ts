import { Engine, PBRMaterial, Shader } from "@galacean/engine";

export class GSLPBRMaterial extends PBRMaterial {
  constructor(engine: Engine) {
    const shader = Shader.find("pbr.gs");
    super(engine);

    this.shader = shader;
  }
}
