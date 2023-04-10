import {
  Vector3,
  Quaternion,
  Engine,
  ModelMesh,
  MeshTopology,
} "@galacean/engine";

/**
 * create a circle mesh
 * @param engine - Engine
 * @param radius - Circle radius
 * @param segments - Number of segments
 * @param center - Circle center
 * @param normal - Circle direction
 * @returns Circle model mesh
 */
export function createCircleMesh(
  engine: Engine,
  radius: number = 1,
  segments: number = 48,
  center: Vector3 = new Vector3(0, 0, 0),
  normal: Vector3 = new Vector3(0, 0, 1)
): ModelMesh {
  const mesh = new ModelMesh(engine);

  const indices = new Uint16Array(segments * 3);
  const vertices: Array<Vector3> = [];
  const startPoint = new Vector3(1, 0, 0).scale(radius);

  const tempQuat = new Quaternion();
  const tempVect = new Vector3();

  for (let i = 1; i <= segments; i++) {
    const start = (i - 1) * 3;
    indices[start] = i;
    indices[start + 1] = i + 1;
    indices[start + 2] = 0;
  }

  vertices.push(center);

  for (let s = 0; s <= segments; s++) {
    const segment = (s / segments) * Math.PI * 2;
    Quaternion.rotationAxisAngle(normal, segment, tempQuat);
    Vector3.transformByQuat(startPoint, tempQuat, tempVect);
    vertices[s + 1] = tempVect.clone();
  }

  mesh.setPositions(vertices);
  mesh.setIndices(indices);

  mesh.addSubMesh(0, indices.length, MeshTopology.Triangles);
  mesh.uploadData(false);
  return mesh;
}
