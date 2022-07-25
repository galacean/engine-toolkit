import { Component, Entity, Ray, Vector3, Mesh, Material, Camera } from "oasis-engine";

export abstract class GizmoComponent extends Component {
  /** the visible gizmo entity */
  gizmoEntity: Entity;
  /** the invisible gizmo entity  */
  gizmoHelperEntity: Entity;

  /**
   * Get scene camera when init gizmo.
   * @param camera - The scene camera.
   */
  initCamera?(camera: Camera): void;
  /**
   * Called when an entity is selected.
   * @param entity - The selected entity.
   */
  onSelected?(entity: Entity): void;
  /**
   * Called when pointer enters gizmo.
   * @param axisName - The gizmo axis name.
   */
  onHoverStart?(axisName: string): void;
  /**
   * Called when pointer leaves gizmo.
   */
  onHoverEnd?(): void;
  /**
   * Called when gizmo starts to move.
   * @param ray - ray from the clicked pointer in screen.
   * @param axisName - The gizmo axis name.
   */
  onMoveStart?(ray: Ray, axisName: string): void;
  /**
   * Called when gizmo is moving.
   * @param ray - ray from the dragging pointer in screen.
   */
  onMove?(ray: Ray): void;
  /**
   * Called when gizmo movement ends.
   */
  onMoveEnd?(): void;
  /**
   * Called when gizmo orientation changes.
   * @param isGlobal - global: true, local: false.
   */
  toggleOrientation?(isGlobal: boolean): void;
}

export const axisVector: { [key: string]: Vector3 } = {
  x: new Vector3(1, 0, 0),
  y: new Vector3(0, 1, 0),
  z: new Vector3(0, 0, 1),
  xy: new Vector3(1, 1, 0),
  yz: new Vector3(0, 1, 1),
  xz: new Vector3(1, 0, 1),
  xyz: new Vector3(1, 1, 1)
};

export const axisIndices: { [key: string]: Array<string> } = {
  x: ["x"],
  y: ["y"],
  z: ["z"],
  xy: ["x", "y"],
  xz: ["x", "z"],
  yz: ["y", "z"],
  xyz: ["x", "y", "z"]
};

export interface AxisProps {
  name: string;
  axisMesh: Array<Mesh>;
  axisMaterial: Material;
  axisHelperMesh: Array<Mesh>;
  axisRotation: Array<Vector3> | null;
  axisTranslation: Array<Vector3> | null;
}
