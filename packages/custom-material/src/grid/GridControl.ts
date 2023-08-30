import { Camera, Script, MeshRenderer, MathUtil } from "@galacean/engine";
import { GridMaterial } from "./GridMaterial";
import { GridMesh } from "./GridMesh";

/**
 * Grid Control
 */
export class GridControl extends Script {
  private _material: GridMaterial;
  private _progress: number = 0;
  private _is2DGrid: boolean = false;
  private _flipGrid: boolean = false;

  /**
   * Flip speed
   */
  speed = 10.0;

  /**
   * Camera
   */
  camera: Camera = null;

  /**
   * target distance
   */
  distance: number = 8;

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

  override onAwake() {
    const { engine, entity } = this;

    const gridRenderer = entity.addComponent(MeshRenderer);
    gridRenderer.receiveShadows = false;
    gridRenderer.castShadows = false;
    gridRenderer.mesh = GridMesh.createGridPlane(engine);
    this._material = new GridMaterial(engine);
    gridRenderer.setMaterial(this._material);
  }

  override onUpdate(deltaTime: number) {
    const { _material: material, camera } = this;
    if (camera === null) return;

    material.nearClipPlane = camera.nearClipPlane;
    material.farClipPlane = camera.farClipPlane;

    const logDistance = Math.log2(this.distance);
    const upperDistance = Math.pow(2, Math.floor(logDistance) + 1);
    const lowerDistance = Math.pow(2, Math.floor(logDistance));
    material.fade = (this.distance - lowerDistance) / (upperDistance - lowerDistance);

    const level = -Math.floor(logDistance);
    material.primaryScale = Math.pow(2, level);
    material.secondaryScale = Math.pow(2, level + 1);
    material.axisIntensity = 0.3 / material.primaryScale;

    if (this._flipGrid) {
      this._progress += deltaTime;
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
