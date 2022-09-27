import {
  Component,
  Entity,
  MeshRenderer,
  Color,
  UnlitMaterial,
} from "oasis-engine";
import { utils } from "./Utils";
import { AxisProps } from "./Type";
import { GizmoMaterial } from "./GizmoMaterial";
export class Axis extends Component {
  private _material: UnlitMaterial | GizmoMaterial;
  private _color: Color = new Color();
  private _highLightColor: Color = new Color();
  private _yellowColor: Color = new Color(1.0, 0.95, 0.0, 1.0);
  private _grayColor: Color = new Color(0.75, 0.75, 0.75, 0.6);

  constructor(entity: Entity) {
    super(entity);
  }

  /** setup axis geometry */
  initAxis(value: AxisProps) {
    this._material = value.axisMaterial;
    this._color.copyFrom(value.axisMaterial.baseColor);

    this._highLightColor.copyFrom(this._color);
    this._highLightColor.a = 0.7;

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
    this._material.baseColor.copyFrom(this._highLightColor);
  }
  /** unhighligh axis */
  unLight() {
    this._material.baseColor.copyFrom(this._color);
  }
  /** change axis color into yellow */
  yellow() {
    this._material.baseColor.copyFrom(this._yellowColor);
  }
  /** change axis color into gray */
  gray() {
    this._material.baseColor.copyFrom(this._grayColor);
  }
  /** recove axis color */
  recover() {
    this._material.baseColor.copyFrom(this._color);
  }
}
