import { Component, Entity, MeshRenderer, Color, UnlitMaterial } from "@galacean/engine";
import { AxisProps } from "./Type";

export class Axis extends Component {
  private _material: UnlitMaterial;
  private _color: Color = new Color();
  private _highLightColor: Color = new Color();
  private _yellowColor: Color = new Color(1.0, 1.0, 0.0, 1.0);
  private _grayColor: Color = new Color(0.5225215539683921, 0.5225215539683921, 0.5225215539683921, 0);
  private _alpha: number = 1.0;

  constructor(entity: Entity) {
    super(entity);
  }

  /** setup axis geometry */
  initAxis(value: AxisProps): void {
    this._material = value.axisMaterial;
    this._color.copyFrom(value.axisMaterial.baseColor);
    this._alpha = this._color.a;

    this._highLightColor.copyFrom(this._color);
    this._highLightColor.r = this._highLightColor.r + 0.3;
    this._highLightColor.g = this._highLightColor.g + 0.3;
    this._highLightColor.b = this._highLightColor.b + 0.3;
    this._highLightColor.a = this._highLightColor.a + 0.1;

    // setup visible axis
    for (let i = 0; i < value.axisMesh.length; i++) {
      const axisEntity = this.entity.createChild(value.name);
      axisEntity.transform.rotate(value.axisRotation[i]);
      axisEntity.transform.translate(value.axisTranslation[i], false);
      const axisRenderer = axisEntity.addComponent(MeshRenderer);
      axisRenderer.receiveShadows = false;
      axisRenderer.castShadows = false;
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
      axisHelperRenderer.receiveShadows = false;
      axisHelperRenderer.castShadows = false;
      axisHelperRenderer.priority = value.priority ? value.priority : 100;
      axisHelperRenderer.mesh = value.axisHelperMesh[i];
      axisHelperRenderer.setMaterial(value.axisHelperMaterial);
    }
  }
  /** highlight axis */
  highLight(): void {
    this._material.baseColor.copyFrom(this._highLightColor);
    this._alpha = this._highLightColor.a;
  }
  /** unhighligh axis */
  unLight(): void {
    this._material.baseColor.copyFrom(this._color);
    this._alpha = this._color.a;
  }
  /** change axis color into yellow */
  yellow(): void {
    this._material.baseColor.copyFrom(this._yellowColor);
    this._alpha = this._yellowColor.a;
  }
  /** change axis color into gray */
  gray(): void {
    console.log('this._material.isTransparent', this._material.isTransparent)
    this._material.baseColor.copyFrom(this._grayColor);
    this._alpha = this._grayColor.a;
  }
  /** recover axis color */
  recover(): void {
    this._material.baseColor.copyFrom(this._color);
    this._alpha = this._color.a;
  }
  /** change axis alpha */
  alpha(v: number): void {
    this._material.baseColor.a = this._alpha * v;
  }
}
