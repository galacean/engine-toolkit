import {
  BlendFactor,
  Color,
  CompareFunction,
  Material,
  RenderQueueType,
  Shader,
  ShaderPass,
  ShaderProperty,
  StencilOperation,
  Vector3
} from "@galacean/engine";

export class PlanarShadowShaderFactory {
  private static _lightDirProp = ShaderProperty.getByName("u_lightDir");
  private static _planarHeightProp = ShaderProperty.getByName("u_planarHeight");
  private static _shadowColorProp = ShaderProperty.getByName("u_planarShadowColor");
  private static _shadowFalloffProp = ShaderProperty.getByName("u_planarShadowFalloff");

  /**
   * Replace material Shader and initialization.
   * @param material - Material to replace and initialization.
   */
  static replaceShader(material: Material) {
    material.shader = Shader.find("planarShadowShader");

    const shadowRenderState = material.renderStates[1];
    shadowRenderState.renderQueueType = RenderQueueType.Transparent;
    shadowRenderState.depthState.writeEnabled = false;

    const targetBlendState = shadowRenderState.blendState.targetBlendState;
    targetBlendState.enabled = true;
    targetBlendState.sourceColorBlendFactor = BlendFactor.SourceAlpha;
    targetBlendState.destinationColorBlendFactor = BlendFactor.OneMinusSourceAlpha;
    targetBlendState.sourceAlphaBlendFactor = BlendFactor.One;
    targetBlendState.destinationAlphaBlendFactor = BlendFactor.OneMinusSourceAlpha;

    // set shadow pass stencilState
    const stencilState = shadowRenderState.stencilState;
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

    const shaderData = material.shaderData;
    shaderData.setFloat(PlanarShadowShaderFactory._shadowFalloffProp, 0);
    shaderData.setColor(PlanarShadowShaderFactory._shadowColorProp, new Color(1.0, 1.0, 1.0, 1.0));
    shaderData.setVector3(PlanarShadowShaderFactory._lightDirProp, new Vector3(0, 0, 0));
    shaderData.setFloat(PlanarShadowShaderFactory._planarHeightProp, 0);
  }

  /**
   * Set planar height.
   */
  static setPlanarHeight(material: Material, value: number) {
    material.shaderData.setFloat(PlanarShadowShaderFactory._planarHeightProp, value);
  }

  /**
   * Set light direction.
   */
  static setLightDirection(material: Material, value: Vector3) {
    const lightDir = material.shaderData.getVector3(PlanarShadowShaderFactory._lightDirProp);
    if (value !== lightDir) {
      lightDir.copyFrom(value.normalize());
    } else {
      value.normalize();
    }
  }

  /**
   * Set shadow color
   */
  static setShadowColor(material: Material, value: Color) {
    const shadowColor = material.shaderData.getColor(PlanarShadowShaderFactory._shadowColorProp);
    if (value !== shadowColor) {
      shadowColor.copyFrom(value);
    }
  }

  /**
   * Set Shadow falloff coefficient
   */
  static setShadowFalloff(material: Material, value: number) {
    material.shaderData.setFloat(PlanarShadowShaderFactory._shadowFalloffProp, value);
  }
}

const planarShadowPassSource = `
Pass "PlanarShadow" {
  VertexShader = vert;
  FragmentShader = frag;

  vec3 u_lightDir;
  float u_planarHeight;
  vec4 u_planarShadowColor;
  float u_planarShadowFalloff;

  mat4 renderer_ModelMat;
  mat4 camera_VPMat;

  struct Attributes {
    vec4 POSITION;
    #ifdef RENDERER_HAS_SKIN
      vec4 JOINTS_0;
      vec4 WEIGHTS_0;
    #endif
  };

  struct Varyings {
    vec4 color;
  };

  #ifdef RENDERER_HAS_SKIN
    #ifdef RENDERER_USE_JOINT_TEXTURE
      sampler2D renderer_JointSampler;
      float renderer_JointCount;
      mat4 getJointMatrix(sampler2D smp, float index) {
        float base = index / renderer_JointCount;
        float hf = 0.5 / renderer_JointCount;
        float v = base + hf;

        vec4 m0 = texture2D(smp, vec2(0.125, v ));
        vec4 m1 = texture2D(smp, vec2(0.375, v ));
        vec4 m2 = texture2D(smp, vec2(0.625, v ));
        vec4 m3 = texture2D(smp, vec2(0.875, v ));

        return mat4(m0, m1, m2, m3);
      }
    #else
      mat4 renderer_JointMatrix[ RENDERER_JOINTS_NUM ];
    #endif
  #endif

  vec3 ShadowProjectPos(vec4 vertPos) {
    vec3 shadowPos;

    vec3 worldPos = (renderer_ModelMat * vertPos).xyz;

    shadowPos.y = min(worldPos.y, u_planarHeight);
    shadowPos.xz = worldPos.xz - u_lightDir.xz * max(0.0, worldPos.y - u_planarHeight) / u_lightDir.y;

    return shadowPos;
  }

  Varyings vert(Attributes attr) {
    Varyings v;
    vec4 position = vec4(attr.POSITION.xyz, 1.0);
    #ifdef RENDERER_HAS_SKIN
      #ifdef RENDERER_USE_JOINT_TEXTURE
        mat4 skinMatrix =
          attr.WEIGHTS_0.x * getJointMatrix(renderer_JointSampler, attr.JOINTS_0.x) +
          attr.WEIGHTS_0.y * getJointMatrix(renderer_JointSampler, attr.JOINTS_0.y) +
          attr.WEIGHTS_0.z * getJointMatrix(renderer_JointSampler, attr.JOINTS_0.z) +
          attr.WEIGHTS_0.w * getJointMatrix(renderer_JointSampler, attr.JOINTS_0.w);
      #else
        mat4 skinMatrix =
          attr.WEIGHTS_0.x * renderer_JointMatrix[ int( attr.JOINTS_0.x ) ] +
          attr.WEIGHTS_0.y * renderer_JointMatrix[ int( attr.JOINTS_0.y ) ] +
          attr.WEIGHTS_0.z * renderer_JointMatrix[ int( attr.JOINTS_0.z ) ] +
          attr.WEIGHTS_0.w * renderer_JointMatrix[ int( attr.JOINTS_0.w ) ];
      #endif
      position = skinMatrix * position;
    #endif

    vec3 shadowPos = ShadowProjectPos(position);

    gl_Position = camera_VPMat * vec4(shadowPos, 1.0);

    vec3 center = vec3(renderer_ModelMat[3].x, u_planarHeight, renderer_ModelMat[3].z);
    float falloff = 0.5 - clamp(distance(shadowPos, center) * u_planarShadowFalloff, 0.0, 1.0);

    v.color = u_planarShadowColor;
    v.color.a *= falloff;
    return v;
  }

  void frag(Varyings v) {
    gl_FragColor = v.color;
  }
}
`;

const planarShadow = new ShaderPass(planarShadowPassSource);

if (!Shader.find("planarShadowShader")) {
  Shader.create("planarShadowShader", [Shader.find("pbr").subShaders[0].passes[0], planarShadow]);
}
