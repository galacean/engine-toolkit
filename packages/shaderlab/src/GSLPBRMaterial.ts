import { PBRBaseMaterial, ShaderFactory, Shader, Engine, Vector3 } from "@galacean/engine";
import { pbr_include_fragment_list, pbrSource } from "./shaders";

export class GSLPBRMaterial extends PBRBaseMaterial {
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
    super(engine, Shader.create(pbrSource));

    const shaderData = this.shaderData;
    shaderData.setFloat("material_Metal", 1);
    shaderData.setFloat("material_Roughness", 1);
    shaderData.setFloat("material_IOR", 1.5);
    shaderData.setVector3("material_AnisotropyInfo", new Vector3(1, 0, 0));
  }
}
