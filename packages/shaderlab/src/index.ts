export { GSLPBRMaterial } from "./GSLPBRMaterial";
import { ShaderFactory } from "@galacean/engine";
import { fragmentList } from "./shaders";

let registered = false;

export function registerIncludes() {
  if (registered) return;

  for (const sourceFragment of fragmentList) {
    ShaderFactory.registerInclude(sourceFragment.includeKey, sourceFragment.source);
  }
  registered = true;
}
