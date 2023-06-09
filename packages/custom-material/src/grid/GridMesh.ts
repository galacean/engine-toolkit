import { ContentRestorer, Engine, ModelMesh, Vector3 } from "@galacean/engine";

export class GridMesh {
  static createGridPlane(engine: Engine): ModelMesh {
    const mesh = new ModelMesh(engine);
    GridMesh._updateGridData(mesh);
    engine.resourceManager.addContentRestorer(new GridMeshRestorer(mesh));
    return mesh;
  }

  static _updateGridData(mesh: ModelMesh) {
    const positions = new Array<Vector3>(6);
    positions[0] = new Vector3(1, 1, 0);
    positions[1] = new Vector3(-1, -1, 0);
    positions[2] = new Vector3(-1, 1, 0);
    positions[3] = new Vector3(-1, -1, 0);
    positions[4] = new Vector3(1, 1, 0);
    positions[5] = new Vector3(1, -1, 0);

    const indices = new Uint8Array(6);
    indices[0] = 2;
    indices[1] = 1;
    indices[2] = 0;
    indices[3] = 5;
    indices[4] = 4;
    indices[5] = 3;

    mesh.setPositions(positions);
    mesh.setIndices(indices);
    mesh.uploadData(true);
    mesh.addSubMesh(0, 6);
    const { bounds } = mesh;
    bounds.min.set(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
    bounds.max.set(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
    return mesh;
  }
}

/**
 * @internal
 */
export class GridMeshRestorer extends ContentRestorer<ModelMesh> {
  constructor(resource: ModelMesh) {
    super(resource);
  }

  /**
   * @override
   */
  restoreContent(): void {
    GridMesh._updateGridData(this.resource);
  }
}
