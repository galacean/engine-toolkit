import { Engine, PBRMaterial, Shader } from "@galacean/engine";
import { pbrSource } from "./shaders";

export class GSLPBRMaterial extends PBRMaterial {
  constructor(engine: Engine) {
    const shader = Shader.find("pbr.gs") || Shader.create(pbrSource);
    super(engine);

    this.shader = shader;
  }
}
