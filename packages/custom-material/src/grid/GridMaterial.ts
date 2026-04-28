import { BaseMaterial, Engine, MathUtil, Shader, ShaderProperty } from "@galacean/engine";
import shaderSource from "./Grid.shader";

Shader.find("grid") || Shader.create(shaderSource);

/**
 * Grid Material.
 */
export class GridMaterial extends BaseMaterial {
  private static _farClipProperty = ShaderProperty.getByName("u_far");
  private static _nearClipProperty = ShaderProperty.getByName("u_near");
  private static _primaryScaleProperty = ShaderProperty.getByName("u_primaryScale");
  private static _secondaryScaleProperty = ShaderProperty.getByName("u_secondaryScale");
  private static _gridIntensityProperty = ShaderProperty.getByName("u_gridIntensity");
  private static _axisIntensityProperty = ShaderProperty.getByName("u_axisIntensity");
  private static _flipProgressProperty = ShaderProperty.getByName("u_flipProgress");
  private static _fadeProperty = ShaderProperty.getByName("u_fade");

  /**
   * Near clip plane - the closest point to the camera when rendering occurs.
   */
  get nearClipPlane(): number {
    return this.shaderData.getFloat(GridMaterial._nearClipProperty);
  }

  set nearClipPlane(value: number) {
    this.shaderData.setFloat(GridMaterial._nearClipProperty, value);
  }

  /**
   * Far clip plane - the furthest point to the camera when rendering occurs.
   */
  get farClipPlane(): number {
    return this.shaderData.getFloat(GridMaterial._farClipProperty);
  }

  set farClipPlane(value: number) {
    this.shaderData.setFloat(GridMaterial._farClipProperty, value);
  }

  /**
   * Primary scale of grid size.
   */
  get primaryScale(): number {
    return this.shaderData.getFloat(GridMaterial._primaryScaleProperty);
  }

  set primaryScale(value: number) {
    this.shaderData.setFloat(GridMaterial._primaryScaleProperty, value);
  }

  /**
   * Secondary scale of grid size.
   */
  get secondaryScale(): number {
    return this.shaderData.getFloat(GridMaterial._secondaryScaleProperty);
  }

  set secondaryScale(value: number) {
    this.shaderData.setFloat(GridMaterial._secondaryScaleProperty, value);
  }

  /**
   * Grid color intensity.
   */
  get gridIntensity(): number {
    return this.shaderData.getFloat(GridMaterial._gridIntensityProperty);
  }

  set gridIntensity(value: number) {
    this.shaderData.setFloat(GridMaterial._gridIntensityProperty, value);
  }

  /**
   * Axis color intensity.
   */
  get axisIntensity(): number {
    return this.shaderData.getFloat(GridMaterial._axisIntensityProperty);
  }

  set axisIntensity(value: number) {
    this.shaderData.setFloat(GridMaterial._axisIntensityProperty, value);
  }

  /**
   * 2D-3D flip progress.
   */
  get flipProgress(): number {
    return this.shaderData.getFloat(GridMaterial._flipProgressProperty);
  }

  set flipProgress(value: number) {
    this.shaderData.setFloat(GridMaterial._flipProgressProperty, MathUtil.clamp(value, 0, 1));
  }

  /**
   * fade parameter.
   */
  get fade(): number {
    return this.shaderData.getFloat(GridMaterial._fadeProperty);
  }

  set fade(value: number) {
    this.shaderData.setFloat(GridMaterial._fadeProperty, MathUtil.clamp(value, 0, 1));
  }

  constructor(engine: Engine) {
    super(engine, Shader.find("grid"));
    this.isTransparent = true;

    const shaderData = this.shaderData;
    shaderData.setFloat(GridMaterial._nearClipProperty, 0.1);
    shaderData.setFloat(GridMaterial._farClipProperty, 100);
    shaderData.setFloat(GridMaterial._primaryScaleProperty, 10);
    shaderData.setFloat(GridMaterial._secondaryScaleProperty, 1);
    shaderData.setFloat(GridMaterial._gridIntensityProperty, 0.2);
    shaderData.setFloat(GridMaterial._axisIntensityProperty, 0.1);
    shaderData.setFloat(GridMaterial._flipProgressProperty, 0.0);
    shaderData.setFloat(GridMaterial._fadeProperty, 0.0);
  }
}
