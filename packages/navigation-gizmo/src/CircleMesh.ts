import {
  Vector3,
  Quaternion,
  Engine,
  ModelMesh,
  MeshTopology,
} from "oasis-engine";

interface CircleMeshOptions {
  center?: Vector3;
  normal?: Vector3;
  radius?: number;
  segments?: number;
}

export class CircleMesh {
  public modelMesh: ModelMesh;

  private center = new Vector3();
  private normal = new Vector3(0, 0, 1);
  private startPoint = new Vector3(1, 0, 0);
  private segments: number = 48;
  private radius: number = 1;
  private vertices: Array<Vector3> = [];
  private indices: Array<number> = [];
  private static _tempVect: Vector3 = new Vector3();
  private static _tempQuat: Quaternion = new Quaternion();
  /**
   * @param options
   */
  public constructor(engine: Engine, options?: CircleMeshOptions) {
    this.modelMesh = new ModelMesh(engine);

    if (options?.center) {
      this.center = options.center.clone();
    }
    if (options?.normal) {
      this.normal = options.normal.clone();
    }

    if (options?.radius) {
      this.radius = options.radius;
    }
    if (options?.segments) {
      this.segments = options.segments;
    }

    this.indices = [];
    this.vertices = [];
    this.startPoint.scale(this.radius);

    // indices
    for (let i = 1; i <= this.segments; i++) {
      const start = (i - 1) * 3;
      this.indices[start] = i;
      this.indices[start + 1] = i + 1;
      this.indices[start + 2] = 0;
    }
    // vertices
    this.vertices.push(this.center);
    for (let s = 0; s <= this.segments; s++) {
      const segment = (s / this.segments) * Math.PI * 2;
      Quaternion.rotationAxisAngle(this.normal, segment, CircleMesh._tempQuat);
      Vector3.transformByQuat(
        this.startPoint,
        CircleMesh._tempQuat,
        CircleMesh._tempVect
      );
      this.vertices[s + 1] = CircleMesh._tempVect.clone();
    }
    this.modelMesh.setPositions(this.vertices);
    this.modelMesh.setIndices(Uint16Array.from(this.indices));
    this.modelMesh.clearSubMesh();
    this.modelMesh.addSubMesh(0, this.indices.length, MeshTopology.Triangles);
    this.modelMesh.uploadData(false);
  }
}
