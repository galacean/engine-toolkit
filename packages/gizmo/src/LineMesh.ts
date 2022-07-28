import {
    BufferMesh,
    VertexElement,
    VertexElementFormat,
    MeshTopology,
    Buffer,
    Engine,
    BufferUsage,
    BufferBindFlag,
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