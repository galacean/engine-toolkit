import { Engine, PBRMaterial, Shader, Texture2D } from "oasis-engine";
import fragment from "./fragment";
import vertex from "./vertex";

Shader.create("bake-pbr", vertex, fragment);

/**
 * Bake PBR Material.
 */
export class BakePBRMaterial extends PBRMaterial {
  private static _lightMapTextureProp = Shader.getPropertyByName("u_lightMapTexture");
  private static _lightMapIntensityProp = Shader.getPropertyByName("u_lightMapIntensity");

  /**
   * Light map texture.
   */
  get lightmapTexture(): Texture2D {
    return <Texture2D>this.shaderData.getTexture(BakePBRMaterial._lightMapTextureProp);
  }

  set lightmapTexture(value: Texture2D) {
    this.shaderData.setTexture(BakePBRMaterial._lightMapTextureProp, value);
    if (value) {
      this.shaderData.enableMacro("LIGHTMAP_TEXTURE");
    } else {
      this.shaderData.disableMacro("LIGHTMAP_TEXTURE");
    }
  }

  /**
   * Light map intensity, default 1.0.
   */
  get lightmapIntensity(): number {
    return this.shaderData.getFloat(BakePBRMaterial._lightMapIntensityProp);
  }

  set lightmapIntensity(value: number) {
    this.shaderData.setFloat(BakePBRMaterial._lightMapIntensityProp, value);
  }

  /**
   * Create a pbr metallic-roughness workflow material instance.
   * @param engine - Engine to which the material belongs
   */
  constructor(engine: Engine) {
    super(engine);
    this.shader = Shader.find("bake-pbr");
    this.shaderData.setFloat(BakePBRMaterial._lightMapIntensityProp, 1);
  }

  /**
   * @override
   */
  clone(): BakePBRMaterial {
    const dest = new BakePBRMaterial(this._engine);
    this.cloneTo(dest);
    return dest;
  }
}
