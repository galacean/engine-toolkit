export { GSLPBRMaterial } from "./GSLPBRMaterial";
import { Shader, ShaderFactory } from "@galacean/engine";
import { fragmentList, PBRSource } from "./shaders";

let registered = false;

export function registerIncludes() {
  if (registered) return;

  for (const sourceFragment of fragmentList) {
    ShaderFactory.registerInclude(sourceFragment.includeKey, sourceFragment.source);
  }

  Shader.create(PBRSource);

  registered = true;
}

export { PBRSource };
