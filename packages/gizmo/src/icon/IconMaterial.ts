import { BaseMaterial, Color, CullMode, Engine, Shader, Texture2D } from "@galacean/engine";

import shaderSource from "./Icon.shader";

Shader.find("icon") || Shader.create(shaderSource);

/**
 * Icon Material. don't effected by light and fog.
 */
export class IconMaterial extends BaseMaterial {
  /**
   * Base color.
   */
  get baseColor(): Color {
    return this.shaderData.getColor(IconMaterial._baseColorProp);
  }

  set baseColor(value: Color) {
    const baseColor = this.shaderData.getColor(IconMaterial._baseColorProp);
    if (value !== baseColor) {
      baseColor.copyFrom(value);
    }
  }

  /**
   * Base texture.
   */
  get baseTexture(): Texture2D {
    return <Texture2D>this.shaderData.getTexture(IconMaterial._baseTextureProp);
  }

  set baseTexture(value: Texture2D) {
    this.shaderData.setTexture(IconMaterial._baseTextureProp, value);
    if (value) {
      this.shaderData.enableMacro(IconMaterial._baseTextureMacro);
    } else {
      this.shaderData.disableMacro(IconMaterial._baseTextureMacro);
    }
  }

  /**
   * Create a plain color material instance.
   * @param engine - Engine to which the material belongs
   */
  constructor(engine: Engine) {
    super(engine, Shader.find("icon"));
    this.shaderData.setColor(IconMaterial._baseColorProp, new Color(1, 1, 1, 1));
    // RasterState (CullMode.Off) and DepthState (Enabled=false) are pinned in
    // Icon.shader's ShaderLab DSL — gizmo icons are always double-sided
    // overlays that ignore depth.
  }

  override clone(): IconMaterial {
    const dest = new IconMaterial(this.engine);
    this.cloneTo(dest);
    return dest;
  }
}
