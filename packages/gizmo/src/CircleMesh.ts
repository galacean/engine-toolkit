import { Vector3, Quaternion, Engine, ModelMesh, MeshTopology } from "oasis-engine";

interface CircleMeshOptions {
  center?: Vector3;
  normal?: Vector3;
  segments?: number;
  startPoint?: Vector3;
  thetaLength?: number;
}

export class CircleMesh {
  public modelMesh: ModelMesh;

  private center = new Vector3();
  private normal = new Vector3(0, 0, 1);
  private startPoint = new Vector3(1.6, 0, 0);
  private thetaLength: number = Math.PI / 2;
  private vertices: Array<Vector3> = [];
  private indices: Array<number> = [];
  private static _tempVect: Vector3 = new Vector3();
  private static _tempQuat: Quaternion = new Quaternion();
  /**
   * @param options
   */
  public constructor(options: CircleMeshOptions, engine: Engine) {
    this.modelMesh = new ModelMesh(engine);
    this.update(options);
  }

  public update(options: CircleMeshOptions) {
    if (options.center) {
      this.center = options.center.clone();
    }
    if (options.normal) {
      this.normal = options.normal.clone();
    }
    if (options.startPoint) {
      this.startPoint = options.startPoint.clone();
    }
    this.thetaLength = options.thetaLength ?? this.thetaLength;
    // 16 segments for every 180 degree
    const newSegments = Math.abs(Math.ceil((16 * this.thetaLength) / Math.PI));
    const segments = Math.max(6, newSegments);

    this.indices = [];
    this.vertices = [];

    // indices
    for (let i = 1; i <= segments; i++) {
      const start = (i - 1) * 3;
      this.indices[start] = i;
      this.indices[start + 1] = i + 1;
      this.indices[start + 2] = 0;
    }
    // vertices
    this.vertices.push(this.center);
    for (let s = 0; s <= segments; s++) {
      const segment = (s / segments) * this.thetaLength;
      Quaternion.rotationAxisAngle(this.normal, segment, CircleMesh._tempQuat);
      Vector3.transformByQuat(this.startPoint, CircleMesh._tempQuat, CircleMesh._tempVect);
      this.vertices[s + 1] = CircleMesh._tempVect.clone();
    }
    this.modelMesh.setPositions(this.vertices);
    this.modelMesh.setIndices(Uint16Array.from(this.indices));
    this.modelMesh.clearSubMesh();
    this.modelMesh.addSubMesh(0, this.indices.length, MeshTopology.Triangles);
    this.modelMesh.uploadData(false);
  }
}
