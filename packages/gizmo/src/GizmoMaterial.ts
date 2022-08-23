import { BlendFactor, CullMode, Engine, Material, RenderQueueType, Shader, Vector4 } from "oasis-engine";

const defaultOptions = {
  color: new Vector4(1.0, 1.0, 1.0, 1.0),
  depthTest: true,
  blend: false,
  doubleSide: false
};

type Option = typeof defaultOptions;

const VERT_SHADER = `
uniform mat4 u_MVPMat;
uniform mat4 u_MVMat;
attribute vec3 POSITION;
#ifdef POS_CUTOFF
varying float v_Sub;
#endif

void main() {
  gl_Position = u_MVPMat * vec4(POSITION, 1.0);
  #ifdef POS_CUTOFF
  v_Sub = gl_Position.w + u_MVMat[3][2];
  #endif
}
`;

const FRAG_SHADER = `
uniform vec4 u_color;
uniform float u_highLight;
#ifdef POS_CUTOFF
varying float v_Sub;
#endif
void main() {
  gl_FragColor = u_color + u_highLight;
  #ifdef POS_CUTOFF
  gl_FragColor.a = step(v_Sub, 0.0);
  #endif
}
`;
export class GizmoMaterial extends Material {
  private static _posCutoffMacro = Shader.getMacroByName("POS_CUTOFF");

  constructor(engine: Engine, options: Partial<Option> = {}) {
    const newOptions = { ...defaultOptions, ...options };
    let shader = Shader.find("gizmo-shader");
    if (!shader) {
      shader = Shader.create("gizmo-shader", VERT_SHADER, FRAG_SHADER);
    }
    super(engine, shader);
    this.shaderData.setVector4("u_color", newOptions.color);
    this.shaderData.setFloat("u_highLight", 0);
    this.renderQueueType = RenderQueueType.Transparent;

    if (newOptions.doubleSide) {
      this.renderState.rasterState.cullMode = CullMode.Off;
    }

    if (!newOptions.depthTest) {
      this.renderState.depthState.enabled = false;
    }

    if (newOptions.blend) {
      const target = this.renderState.blendState.targetBlendState;
      const depthState = this.renderState.depthState;

      target.enabled = true;
      target.sourceColorBlendFactor = target.sourceAlphaBlendFactor = BlendFactor.SourceAlpha;
      target.destinationColorBlendFactor = target.destinationAlphaBlendFactor = BlendFactor.OneMinusSourceAlpha;
      depthState.writeEnabled = false;
      this.renderQueueType = RenderQueueType.Transparent;
    }

    this.shaderData.disableMacro(GizmoMaterial._posCutoffMacro);
  }

  private _posCutOff = false;
  public set posCutOff(value: boolean) {
    if (this._posCutOff !== value) {
      this._posCutOff = value;
      if (value) {
        this.shaderData.enableMacro(GizmoMaterial._posCutoffMacro);
      } else {
        this.shaderData.disableMacro(GizmoMaterial._posCutoffMacro);
      }
    }
  }
}
