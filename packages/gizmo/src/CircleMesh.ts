import { Vector3, Buffer, BufferMesh, Quaternion, Engine, BufferBindFlag, BufferUsage, VertexElement, VertexElementFormat, IndexFormat } from "oasis-engine";

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