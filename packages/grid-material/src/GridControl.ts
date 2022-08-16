import { Camera, Engine, ModelMesh, Script, Vector3, MeshRenderer, MathUtil } from "oasis-engine";
import { GridMaterial } from "./GridMaterial";

/**
 * Grid Control
 */
export class GridControl extends Script {
  private _camera: Camera;
  private _material: GridMaterial;
  private _progress = 0;
  private _is2DGrid = false;
  private _flipGrid = false;

  /**
   * Create Mesh with position in clipped space.
   * @param engine Engine
   */
  static createGridPlane(engine: Engine): ModelMesh {
    const positions: Vector3[] = new Array(6);
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

    const mesh = new ModelMesh(engine);
    mesh.setPositions(positions);
    mesh.setIndices(indices);
    mesh.uploadData(true);
    mesh.addSubMesh(0, 6);

    const { bounds } = mesh;
    bounds.min.set(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
    bounds.max.set(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
    return mesh;
  }

  /**
   * Flip speed
   */
  speed = 10.0;

  /**
   * Grid Material.
   */
  get material(): GridMaterial {
    return this._material;
  }

  /**
   * Is 2D Grid.
   */
  get is2DGrid(): boolean {
    return this._is2DGrid;
  }

  set is2DGrid(value: boolean) {
    this._is2DGrid = value;
    this._progress = 0;
    this._flipGrid = true;
  }

  /**
   * @override
   */
  onAwake() {
    const { engine: engine, entity: entity } = this;
    this._camera = entity.getComponent(Camera);

    const gridRenderer = entity.addComponent(MeshRenderer);
    gridRenderer.mesh = GridControl.createGridPlane(engine);
    this._material = new GridMaterial(engine);
    gridRenderer.setMaterial(this._material);
  }

  /**
   * @override
   */
  onUpdate(deltaTime: number) {
    const { _material: material, _camera: camera } = this;
    material.nearClipPlane = camera.nearClipPlane;
    material.farClipPlane = camera.farClipPlane;

    if (this._flipGrid) {
      this._progress += deltaTime / 1000;
      let percent = MathUtil.clamp(this._progress * this.speed, 0, 1);
      if (percent >= 1) {
        this._flipGrid = false;
      }

      if (!this._is2DGrid) {
        percent = 1 - percent;
      }
      material.flipProgress = percent;
    }
  }
}
