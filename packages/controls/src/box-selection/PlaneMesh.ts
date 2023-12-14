import { Engine, ModelMesh, Vector3 } from "@galacean/engine";

export class PlaneMesh {
  static createPlane(engine: Engine): ModelMesh {
    const mesh = new ModelMesh(engine);
    PlaneMesh._initGeometryData(mesh);
    return mesh;
  }

  static _initGeometryData(mesh: ModelMesh) {
    const positions = new Array<Vector3>(4);
    positions[0] = new Vector3(-1, -1, 0);
    positions[1] = new Vector3(1, -1, 0);
    positions[2] = new Vector3(1, 1, 0);
    positions[3] = new Vector3(-1, 1, 0);

    const indices = new Uint8Array(6);
    indices[0] = 0;
    indices[1] = 1;
    indices[2] = 2;
    indices[3] = 0;
    indices[4] = 2;
    indices[5] = 3;

    mesh.setPositions(positions);
    mesh.setIndices(indices);
    mesh.uploadData(true);
    mesh.addSubMesh(0, 6);
    return mesh;
  }
}
