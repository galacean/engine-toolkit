import { BaseMaterial, Engine, Shader } from "oasis-engine";

/**
 * Cascade ShadowMap Visual Material
 */
export class CSSMVisualMaterial extends BaseMaterial {
  protected static _farPlaneProp = Shader.getPropertyByName("u_farPlane");
  protected static _nearPlaneProp = Shader.getPropertyByName("u_nearPlane");

  /**
   * Near clip plane - the closest point to the camera when rendering occurs.
   */
  get nearClipPlane(): number {
    return this.shaderData.getFloat(CSSMVisualMaterial._nearPlaneProp);
  }

  set nearClipPlane(value: number) {
    this.shaderData.setFloat(CSSMVisualMaterial._nearPlaneProp, value);
  }

  /**
   * Far clip plane - the furthest point to the camera when rendering occurs.
   */
  get farClipPlane(): number {
    return this.shaderData.getFloat(CSSMVisualMaterial._farPlaneProp);
  }

  set farClipPlane(value: number) {
    this.shaderData.setFloat(CSSMVisualMaterial._farPlaneProp, value);
  }

  constructor(engine: Engine) {
    super(engine, Shader.find("shadow-map-visual"));
  }
}

Shader.create(
  "shadow-map-visual",
  `
#include <common>
#include <common_vert>
#include <blendShape_input>
#include <uv_share>
#include <color_share>
#include <normal_share>
#include <worldpos_share>
#include <shadow_share>

#include <fog_share>
#include <shadow_vert_share>

void main() {

    #include <begin_position_vert>
    #include <begin_normal_vert>
    #include <blendShape_vert>
    #include <skinning_vert>
    #include <uv_vert>
    #include <color_vert>
    #include <normal_vert>
    #include <worldpos_vert>
    #include <position_vert>

    #include <shadow_vert>

    #include <fog_vert>

}`,
  `
uniform vec4 u_cascade;
uniform sampler2D u_shadowMaps[O3_SHADOW_MAP_COUNT];

uniform float u_farPlane;
uniform float u_nearPlane;

varying vec3 view_pos;
varying vec2 v_uv;

float linearizeDepth(float depth) {
  return (2.0 * u_nearPlane) / (u_farPlane + u_nearPlane - depth * (u_farPlane - u_nearPlane));
}

void main() {
    // Get cascade index for the current fragment's view position
    int cascadeIndex = 0;
    for (int i = 0; i < 4 - 1; ++i) {
        if (view_pos.z < u_cascade[i]) {
            cascadeIndex = i + 1;
        }
    }

    float depth = texture2D(u_shadowMaps[0], v_uv).r;
    if (cascadeIndex == 0) {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    } else if (cascadeIndex == 1) {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    } else if (cascadeIndex == 2) {
        gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
    } else if (cascadeIndex == 3) {
        gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);
    } else {
        gl_FragColor = vec4(vec3(1.0-linearizeDepth(depth)), 1.0);
    }
}
`
);
