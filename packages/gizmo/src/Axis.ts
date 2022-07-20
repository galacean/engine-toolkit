import { Vector4, Component, Entity, MeshRenderer, Layer, Material, RenderQueueType } from "oasis-engine";
import { AxisProps } from "./Type";
import { utils } from "./Utils";
export class Axis extends Component {
  private material: Material;
  private color: Vector4;
  public constructor(entity: Entity) {
    super(entity);
  }

  public initAxis(value: AxisProps) {
    this.material = value.axisMaterial;
    this.material.renderQueueType = RenderQueueType.Transparent;
    this.color = value.axisMaterial.shaderData._properties[74];
    // setup visible axis
    for (let i = 0; i < value.axisMesh.length; i++) {
      const axisEntity = this.entity.createChild(value.name);
      axisEntity.transform.rotate(value.axisRotation[i]);
      axisEntity.transform.translate(value.axisTranslation[i], false);
      const axisRenderer = axisEntity.addComponent(MeshRenderer);
      axisRenderer.priority = 100;
      axisRenderer.mesh = value.axisMesh[i];
      axisRenderer.setMaterial(this.material);
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

  public highLight() {
    this.material?.shaderData.setFloat("u_highLight", 0.2);
  }

  public unLight() {
    this.material?.shaderData.setFloat("u_highLight", 0.0);
  }

  public yellow() {
    this.material?.shaderData.setVector4("u_color", new Vector4(1.0, 0.95, 0.0, 1.0));
  }

  public gray() {
    this.material?.shaderData.setVector4("u_color", new Vector4(0.75, 0.75, 0.75, 0.6));
  }

  public recover() {
    this.material?.shaderData.setVector4("u_color", this.color);
  }
}
