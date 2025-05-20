import { Entity, Script } from "@galacean/engine";

export class SphereScript extends Script {
  private _xEntity: Entity;
  private _yEntity: Entity;
  private _zEntity: Entity;
  private _roundEntity: Entity;

  override onAwake() {
    const gizmoEntity = this.entity.parent;
    const directionEntity = gizmoEntity.findByName("direction");
    this._roundEntity = this.entity.findByName("round");
    const endEntity = directionEntity.findByName("end");

    this._xEntity = endEntity.findByName("-x").findByName("back");
    this._yEntity = endEntity.findByName("-y").findByName("back");
    this._zEntity = endEntity.findByName("-z").findByName("back");
  }

  override onPointerEnter() {
    this._roundEntity.isActive = true;
    this._xEntity.isActive = true;
    this._yEntity.isActive = true;
    this._zEntity.isActive = true;
  }

  override onPointerExit() {
    this._roundEntity.isActive = false;
    this._xEntity.isActive = false;
    this._yEntity.isActive = false;
    this._zEntity.isActive = false;
  }
}
