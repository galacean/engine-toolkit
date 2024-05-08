export { GSLPBRMaterial } from "./GSLPBRMaterial";
export { ThinMaterial } from "./ThinMaterial";
import { Shader, ShaderFactory } from "@galacean/engine";
import { fragmentList, pbrSource, thinSource } from "./shaders";

let registered = false;

export function registerIncludes() {
  if (registered) return;

  for (const sourceFragment of fragmentList) {
    ShaderFactory.registerInclude(sourceFragment.includeKey, sourceFragment.source);
  }

  Shader.create(pbrSource);
  Shader.create(thinSource);

  registered = true;
}
