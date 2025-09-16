import { BaseMaterial, Engine, MathUtil, Shader, ShaderProperty } from "@galacean/engine";

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

Shader.create(
  "grid",
  `
#include <common>

attribute vec4 POSITION_FLIP;

uniform mat4 camera_ViewInvMat;
uniform mat4 camera_ProjMat;

varying vec3 nearPoint;
varying vec3 farPoint;


vec3 UnprojectPoint(float x, float y, float z, mat4 viewInvMat, mat4 projInvMat) {
    vec4 unprojectedPoint =  viewInvMat * projInvMat * vec4(x, y, z, 1.0);
    return unprojectedPoint.xyz / unprojectedPoint.w;
}


void main() {
    float tol = 0.0001;
    mat4 viewInvMat = camera_ViewInvMat;
    if (abs(viewInvMat[3][1]) < tol) {
        viewInvMat[3][1] = tol;
    }
    mat4 projInvMat = INVERSE_MAT(camera_ProjMat);

    bool flipY = camera_ProjectionParams.x < 0.0;
    float x = flipY? POSITION_FLIP.z : POSITION_FLIP.x;
    float y = flipY? POSITION_FLIP.w : POSITION_FLIP.y;

    nearPoint = UnprojectPoint(x, y, -1.0, viewInvMat, projInvMat);// unprojecting on the near plane
    farPoint = UnprojectPoint(x, y, 1.0, viewInvMat, projInvMat);// unprojecting on the far plane
    gl_Position = vec4(x, y, 0.0, 1.0);// using directly the clipped coordinates
}`,

  `
#include <common>
#include <transform_declare>

uniform float u_far;
uniform float u_near;
uniform float u_primaryScale;
uniform float u_secondaryScale;
uniform float u_gridIntensity;
uniform float u_axisIntensity;
uniform float u_flipProgress;
uniform float u_fade;

varying vec3 nearPoint;
varying vec3 farPoint;
  
vec4 grid(vec3 fragPos3D, float scale, float fade) {
    vec2 coord = mix(fragPos3D.xz, fragPos3D.xy, u_flipProgress) * scale;
    vec2 derivative = fwidth(coord);
    vec2 grid = abs(fract(coord - 0.5) - 0.5) / derivative;
    float line = min(grid.x, grid.y);
    float minimumz = min(derivative.y, 1.0);
    float minimumx = min(derivative.x, 1.0);
    vec4 color = vec4(u_gridIntensity, u_gridIntensity, u_gridIntensity, fade * (1.0 - min(line, 1.0)));
    // z-axis
    if (fragPos3D.x > -u_axisIntensity * minimumx && fragPos3D.x < u_axisIntensity * minimumx)
        color.z = 1.0;
    // x-axis or y-axis
    float xy = mix(fragPos3D.z, fragPos3D.y, u_flipProgress);
    if (xy > -u_axisIntensity * minimumz && xy < u_axisIntensity * minimumz)
        color.x = 1.0;
    return color;
}

float computeDepth(vec3 pos) {
    vec4 clip_space_pos = camera_ProjMat * camera_ViewMat * vec4(pos.xyz, 1.0);
    // map to 0-1
    return (clip_space_pos.z / clip_space_pos.w) * 0.5 + 0.5;
}

float computeLinearDepth(vec3 pos) {
    vec4 clip_space_pos = camera_ProjMat * camera_ViewMat * vec4(pos.xyz, 1.0);
    float clip_space_depth = clip_space_pos.z / clip_space_pos.w;
    float linearDepth = (2.0 * u_near * u_far) / (u_far + u_near - clip_space_depth * (u_far - u_near));
    return linearDepth / u_far;// normalize
}

void main() {
    float ty = -nearPoint.y / (farPoint.y - nearPoint.y);
    float tz = -nearPoint.z / (farPoint.z - nearPoint.z);
    float t = mix(ty, tz, u_flipProgress);
    vec3 fragPos3D = nearPoint + t * (farPoint - nearPoint);

    gl_FragDepth = computeDepth(fragPos3D);

    float linearDepth = computeLinearDepth(fragPos3D);
    float fading = max(0.0, (0.5 - linearDepth));

    // adding multiple resolution for the grid
    gl_FragColor = (grid(fragPos3D, u_primaryScale, u_fade) + grid(fragPos3D, u_secondaryScale, 1.0 - u_fade));
    gl_FragColor.a *= fading;

    gl_FragColor = sRGBToLinear(gl_FragColor);

}
`
);
