import { Material, Shader, Color, RenderQueueType, Engine, BlendFactor, CullMode } from "oasis-engine";

const vertexSource = `
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

const fragmentSource = `
  uniform vec4 u_color;

  #ifdef POS_CUTOFF
  varying float v_Sub;
  #endif

  void main() {
    gl_FragColor = u_color;
    #ifdef POS_CUTOFF
    gl_FragColor.a = step(v_Sub, 0.0);
    #endif
  }
  `;

Shader.create("gizmo-shader", vertexSource, fragmentSource);

export class GizmoMaterial extends Material {
  private static _posCutoffMacro = Shader.getMacroByName("POS_CUTOFF");
  private _posCutOff = false;

  set baseColor(val: Color) {
    this.shaderData.setColor("u_color", val);
  }

  get baseColor() {
    return this.shaderData.getColor("u_color");
  }

  set posCutOff(value: boolean) {
    if (this._posCutOff !== value) {
      this._posCutOff = value;
      value
        ? this.shaderData.enableMacro(GizmoMaterial._posCutoffMacro)
        : this.shaderData.disableMacro(GizmoMaterial._posCutoffMacro);
    }
  }

  constructor(engine: Engine) {
    super(engine, Shader.find("gizmo-shader"));
    this.renderState[0].renderQueueType = RenderQueueType.Transparent;
    this.renderState.depthState.enabled = false;
    this.renderState.rasterState.cullMode = CullMode.Off;

    const target = this.renderState.blendState.targetBlendState;
    const depthState = this.renderState.depthState;
    target.enabled = true;
    target.sourceColorBlendFactor = target.sourceAlphaBlendFactor = BlendFactor.SourceAlpha;
    target.destinationColorBlendFactor = target.destinationAlphaBlendFactor = BlendFactor.OneMinusSourceAlpha;
    depthState.writeEnabled = false;

    this.shaderData.disableMacro(GizmoMaterial._posCutoffMacro);
  }
}
