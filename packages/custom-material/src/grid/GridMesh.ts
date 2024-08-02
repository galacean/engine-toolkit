import {
  Buffer,
  BufferBindFlag,
  BufferUsage,
  ContentRestorer,
  Engine,
  MeshTopology,
  ModelMesh,
  VertexElement,
  VertexElementFormat
} from "@galacean/engine";

export class GridMesh {
  static createGridPlane(engine: Engine): ModelMesh {
    const mesh = new ModelMesh(engine);
    GridMesh._updateGridData(mesh);
    engine.resourceManager.addContentRestorer(new GridMeshRestorer(mesh));
    return mesh;
  }

  static _updateGridData(mesh: ModelMesh) {
    // No-FlipY: POSITION_FLIP.xy, FlipY: POSITION_FLIP.zw
    // prettier-ignore
    const vertices = new Float32Array([
      -1, -1, 1, -1, // left-bottom
      1, -1, -1, -1,  // right-bottom
      -1, 1, 1, 1,  // left-top
      1, 1, -1, 1]); // right-top

    mesh.setVertexElements([new VertexElement("POSITION_FLIP", 0, VertexElementFormat.Vector4, 0)]);
    mesh.setVertexBufferBinding(new Buffer(mesh.engine, BufferBindFlag.VertexBuffer, vertices, BufferUsage.Static), 16);
    mesh.addSubMesh(0, 4, MeshTopology.TriangleStrip);

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
