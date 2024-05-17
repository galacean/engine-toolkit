export { GSLPBRMaterial } from "./GSLPBRMaterial";
export { ThinMaterial } from "./ThinMaterial";
import { Shader, ShaderFactory } from "@galacean/engine";
import { PBRSource, ThinSource, fragmentList } from "./shaders";

let registered = false;

export function registerIncludes() {
  if (registered) return;

  for (const sourceFragment of fragmentList) {
    ShaderFactory.registerInclude(sourceFragment.includeKey, sourceFragment.source);
  }

  Shader.create(PBRSource);
  Shader.create(ThinSource);

  registered = true;
}

export { PBRSource, ThinSource };
