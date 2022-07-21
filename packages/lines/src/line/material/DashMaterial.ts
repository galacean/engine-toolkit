import { Shader, Engine } from "oasis-engine";
import { LineMaterial } from "./LineMaterial";
import "./dashShader";

export class DashMaterial extends LineMaterial {
  constructor(engine: Engine) {
    super(engine);
    this.shader = Shader.find("dash");
  }
}
