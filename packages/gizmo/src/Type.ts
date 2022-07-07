import { Component, Entity, Ray, Vector3, Mesh, Material } from "oasis-engine";

export abstract class GizmoComponent extends Component {
  /**
   * Called when select entity.
   * @param entityArr - The selected entity array. Could be empty.
   */
  onSelected?(entity: Entity): void;
  onHoverStart?(axis: string): void;
  onHoverEnd?(): void;
  onMoveStart?(ray: Ray, axis: string) {}
  onMoveEnd?() {}
  onMove?(ray: Ray) {}
}

export const axisNormal: { [key: string]: Vector3 } = {
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
