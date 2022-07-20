import {
  BufferBindFlag,
  BufferMesh,
  BufferUsage,
  Color,
  MeshRenderer,
  Script,
  VertexElement,
  VertexElementFormat,
  Buffer,
  IndexFormat,
  Vector2
} from "oasis-engine";
import { LineMaterial } from "./material/LineMaterial";
import { LineCap, LineJoin } from "./constants";
import lineBuilder from "./vertexBuilder";

export class Line extends Script {
  protected _points: Vector2[] = [];
  protected _cap = LineCap.Butt;
  protected _join = LineJoin.Miter;
  protected _renderer: MeshRenderer;
  protected _material: LineMaterial;
  protected _mesh: BufferMesh;
  protected _needUpdate = false;
  protected _flattenPoints: number[] = [];

  /**
   * The points that make up the line.
   */
  get points() {
    return this._points;
  }

  set points(value: Vector2[]) {
    this._points = value;
    this._flattenPoints = this._points
      .map((point) => {
        return [point.x, point.y];
      })
      .flat();
    this._needUpdate = true;
  }

  /**
   * Determines the shape used to draw the end points of line.
   */
  get cap() {
    return this._cap;
  }

  set cap(value: LineCap) {
    if (value !== this._cap) {
      this._cap = value;
      this._material.cap = value;
      this._needUpdate = true;
    }
  }

  /**
   * Determines the shape used to join two line segments where they meet.
   */
  get join() {
    return this._join;
  }

  set join(value: LineJoin) {
    if (value !== this._join) {
      this._join = value;
      this._material.join = value;
      this._needUpdate = true;
    }
  }

  /**
   * The thickness of line.
   */
  get width() {
    return this._material.width;
  }

  set width(value) {
    this._material.width = value;
  }

  /**
   * The color of line.
   */
  get color() {
    return this._material.color;
  }

  set color(value) {
    this._material.color = value;
  }

  constructor(entity) {
    super(entity);
  }

  /**
   * @override
   */
  onAwake(): void {
    this._initRenderer();
    this._initMaterial();
  }

  /**
   * @override
   */
  onUpdate(): void {
    if (this._needUpdate) {
      this._render();
      this._needUpdate = false;
    }
  }

  /**
   * @override
   */
  onEnable(): void {
    this._renderer.enabled = true;
  }

  /**
   * @override
   */
  onDisable(): void {
    this._renderer.enabled = false;
  }

  /**
   * @override
   */
  onDestroy() {
    this._renderer.destroy();
  }

  protected async _generateData() {
    return await lineBuilder.solidLine(this._flattenPoints, this._join, this._cap, -1);
  }

  protected async _render() {
    const { vertices, indices } = await this._generateData();
    const vertexBuffer = new Buffer(this.engine, BufferBindFlag.VertexBuffer, vertices, BufferUsage.Static);
    const indexBuffer = new Buffer(this.engine, BufferBindFlag.IndexBuffer, indices, BufferUsage.Static);
    vertexBuffer.setData(vertices);
    indexBuffer.setData(indices);
    // Bind buffer
    this._mesh = new BufferMesh(this.engine, "LineGeometry");

    this._mesh.setVertexBufferBinding(vertexBuffer, 24);
    this._mesh.setIndexBufferBinding(indexBuffer, IndexFormat.UInt16);

    // Add vertexElement
    this._mesh.setVertexElements([
      new VertexElement("a_pos", 0, VertexElementFormat.Vector2, 0),
      new VertexElement("a_normal", 8, VertexElementFormat.Vector2, 0),
      new VertexElement("a_data", 16, VertexElementFormat.Short2, 0),
      new VertexElement("a_lengthsofar", 20, VertexElementFormat.Float, 0)
    ]);

    // Add one sub geometry.
    this._mesh.clearSubMesh();
    this._mesh.addSubMesh(0, indices.length);

    this._renderer.mesh = this._mesh;
  }

  protected _initMaterial() {
    const material = new LineMaterial(this.engine);
    material.color = new Color(0, 0, 0, 1);
    material.join = this._join;
    material.cap = this._cap;
    material.width = 0.1;
    this._material = material;
    this._renderer.setMaterial(this._material);
  }

  protected _initRenderer() {
    const renderer = this.entity.addComponent(MeshRenderer);
    this._renderer = renderer;
  }
}
