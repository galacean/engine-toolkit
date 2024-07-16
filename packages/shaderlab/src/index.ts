import { Shader, ShaderFactory } from "@galacean/engine";
import { PBRSource, fragmentList } from "./shaders";

let registered = false;

export function registerIncludes() {
  if (registered) return;

  for (const sourceFragment of fragmentList) {
    ShaderFactory.registerInclude(sourceFragment.includeKey, sourceFragment.source);
  }

  registered = true;
}

export function registerShader() {
  Shader.create(PBRSource);
}
