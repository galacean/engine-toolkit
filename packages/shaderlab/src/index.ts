export { GSLPBRMaterial } from "./GSLPBRMaterial";
import { Shader, ShaderFactory } from "@galacean/engine";
import { fragmentList, pbrSource } from "./shaders";

let registered = false;

export function registerIncludes() {
  if (registered) return;

  for (const sourceFragment of fragmentList) {
    ShaderFactory.registerInclude(sourceFragment.includeKey, sourceFragment.source);
  }

  Shader.create(pbrSource);

  registered = true;
}
