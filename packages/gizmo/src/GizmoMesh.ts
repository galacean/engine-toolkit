import { Engine, MeshTopology, ModelMesh, Quaternion, Vector2, Vector3 } from "@galacean/engine";

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

  static createCircleTube(
    engine: Engine,
    arc: number = Math.PI,
    radius: number = 1.6,
    tubeRadius: number = 0.02,
    tubularSegments: number = 48,
    radialSegments: number = 6
  ): ModelMesh {
    const mesh = new ModelMesh(engine);
    GizmoMesh.updateCircleTube(mesh, arc, radius, tubeRadius, tubularSegments, radialSegments);
    return mesh;
  }

  static updateCircleTube(
    mesh: ModelMesh,
    arc: number = Math.PI,
    radius: number = 1.6,
    tubeRadius: number = 0.02,
    tubularSegments: number = 48,
    radialSegments: number = 6
  ) {
    const vertexCount = (radialSegments + 1) * (tubularSegments + 1);
    const rectangleCount = radialSegments * tubularSegments;
    const indices: Uint16Array = new Uint16Array(rectangleCount * 6);

    const vertices: Vector3[] = new Array(vertexCount);
    const normals: Vector3[] = new Array(vertexCount);
    const uvs: Vector2[] = new Array(vertexCount);

    let offset = 0;

    for (let i = 0; i <= radialSegments; i++) {
      for (let j = 0; j <= tubularSegments; j++) {
        const u = (j / tubularSegments) * arc;
        const v = (i / radialSegments) * Math.PI * 2;
        const cosV = Math.cos(v);
        const sinV = Math.sin(v);
        const cosU = Math.cos(u);
        const sinU = Math.sin(u);

        const position = new Vector3(
          (radius + tubeRadius * cosV) * cosU,
          (radius + tubeRadius * cosV) * sinU,
          tubeRadius * sinV
        );
        vertices[offset] = position;

        const centerX = radius * cosU;
        const centerY = radius * sinU;
        normals[offset] = new Vector3(position.x - centerX, position.y - centerY, position.z).normalize();

        uvs[offset++] = new Vector2(j / tubularSegments, i / radialSegments);
      }
    }

    offset = 0;
    for (let i = 1; i <= radialSegments; i++) {
      for (let j = 1; j <= tubularSegments; j++) {
        const a = (tubularSegments + 1) * i + j - 1;
        const b = (tubularSegments + 1) * (i - 1) + j - 1;
        const c = (tubularSegments + 1) * (i - 1) + j;
        const d = (tubularSegments + 1) * i + j;

        indices[offset++] = a;
        indices[offset++] = b;
        indices[offset++] = d;

        indices[offset++] = b;
        indices[offset++] = c;
        indices[offset++] = d;
      }
    }

    const { bounds } = mesh;
    const outerRadius = radius + tubeRadius;
    bounds.min.set(-outerRadius, -outerRadius, -tubeRadius);
    bounds.max.set(outerRadius, outerRadius, tubeRadius);

    GizmoMesh._initialize(mesh, vertices, indices, MeshTopology.Triangles, normals, uvs);
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
    meshTopology: MeshTopology,
    normals?: Array<Vector3>,
    uvs?: Array<Vector2>
  ) {
    mesh.setPositions(vertices);
    mesh.setIndices(indices);

    normals && mesh.setNormals(normals);
    uvs && mesh.setUVs(uvs);

    mesh.clearSubMesh();

    mesh.uploadData(false);
    mesh.addSubMesh(0, indices.length, meshTopology);
  }
}
