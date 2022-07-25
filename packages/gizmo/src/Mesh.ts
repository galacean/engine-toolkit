import {
  BufferMesh,
  VertexElement,
  VertexElementFormat,
  MeshTopology,
  Buffer,
  Engine,
  BufferUsage,
  BufferBindFlag,
  ModelMesh,
  Vector3,
  IndexFormat,
  Quaternion
} from "oasis-engine";
export class LinesMesh extends BufferMesh {
  private readonly vertexBuffer: Buffer;
  public constructor(engine: Engine, props: { points: number[][]; count: number }) {
    super(engine);

    const { points } = props;

    this.setVertexElements([new VertexElement("POSITION", 0, VertexElementFormat.Vector3, 0)]);

    const vertices = Float32Array.from(points.flat());
    const vertexBuffer = new Buffer(engine, BufferBindFlag.VertexBuffer, vertices, BufferUsage.Static);
    this.vertexBuffer = vertexBuffer;
    this.setVertexBufferBinding(vertexBuffer, 12);
    this.addSubMesh(0, vertices.length / 3, MeshTopology.Lines);
  }

  public update(points: number[][]) {
    const floatArray = Float32Array.from(points.flat());
    this.vertexBuffer.setData(floatArray);
  }
}
export class ArcLineMesh extends ModelMesh {
  private radialSegments: number;
  private radius: number;
  private arc: number;
  private positions: Array<Vector3> = [];
  private indices: Array<number> = [];

  public constructor(engine: Engine, props: { radius: number; radialSegments: number; arc: number }) {
    super(engine);

    const { radius, radialSegments, arc } = props;

    this.radius = radius;
    this.radialSegments = radialSegments;
    this.arc = arc;

    for (let i = 0; i <= radialSegments; i++) {
      const theta = (arc / radialSegments / 180) * Math.PI;
      this.positions.push(new Vector3(radius * Math.cos(i * theta), radius * Math.sin(i * theta), 0));
    }

    for (let i = 0; i < 2 * radialSegments; i++) {
      let start = 0;
      if (i % 2 === 0) {
        start = i / 2;
      } else {
        start = (i + 1) / 2;
      }
      this.indices[i] = start;
    }
    this.setPositions(this.positions);
    this.setIndices(Uint8Array.from(this.indices));

    this.addSubMesh(0, this.indices.length, MeshTopology.Lines);
    this.uploadData(false);
  }

  public update(arc: number) {
    this.arc = arc;
    this.positions = [];
    for (let i = 0; i <= this.radialSegments; i++) {
      const theta = (this.arc / this.radialSegments / 180) * Math.PI;
      this.positions.push(new Vector3(this.radius * Math.cos(i * theta), this.radius * Math.sin(i * theta), 0));
    }

    this.setPositions(this.positions);
    this.uploadData(false);
  }
}

interface CircleMeshOptions {
  center?: Vector3;
  normal?: Vector3;
  segments?: number;
  startPoint?: Vector3;
  thetaLength?: number;
}

export class CircleMesh extends BufferMesh {
  private static _tempQuat: Quaternion = new Quaternion();
  private static _tempVector3: Vector3 = new Vector3();

  private center = new Vector3();
  private segments = 48;
  private normal = new Vector3(0, 0, 1);
  private startPoint = new Vector3(1.6, 0, 0);
  private thetaLength: number = Math.PI * 2;
  private vertexBuffer: Buffer;
  private indexBuffer: Buffer;
  private vertices: Float32Array;

  /**
   * @param options
   */
  public constructor(options: CircleMeshOptions, engine: Engine) {
    super(engine, "name");

    const vertexStride = 12;
    this.vertices = new Float32Array((this.segments + 2) * 3);
    this.vertexBuffer = new Buffer(
      engine,
      BufferBindFlag.VertexBuffer,
      (this.segments + 2) * vertexStride,
      BufferUsage.Dynamic
    );

    this.setVertexElements([new VertexElement("POSITION", 0, VertexElementFormat.Vector3, 0)]);
    const segments = this.segments;
    const indices = new Uint8Array(segments * 3);
    for (let i = 1; i <= segments; i++) {
      const start = (i - 1) * 3;
      indices[start] = i;
      indices[start + 1] = i + 1;
      indices[start + 2] = 0;
    }

    this.indexBuffer = new Buffer(engine, BufferBindFlag.IndexBuffer, indices);

    this.setIndexBufferBinding(this.indexBuffer, IndexFormat.UInt8);
    this.setVertexBufferBinding(this.vertexBuffer, vertexStride);
    this.addSubMesh(0, indices.length);
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

    const vertices = this.vertices;
    // center point
    this.center.copyToArray(vertices, 0);

    const segments = this.segments;
    for (let s = 0; s <= segments; s++) {
      const segment = (s / segments) * this.thetaLength;
      Quaternion.rotationAxisAngle(this.normal, segment, CircleMesh._tempQuat);
      Vector3.transformByQuat(this.startPoint, CircleMesh._tempQuat, CircleMesh._tempVector3);
      CircleMesh._tempVector3.copyToArray(vertices, 3 * s + 3);
    }

    this.vertexBuffer.setData(vertices);
  }
}
