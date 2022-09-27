import { Engine, MeshTopology, ModelMesh, Quaternion, Vector3 } from "oasis-engine";

export class GizmoMesh {
  private static _tempQuat: Quaternion = new Quaternion();
  private static _tempVect: Vector3 = new Vector3();

  static createCircle(
    engine: Engine,
    center: Vector3 = new Vector3(),
    normal: Vector3 = new Vector3(0, 0, 1),
    startPoint: Vector3 = new Vector3(1.6, 0, 0),
    thetaLength: number = Math.PI / 2
  ): ModelMesh {
    const mesh = new ModelMesh(engine);
    GizmoMesh.updateCircle(mesh, startPoint, normal, thetaLength, center);
    return mesh;
  }

  static updateCircle(
    mesh: ModelMesh,
    startPoint: Vector3 = new Vector3(1.6, 0, 0),
    normal: Vector3 = new Vector3(0, 0, 1),
    thetaLength: number = Math.PI / 2,
    center: Vector3 = new Vector3(),
    /**
     * segments per half Pi
     */
    segmentFactor: number = 16
  ) {
    const newSegments = Math.abs(Math.ceil((segmentFactor * thetaLength) / Math.PI));
    const segments = Math.max(6, newSegments);

    const indices: Uint16Array = new Uint16Array(segments * 3);
    const vertices: Array<Vector3> = [];

    // indices
    for (let i = 1; i <= segments; i++) {
      const start = (i - 1) * 3;
      indices[start] = i;
      indices[start + 1] = i + 1;
      indices[start + 2] = 0;
    }

    // vertices
    vertices.push(center);
    for (let s = 0; s <= segments; s++) {
      const segment = (s / segments) * thetaLength;
      Quaternion.rotationAxisAngle(normal, segment, GizmoMesh._tempQuat);
      Vector3.transformByQuat(startPoint, GizmoMesh._tempQuat, GizmoMesh._tempVect);
      vertices[s + 1] = GizmoMesh._tempVect.clone();
    }

    GizmoMesh._initialize(mesh, vertices, indices, MeshTopology.Triangles);
  }

  static createArc(engine: Engine, arc: number = 180, radius: number = 1.6, radialSegments: number = 48): ModelMesh {
    const mesh = new ModelMesh(engine);
    GizmoMesh.updateArc(mesh, arc, radius, radialSegments);
    return mesh;
  }

  static updateArc(mesh: ModelMesh, arc: number = Math.PI, radius: number = 1.6, radialSegments: number = 48) {
    const vertices: Array<Vector3> = [];
    const indices: Uint8Array = new Uint8Array(2 * radialSegments);

    for (let i = 0; i <= radialSegments; i++) {
      const theta = (arc * 2) / radialSegments;
      vertices.push(new Vector3(radius * Math.cos(i * theta), radius * Math.sin(i * theta), 0));
    }

    for (let i = 0; i < 2 * radialSegments; i++) {
      let start = 0;
      if (i % 2 === 0) {
        start = i / 2;
      } else {
        start = (i + 1) / 2;
      }
      indices[i] = start;
    }

    GizmoMesh._initialize(mesh, vertices, indices, MeshTopology.Lines);
  }

  static createLine(engine: Engine, points: Array<Vector3>): ModelMesh {
    const mesh = new ModelMesh(engine);
    GizmoMesh.updateLine(mesh, points);
    return mesh;
  }

  static updateLine(mesh: ModelMesh, points: Array<Vector3>) {
    const vertices: Array<Vector3> = points;
    const indices: Uint8Array = new Uint8Array(vertices.length);

    for (let i = 0; i < vertices.length; i++) {
      indices[i] = i;
    }

    GizmoMesh._initialize(mesh, vertices, indices, MeshTopology.Lines);
  }

  private static _initialize(
    mesh: ModelMesh,
    vertices: Array<Vector3>,
    indices: Uint16Array | Uint8Array,
    meshTopology: MeshTopology
  ) {
    mesh.setPositions(vertices);
    mesh.setIndices(indices);

    mesh.clearSubMesh();

    mesh.uploadData(false);
    mesh.addSubMesh(0, indices.length, meshTopology);
  }
}
