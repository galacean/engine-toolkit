import { BaseMaterial, Engine, ModelMesh, Shader, Vector3 } from "oasis-engine";

/**
 * Create Mesh with position in clipped space.
 * @param engine Engine
 */
export function createGridPlane(engine: Engine): ModelMesh {
  const positions: Vector3[] = new Array(6);
  positions[0] = new Vector3(1, 1, 0);
  positions[1] = new Vector3(-1, -1, 0);
  positions[2] = new Vector3(-1, 1, 0);
  positions[3] = new Vector3(-1, -1, 0);
  positions[4] = new Vector3(1, 1, 0);
  positions[5] = new Vector3(1, -1, 0);

  const mesh = new ModelMesh(engine);
  mesh.setPositions(positions);
  mesh.uploadData(true);
  mesh.addSubMesh(0, 6);
  return mesh;
}

/**
 * Grid Material.
 */
export class GridMaterial extends BaseMaterial {
  constructor(engine: Engine) {
    super(engine, Shader.find("grid"));
  }
}

Shader.create(
  "grid",
  `
  #include<common_vert>
  
varying vec3 nearPoint;
varying vec3 farPoint;

vec3 UnprojectPoint(float x, float y, float z, mat4 view, mat4 projection) {
    mat4 viewInv = inverse(view);
    mat4 projInv = inverse(projection);
    vec4 unprojectedPoint =  viewInv * projInv * vec4(x, y, z, 1.0);
    return unprojectedPoint.xyz / unprojectedPoint.w;
}

void main() {
    nearPoint = UnprojectPoint(POSITION.x, POSITION.y, 0.0, view_mat, proj_mat).xyz;// unprojecting on the near plane
    farPoint = UnprojectPoint(POSITION.x, POSITION.y, 1.0, view_mat, proj_mat).xyz;// unprojecting on the far plane
    gl_Position = vec4(p, 1.0);// using directly the clipped coordinates
}`,
  `
#include<common_frag>

varying vec3 nearPoint;
varying vec3 farPoint;
  
vec4 grid(vec3 fragPos3D, float scale, bool drawAxis) {
    vec2 coord = fragPos3D.xz * scale;
    vec2 derivative = fwidth(coord);
    vec2 grid = abs(fract(coord - 0.5) - 0.5) / derivative;
    float line = min(grid.x, grid.y);
    float minimumz = min(derivative.y, 1);
    float minimumx = min(derivative.x, 1);
    vec4 color = vec4(0.6, 0.6, 0.6, 1.0 - min(line, 1.0));
    // z axis
    if (fragPos3D.x > -1 * minimumx && fragPos3D.x < 1 * minimumx)
        color = vec4(0.0, 0.0, 1.0, 1.0);
    // x axis
    if (fragPos3D.z > -1 * minimumz && fragPos3D.z < 1 * minimumz)
        color = vec4(1.0, 0.0, 0.0, 1.0);
    return color;
}

float computeDepth(vec3 pos) {
    vec4 clip_space_pos = proj_mat * view_mat * vec4(pos.xyz, 1.0);
    return (clip_space_pos.z / clip_space_pos.w);
}

const float far = 50;
const float near = 0.01;

float computeLinearDepth(vec3 pos) {
    vec4 clip_space_pos = proj_mat * view_mat * vec4(pos.xyz, 1.0);
    float clip_space_depth = (clip_space_pos.z / clip_space_pos.w) * 2.0 - 1.0;// put back between -1 and 1
    float linearDepth = (2.0 * near * far) / (far + near - clip_space_depth * (far - near));// get linear value between 0.01 and 100
    return linearDepth / far;// normalize
}

void main() {
    float t = -nearPoint.y / (farPoint.y - nearPoint.y);
    vec3 fragPos3D = nearPoint + t * (farPoint - nearPoint);

    gl_FragDepth = computeDepth(fragPos3D);

    float linearDepth = computeLinearDepth(fragPos3D);
    float fading = max(0, (0.5 - linearDepth));

    outColor = grid(fragPos3D, 1, true) * float(t > 0);// adding multiple resolution for the grid
    outColor.a *= fading;
}
`
);
