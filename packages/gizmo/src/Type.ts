import { Component, Entity, Ray, Vector3, Mesh, Camera, Plane, ModelMesh } from "oasis-engine";
import { UnlitMaterial } from "oasis-engine/types";
import { State } from "./enums/GizmoState";
import { Group } from "./Group";

/**
 * @internal
 * Gizmo Component
 */
export abstract class GizmoComponent extends Component {
  /** gizmo state */
  type: State;
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
  abstract onUpdate(isModified: boolean): void;
}

export enum axisType {
  "x" = 0,
  "y" = 1,
  "z" = 2,
  "xy" = 3,
  "yz" = 4,
  "xz" = 5,
  "xyz" = 6
}

export const axisVector = [
  new Vector3(1, 0, 0),
  new Vector3(0, 1, 0),
  new Vector3(0, 0, 1),
  new Vector3(1, 1, 0),
  new Vector3(0, 1, 1),
  new Vector3(1, 0, 1),
  new Vector3(1, 1, 1)
];

export const axisPlane = [
  new Plane(new Vector3(1, 0, 0), 0),
  new Plane(new Vector3(0, 1, 0), 0),
  new Plane(new Vector3(0, 0, 1), 0),
  new Plane(new Vector3(0, 0, 1), 0),
  new Plane(new Vector3(1, 0, 0), 0),
  new Plane(new Vector3(0, 1, 0), 0)
];

export interface AxisProps {
  name: string;
  axisMesh: Array<ModelMesh>;
  axisMaterial: UnlitMaterial;
  axisHelperMesh: Array<Mesh>;
  axisHelperMaterial: UnlitMaterial;
  axisRotation: Array<Vector3>;
  axisTranslation: Array<Vector3>;
  priority?: number;
}
