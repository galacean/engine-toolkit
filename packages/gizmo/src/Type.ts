import { Component, Entity, Ray, Vector3, Mesh, Camera, Plane } from "oasis-engine";
import { UnlitMaterial } from "oasis-engine/types";
import { GizmoState } from "./enums/GizmoState";
import { GizmoMaterial } from "./GizmoMaterial";
import { Group } from "./Group";

/**
 * @internal
 * Gizmo Component
 */
export abstract class GizmoComponent extends Component {
  /** gizmo state */
  type: GizmoState;
  /** gizmo entity, visible part */
  gizmoEntity: Entity;
  /** gizmo entity, invisible part */
  gizmoHelperEntity: Entity;
  /** Get group when init gizmo. */
  abstract init(camera: Camera, group: Group): void;
  /** Called when pointer enters gizmo. */
  abstract onHoverStart(axisName: string): void;
  /** Called when pointer leaves gizmo. */
  abstract onHoverEnd(): void;
  /** Called when gizmo starts to move.*/
  abstract onMoveStart(ray: Ray, axisName: string): void;
  /** Called when gizmo is moving.*/
  abstract onMove(ray: Ray): void;
  /** Called when gizmo movement ends.*/
  abstract onMoveEnd(): void;
  /** Called when gizmo's transform is dirty.*/
  abstract onGizmoRedraw(): void;
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
export interface AxisProps {
  name: string;
  axisMesh: Array<Mesh>;
  axisMaterial: UnlitMaterial | GizmoMaterial;
  axisHelperMesh: Array<Mesh>;
  axisRotation: Array<Vector3> | null;
  axisTranslation: Array<Vector3> | null;
  priority?: number;
}
