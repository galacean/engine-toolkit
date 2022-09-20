import { BlendFactor, Engine, Material, RenderQueueType, Shader, Vector4 } from "oasis-engine";

const VERT_SHADER = `
uniform mat4 u_MVPMat;

attribute vec3 POSITION;

void main() {
  gl_Position = u_MVPMat * vec4(POSITION, 1.0);
}
`;

const FRAG_SHADER = `
uniform vec4 u_color;
uniform float u_highLight;

void main() {
  gl_FragColor = u_color + u_highLight;
}
`;

Shader.create("navigation-gizmo-shader", VERT_SHADER, FRAG_SHADER);

export function createMeshMaterial(
  engine: Engine,
  color: Vector4 = new Vector4(1.0, 1.0, 1.0, 1.0),
  depthTest: boolean = true,
  blend: boolean = false
) {
  const material = new Material(engine, Shader.find("navigation-gizmo-shader"));
  material.shaderData.setVector4("u_color", color);
  material.renderState[0].renderQueueType = RenderQueueType.Transparent;

  if (!depthTest) {
    material.renderState.depthState.enabled = depthTest;
  }

  if (blend) {
    const target = material.renderState.blendState.targetBlendState;
    const depthState = material.renderState.depthState;

    target.enabled = true;
    target.sourceColorBlendFactor = target.sourceAlphaBlendFactor = BlendFactor.SourceAlpha;
    target.destinationColorBlendFactor = target.destinationAlphaBlendFactor = BlendFactor.OneMinusSourceAlpha;
    depthState.writeEnabled = false;
    material.renderState[0].renderQueueType = RenderQueueType.Transparent;
  }
  return material;
}
