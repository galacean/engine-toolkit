import {
  BaseMaterial,
  BlendFactor,
  Color,
  CompareFunction,
  Engine,
  Shader,
  StencilOperation,
  Vector3
} from "oasis-engine";

/**
 * Planar Shadow
 */
export class PlanarShadowMaterial extends BaseMaterial {
  private static _lightDirProp = Shader.getPropertyByName("u_lightDir");
  private static _planarHeightProp = Shader.getPropertyByName("u_planarHeight");
  private static _shadowColorProp = Shader.getPropertyByName("u_planarShadowColor");
  private static _shadowFalloffProp = Shader.getPropertyByName("u_planarShadowFalloff");

  /**
   * Planar height
   */
  get planarHeight(): number {
    return this.shaderData.getFloat(PlanarShadowMaterial._planarHeightProp);
  }

  set planarHeight(value: number) {
    this.shaderData.setFloat(PlanarShadowMaterial._planarHeightProp, value);
  }

  /**
   * Light direction
   */
  get lightDirection(): Vector3 {
    return this.shaderData.getVector3(PlanarShadowMaterial._lightDirProp);
  }

  set lightDirection(value: Vector3) {
    const lightDir = this.shaderData.getVector3(PlanarShadowMaterial._lightDirProp);
    if (value !== lightDir) {
      lightDir.copyFrom(value.normalize());
    } else {
      value.normalize();
    }
  }

  /**
   * Shadow color
   */
  get shadowColor(): Color {
    return this.shaderData.getColor(PlanarShadowMaterial._shadowColorProp);
  }

  set shadowColor(value: Color) {
    const shadowColor = this.shaderData.getColor(PlanarShadowMaterial._shadowColorProp);
    if (value !== shadowColor) {
      shadowColor.copyFrom(value);
    }
  }

  /**
   * Shadow falloff coefficient
   */
  get shadowFalloff(): number {
    return this.shaderData.getFloat(PlanarShadowMaterial._shadowFalloffProp);
  }

  set shadowFalloff(value: number) {
    this.shaderData.setFloat(PlanarShadowMaterial._shadowFalloffProp, value);
  }

  constructor(engine: Engine) {
    super(engine, Shader.find("planar-shadow-material"));

    this.isTransparent = true;
    const {
      stencilState,
      blendState: { targetBlendState }
    } = this.renderState;
    stencilState.enabled = true;
    stencilState.referenceValue = 0;
    stencilState.compareFunctionFront = CompareFunction.Equal;
    stencilState.compareFunctionBack = CompareFunction.Equal;
    stencilState.failOperationFront = StencilOperation.Keep;
    stencilState.failOperationBack = StencilOperation.Keep;
    stencilState.zFailOperationFront = StencilOperation.Keep;
    stencilState.zFailOperationBack = StencilOperation.Keep;
    stencilState.passOperationFront = StencilOperation.IncrementWrap;
    stencilState.passOperationBack = StencilOperation.IncrementWrap;
    targetBlendState.sourceAlphaBlendFactor = BlendFactor.OneMinusSourceAlpha;
    targetBlendState.destinationAlphaBlendFactor = BlendFactor.One;

    const shaderData = this.shaderData;
    shaderData.setFloat(PlanarShadowMaterial._shadowFalloffProp, 0);
    shaderData.setColor(PlanarShadowMaterial._shadowColorProp, new Color(1.0, 1.0, 1.0, 1.0));
    shaderData.setVector3(PlanarShadowMaterial._lightDirProp, new Vector3(0, 0, 0));
    shaderData.setFloat(PlanarShadowMaterial._planarHeightProp, 0);
  }
}

Shader.create(
  "planar-shadow-material",
  `
    attribute vec4 POSITION;
    varying vec4 color;

    uniform vec3 u_lightDir;
    uniform float u_planarHeight;
    uniform vec4 u_planarShadowColor;
    uniform float u_planarShadowFalloff;

    uniform mat4 u_modelMat;
    uniform mat4 u_VPMat;

    #ifdef O3_HAS_SKIN
      attribute vec4 JOINTS_0;
      attribute vec4 WEIGHTS_0;

      #ifdef O3_USE_JOINT_TEXTURE
        uniform sampler2D u_jointSampler;
        uniform float u_jointCount;
        mat4 getJointMatrix(sampler2D smp, float index) {
            float base = index / u_jointCount;
            float hf = 0.5 / u_jointCount;
            float v = base + hf;

            vec4 m0 = texture2D(smp, vec2(0.125, v ));
            vec4 m1 = texture2D(smp, vec2(0.375, v ));
            vec4 m2 = texture2D(smp, vec2(0.625, v ));
            vec4 m3 = texture2D(smp, vec2(0.875, v ));

            return mat4(m0, m1, m2, m3);
        }
      #else
          uniform mat4 u_jointMatrix[ O3_JOINTS_NUM ];
      #endif
    #endif

    vec3 ShadowProjectPos(vec4 vertPos) {
      vec3 shadowPos;

      // get the world space coordinates of the vertex
      vec3 worldPos = (u_modelMat * vertPos).xyz;
      
      // world space coordinates of the shadow (the part below the ground is unchanged)
      shadowPos.y = min(worldPos.y , u_planarHeight);
      shadowPos.xz = worldPos.xz - u_lightDir.xz * max(0.0, worldPos.y - u_planarHeight) / u_lightDir.y;

      return shadowPos;
    }

    void main() {
     vec4 position = vec4(POSITION.xyz, 1.0 );
      #ifdef O3_HAS_SKIN
          #ifdef O3_USE_JOINT_TEXTURE
              mat4 skinMatrix =
                  WEIGHTS_0.x * getJointMatrix(u_jointSampler, JOINTS_0.x ) +
                  WEIGHTS_0.y * getJointMatrix(u_jointSampler, JOINTS_0.y ) +
                  WEIGHTS_0.z * getJointMatrix(u_jointSampler, JOINTS_0.z ) +
                  WEIGHTS_0.w * getJointMatrix(u_jointSampler, JOINTS_0.w );
          #else
              mat4 skinMatrix =
                  WEIGHTS_0.x * u_jointMatrix[ int( JOINTS_0.x ) ] +
                  WEIGHTS_0.y * u_jointMatrix[ int( JOINTS_0.y ) ] +
                  WEIGHTS_0.z * u_jointMatrix[ int( JOINTS_0.z ) ] +
                  WEIGHTS_0.w * u_jointMatrix[ int( JOINTS_0.w ) ];
          #endif
          position = skinMatrix * position;
      #endif

      // get the shadow's world space coordinates
      vec3 shadowPos = ShadowProjectPos(position);

      // convert to clip space
      gl_Position = u_VPMat * vec4(shadowPos, 1.0);

      // get the world coordinates of the center point
      vec3 center = vec3(u_modelMat[3].x, u_planarHeight, u_modelMat[3].z);
      // calculate shadow falloff
      float falloff = 0.5 - clamp(distance(shadowPos , center) * u_planarShadowFalloff, 0.0, 1.0);

      // shadow color
      color = u_planarShadowColor;
      color.a *= falloff;
    }
    `,
  `
    varying vec4 color;
    void main() {
       gl_FragColor = color;
    }
    `
);
