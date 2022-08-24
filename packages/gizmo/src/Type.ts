import { Component, Entity, Ray, Vector3, Mesh, Material, Camera, Plane } from "oasis-engine";

export abstract class GizmoComponent extends Component {
  gizmoEntity: Entity;
  gizmoHelperEntity: Entity;

  // Get scene camera when init gizmo.
  initCamera?(camera: Camera): void;
  // Called when an entity is selected.
  onSelected?(entity: Entity | any): void;
  // Called when pointer enters gizmo.
  onHoverStart?(axisName: string): void;
  // Called when pointer leaves gizmo.
  onHoverEnd?(): void;
  // Called when gizmo starts to move.
  onMoveStart?(ray: Ray, axisName: string): void;
  // Called when gizmo is moving.
  onMove?(ray: Ray): void;
  // Called when gizmo movement ends.
  onMoveEnd?(): void;
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

export const axisPlane: { [key: string]: Plane } = {
  x: new Plane(new Vector3(1, 0, 0), 0),
  y: new Plane(new Vector3(0, 1, 0), 0),
  z: new Plane(new Vector3(0, 0, 1), 0),
  xy: new Plane(new Vector3(0, 0, 1), 0),
  yz: new Plane(new Vector3(1, 0, 0), 0),
  xz: new Plane(new Vector3(0, 1, 0), 0)
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
