import { Vector4, Component, Entity, MeshRenderer, Material, RenderQueueType, Color } from "oasis-engine";

import { AxisProps } from "./Type";
import { utils } from "./Utils";
export class Axis extends Component {
  private _material: Material;
  private _color: Color;

  constructor(entity: Entity) {
    super(entity);
  }

  /** setup axis geometry */
  initAxis(value: AxisProps) {
    this._material = value.axisMaterial;
    this._material.renderQueueType = RenderQueueType.Transparent;
    this._color = value.axisMaterial.shaderData.getColor("u_color");
    // setup visible axis
    for (let i = 0; i < value.axisMesh.length; i++) {
      const axisEntity = this.entity.createChild(value.name);
      axisEntity.transform.rotate(value.axisRotation[i]);
      axisEntity.transform.translate(value.axisTranslation[i], false);
      const axisRenderer = axisEntity.addComponent(MeshRenderer);
      axisRenderer.priority = value.priority ? value.priority : 100;
      axisRenderer.mesh = value.axisMesh[i];
      axisRenderer.setMaterial(this._material);
    }

    // setup invisible axis
    const gizmoHelperEntity = this.entity.parent.parent.findByName("invisible");
    for (let i = 0; i < value.axisHelperMesh.length; i++) {
      const temp = gizmoHelperEntity.createChild(value.name);
      const axisHelperEntity = temp.createChild(value.name);
      axisHelperEntity.transform.rotate(value.axisRotation[i]);
      axisHelperEntity.transform.translate(value.axisTranslation[i], false);
      const axisHelperRenderer = axisHelperEntity.addComponent(MeshRenderer);
      axisHelperRenderer.priority = 100;
      axisHelperRenderer.mesh = value.axisHelperMesh[i];
      axisHelperRenderer.setMaterial(utils.invisibleMaterial);
    }
  }
  /** highlight axis */
  highLight() {
    this._material?.shaderData.setFloat("u_highLight", 0.2);
  }
  /** unhighligh axis */
  unLight() {
    this._material?.shaderData.setFloat("u_highLight", 0.0);
  }
  /** change axis color into yellow */
  yellow() {
    this._material?.shaderData.setVector4("u_color", new Vector4(1.0, 0.95, 0.0, 1.0));
  }
  /** change axis color into gray */
  gray() {
    this._material?.shaderData.setVector4("u_color", new Vector4(0.75, 0.75, 0.75, 0.6));
  }
  /** recove axis color */
  recover() {
    // @ts-ignore
    this._material?.shaderData.setVector4("u_color", this._color);
  }
}
