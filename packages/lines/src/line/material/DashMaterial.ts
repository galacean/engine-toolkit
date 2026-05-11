import { Shader, Engine } from "@galacean/engine";
import { LineMaterial } from "./LineMaterial";
import { DashSource } from "../../../libs";

// @ts-ignore
Shader.find("dash") || Shader._createFromPrecompiled(DashSource);

export class DashMaterial extends LineMaterial {
  constructor(engine: Engine) {
    super(engine);
    this.shader = Shader.find("dash");
  }
}
