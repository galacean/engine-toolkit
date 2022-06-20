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
export class PlanarShadow extends BaseMaterial {
  private static _lightDirProp = Shader.getPropertyByName("u_lightDir");
  private static _planarHeightProp = Shader.getPropertyByName("u_planarHeight");
  private static _shadowColorProp = Shader.getPropertyByName("u_planarShadowColor");
  private static _shadowFalloffProp = Shader.getPropertyByName("u_planarShadowFalloff");

  /**
   * Planar height
   */
  get planarHeight(): number {
    return this.shaderData.getFloat(PlanarShadow._planarHeightProp);
  }

  set planarHeight(value: number) {
    this.shaderData.setFloat(PlanarShadow._planarHeightProp, value);
  }

  /**
   * Light direction
   */
  get LightDir(): Vector3 {
    return this.shaderData.getVector3(PlanarShadow._lightDirProp);
  }

  set LightDir(value: Vector3) {
    const lightDir = this.shaderData.getVector3(PlanarShadow._lightDirProp);
    if (value !== lightDir) {
      value.normalize().cloneTo(lightDir);
    } else {
      value.normalize();
    }
  }

  /**
   * Shadow color
   */
  get shadowColor(): Color {
    return this.shaderData.getColor(PlanarShadow._shadowColorProp);
  }

  set shadowColor(value: Color) {
    const shadowColor = this.shaderData.getColor(PlanarShadow._shadowColorProp);
    if (value !== shadowColor) {
      value.cloneTo(shadowColor);
    }
  }

  /**
   * Shadow falloff coefficient
   */
  get shadowFalloff(): number {
    return this.shaderData.getFloat(PlanarShadow._shadowFalloffProp);
  }

  set shadowFalloff(value: number) {
    this.shaderData.setFloat(PlanarShadow._shadowFalloffProp, value);
  }

  constructor(engine: Engine) {
    super(engine, Shader.find("planar-shadow"));

    this.isTransparent = true;
    this.renderState.stencilState.enabled = true;
    this.renderState.stencilState.referenceValue = 0;
    this.renderState.stencilState.compareFunctionFront = CompareFunction.Equal;
    this.renderState.stencilState.compareFunctionBack = CompareFunction.Equal;
    this.renderState.stencilState.failOperationFront = StencilOperation.Keep;
    this.renderState.stencilState.failOperationBack = StencilOperation.Keep;
    this.renderState.stencilState.zFailOperationFront = StencilOperation.Keep;
    this.renderState.stencilState.zFailOperationBack = StencilOperation.Keep;
    this.renderState.stencilState.passOperationFront = StencilOperation.IncrementWrap;
    this.renderState.stencilState.passOperationBack = StencilOperation.IncrementWrap;
    this.renderState.blendState.targetBlendState.sourceAlphaBlendFactor = BlendFactor.OneMinusSourceAlpha;
    this.renderState.blendState.targetBlendState.destinationAlphaBlendFactor = BlendFactor.One;

    const shaderData = this.shaderData;
    shaderData.setFloat(PlanarShadow._shadowFalloffProp, 0);
    shaderData.setColor(PlanarShadow._shadowColorProp, new Color(1.0, 1.0, 1.0, 1.0));
    shaderData.setVector3(PlanarShadow._lightDirProp, new Vector3(0, 0, 0));
    shaderData.setFloat(PlanarShadow._planarHeightProp, 0);
  }
}

Shader.create(
  "planar-shadow",
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

      //得到顶点的世界空间坐标
      vec3 worldPos = (u_modelMat * vertPos).xyz;
      
      //阴影的世界空间坐标（低于地面的部分不做改变）
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

      //得到阴影的世界空间坐标
      vec3 shadowPos = ShadowProjectPos(position);

      //转换到裁切空间
      gl_Position = u_VPMat * vec4(shadowPos, 1.0);

      //得到中心点世界坐标
      vec3 center = vec3(u_modelMat[3].x, u_planarHeight, u_modelMat[3].z);
      //计算阴影衰减
      float falloff = 0.5 - clamp(distance(shadowPos , center) * u_planarShadowFalloff, 0.0, 1.0);

      //阴影颜色
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
