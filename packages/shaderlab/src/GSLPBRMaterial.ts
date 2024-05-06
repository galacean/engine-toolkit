import { Engine, PBRMaterial, Shader, ShaderFactory } from "@galacean/engine";
import { pbrSource, pbr_include_fragment_list } from "./shaders";

export class GSLPBRMaterial extends PBRMaterial {
  private static _registered = false;

  static registerIncludes() {
    if (this._registered) return;

    for (const sourceFragment of pbr_include_fragment_list) {
      ShaderFactory.registerInclude(sourceFragment.includeKey, sourceFragment.source);
    }
    this._registered = true;
  }

  constructor(engine: Engine) {
    GSLPBRMaterial.registerIncludes();
    const shader = Shader.find("pbr.gs") || Shader.create(pbrSource);
    super(engine);

    this.shader = shader;
  }
}
