import { Engine, MeshTopology, ModelMesh, Vector3 } from "oasis-engine";

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