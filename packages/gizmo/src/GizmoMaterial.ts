import {
  Material,
  Shader,
  Color,
  RenderQueueType,
  Engine,
  BlendFactor,
  CullMode,
  ShaderMacro,
} from "oasis-engine";

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

export class ArcMaterial extends Material {
  private static _posCutoffMacro = ShaderMacro.getByName("POS_CUTOFF");
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
        ? this.shaderData.enableMacro(ArcMaterial._posCutoffMacro)
        : this.shaderData.disableMacro(ArcMaterial._posCutoffMacro);
    }
  }

  constructor(engine: Engine) {
    super(engine, Shader.find("gizmo-shader"));
    this.renderState.renderQueueType = RenderQueueType.Transparent;
    this.renderState.depthState.enabled = false;
    this.renderState.rasterState.cullMode = CullMode.Off;

    const target = this.renderState.blendState.targetBlendState;
    const depthState = this.renderState.depthState;
    target.enabled = true;
    target.sourceColorBlendFactor = target.sourceAlphaBlendFactor =
      BlendFactor.SourceAlpha;
    target.destinationColorBlendFactor = target.destinationAlphaBlendFactor =
      BlendFactor.OneMinusSourceAlpha;
    depthState.writeEnabled = false;

    this.shaderData.disableMacro(ArcMaterial._posCutoffMacro);
  }
}
const vert = `
uniform mat4 u_view_matrix;
uniform mat4 u_projection_matrix;

void main() {
  vec4 world_pos = u_model_matrix * vec4(gl_Vertex.xyz, 1.0);
  vec4 view_pos = u_view_matrix * world_pos;
  vec4 clip_pos = u_projection_matrix * view_pos;
  
  gl_Position = clip_pos;
  gl_PointSize = 1.0;
  
  vec3 cam_pos = vec3(u_view_matrix[3]);
  vec3 dir = cam_pos - world_pos.xyz;
  vec3 right = vec3(u_view_matrix[0]);
  vec3 up = vec3(u_view_matrix[1]);
  
  vec3 normal = normalize(cross(right, up));
  vec3 binormal = normalize(cross(normal, right));
  
  vec3 screen_pos = vec3(clip_pos.xy, clip_pos.z / clip_pos.w);
  vec3 offset = screen_pos.x * right + screen_pos.y * up;
  
  vec3 final_pos = world_pos.xyz + (offset.x * binormal + offset.y * normal) * length(dir);
  
  gl_Position = u_projection_matrix * u_view_matrix * vec4(final_pos, 1.0);
}
`;

const frag = `
uniform vec4 u_color;
void main() {
  gl_FragColor = u_color;
}
`;

Shader.create("gizmo-circle", vert, frag);

export class CircleMaterial extends Material {
  set baseColor(val: Color) {
    this.shaderData.setColor("u_color", val);
  }

  get baseColor() {
    return this.shaderData.getColor("u_color");
  }

  constructor(engine: Engine) {
    super(engine, Shader.find("gizmo-circle"));
    this.renderState.renderQueueType = RenderQueueType.Transparent;
    this.renderState.depthState.enabled = false;
    this.renderState.rasterState.cullMode = CullMode.Off;
  }
}
