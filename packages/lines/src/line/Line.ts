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

/**
 * Solid Line.
 */
export class Line extends Script {
  protected _points: Vector2[] = [];
  protected _cap = LineCap.Butt;
  protected _join = LineJoin.Miter;
  protected _renderer: MeshRenderer;
  protected _material: LineMaterial;
  protected _flattenPoints: number[] = [];
  private _width: number = 0.1;
  private _color: Color = new Color(0, 0, 0, 1);
  private _mesh: BufferMesh;
  private _needUpdate = false;

  /**
   * The points that make up the line.
   */
  get points(): Vector2[] {
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
  get cap(): LineCap {
    return this._cap;
  }

  set cap(value: LineCap) {
    if (value !== this._cap) {
      this._cap = value;
      this._renderer?.shaderData.setInt("u_cap", value);
      this._needUpdate = true;
    }
  }

  /**
   * Determines the shape used to join two line segments where they meet.
   */
  get join(): LineJoin {
    return this._join;
  }

  set join(value: LineJoin) {
    if (value !== this._join) {
      this._join = value;
      this._renderer?.shaderData.setInt("u_join", value);
      this._needUpdate = true;
    }
  }

  /**
   * The thickness of line.
   */
  get width(): number {
    return this._width;
  }

  set width(value) {
    this._width = value;
    this._renderer.shaderData.setFloat("u_width", value);
  }

  /**
   * The color of line.
   */
  get color(): Color {
    return this._color;
  }

  set color(value: Color) {
    this._color = value;
    this._renderer.shaderData.setColor("u_color", value);
  }

  constructor(entity) {
    super(entity);
  }

  /**
   * @internal
   */
  onAwake(): void {
    this._renderer = this.entity.addComponent(MeshRenderer);
    this.color = this._color;
    this.join = this._join;
    this.cap = this._cap;
    this.width = this._width;
    this._initMaterial();

    this._mesh = new BufferMesh(this.engine, "LineGeometry");
    // Add vertexElement
    this._mesh.setVertexElements([
      new VertexElement("a_pos", 0, VertexElementFormat.Vector2, 0),
      new VertexElement("a_normal", 8, VertexElementFormat.Vector2, 0),
      new VertexElement("a_data", 16, VertexElementFormat.Short2, 0),
      new VertexElement("a_lengthsofar", 20, VertexElementFormat.Float, 0)
    ]);

    this._renderer.mesh = this._mesh;
  }

  /**
   * @internal
   */
  onUpdate(): void {
    if (this._needUpdate) {
      this._render();
      this._needUpdate = false;
    }
  }

  /**
   * @internal
   */
  onEnable(): void {
    this._renderer.enabled = true;
  }

  /**
   * @internal
   */
  onDisable(): void {
    this._renderer.enabled = false;
  }

  /**
   * @internal
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

    // destroy old buffer
    if (this._mesh) {
      this._mesh.vertexBufferBindings.forEach((binding) => {
        binding?.buffer?.destroy();
      });
      this._mesh.indexBufferBinding?.buffer?.destroy();
    }

    this._mesh.setVertexBufferBinding(vertexBuffer, 24, 0);
    this._mesh.setIndexBufferBinding(indexBuffer, IndexFormat.UInt16);

    this._mesh.clearSubMesh();
    this._mesh.addSubMesh(0, indices.length);

    // @ts-ignore
    this._mesh._enableVAO = false;
  }

  protected _initMaterial() {
    const material = new LineMaterial(this.engine);
    this._material = material;
    this._renderer.setMaterial(this._material);
  }
}
