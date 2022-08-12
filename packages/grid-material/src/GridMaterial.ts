import { BaseMaterial, Engine, Shader } from "oasis-engine";

export class GridMaterial extends BaseMaterial {
  constructor(engine: Engine) {
    super(engine, Shader.find("grid"));
  }
}