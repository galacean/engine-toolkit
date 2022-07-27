import { Camera, Entity, Ray, Script, Vector2, Vector3 } from "oasis-engine";

import { ScaleControl } from "./Scale";
import { TranslateControl } from "./Translate";
import { RotateControl } from "./Rotate";
import { GizmoComponent } from "./Type";
import { utils } from "./Utils";
import { GizmoState } from "./enums/GizmoState";

/**
 * Gizmo controls, including translate, rotate, scale
 */
export class GizmoControls extends Script {
  gizmoState: GizmoState = GizmoState.translate;

  private _isStarted = false;
  private _isHovered = false;
  private _scaleFactor = 0.05773502691896257;
  private _gizmoMap: Record<string, { entity: Entity; component: GizmoComponent }> = {};
  private _entityTransformChangeFlag: any;
  private _editorCamera: Camera;
  private _selectedEntity: Entity;
  private _selectedAxisName: string;

  private _tempRay: Ray = new Ray();
  private _tempRay2: Ray = new Ray();

  constructor(entity: Entity) {
    super(entity);

    utils.init(this.engine);

    this._createGizmoControl(GizmoState.translate, TranslateControl);
    this._createGizmoControl(GizmoState.scale, ScaleControl);
    this._createGizmoControl(GizmoState.rotate, RotateControl);

    this.onGizmoChange(this.gizmoState);
  }

  /**
   * initial scene camera in gizmo
   * @param camera - The scene camera
   */
  initGizmoControl(camera: Camera) {
    this._editorCamera = camera;
    Object.values(this._gizmoMap).forEach((gizmo) => gizmo.component.initCamera(camera));
  }
  /**
   * toggle gizmo orientation mode
   * @param isGlobal - true if orientation is global, false if orientation is local
   */
  onToggleGizmoOrient(isGlobal: boolean) {
    Object.values(this._gizmoMap).forEach(
      (gizmo) => gizmo.component.toggleOrientation && gizmo.component.toggleOrientation(isGlobal)
    );
  }

  /**
   * toggle gizmo state
   * @param targetState - gizmo new state
   */
  onGizmoChange(targetState: GizmoState) {
    Object.values(this._gizmoMap).forEach((gizmo) => (gizmo.entity.isActive = false));
    this.gizmoState = targetState;
    if (targetState) {
      this._gizmoMap[targetState].entity.isActive = true;
      if (this._selectedEntity) {
        Object.values(this._gizmoMap).forEach((gizmo) => gizmo.component.onSelected(this._selectedEntity));
      }
    }
  }

  /**
   * called when entity is selected
   * @param entity - the selected entity, could be empty
   */
  onEntitySelected(entity: Entity | null) {
    if (this._entityTransformChangeFlag) {
      this._entityTransformChangeFlag.destroy();
    }
    this._selectedEntity = entity;
    if (!entity) {
      this._entityTransformChangeFlag = null;
      return;
    }
    Object.values(this._gizmoMap).forEach((gizmo) => gizmo.component.onSelected(entity));
    this._entityTransformChangeFlag = entity.transform.registerWorldChangeFlag();
  }

  /**
   * called when pointer enters gizmo
   * @param axisName - the hovered axis name
   */
  onGizmoHoverStart(axisName: string) {
    this._selectedAxisName = axisName;
    this._isHovered = true;
    this._gizmoMap[this.gizmoState].component.onHoverStart(axisName);
  }

  /**
   * called when pointer leaves gizmo
   */
  onGizmoHoverEnd() {
    if (this._isHovered) {
      this._gizmoMap[this.gizmoState].component.onHoverEnd();
      this._isHovered = false;
    }
  }
  /**
   * called when gizmo starts to move
   * @param axisName - the hovered axis name
   */
  triggerGizmoStart(axisName: string) {
    this._isStarted = true;
    this._selectedAxisName = axisName;
    const pointer = this._selectedEntity.engine.inputManager.pointers[0];
    if (pointer) {
      const x = pointer.position.x;
      const y = pointer.position.y;
      this._editorCamera.screenPointToRay(new Vector2(x, y), this._tempRay);
      this._gizmoMap[this.gizmoState].component.onMoveStart(this._tempRay, this._selectedAxisName);
    }
  }
  /**
   * called when gizmo is moving
   */
  onGizmoMove() {
    if (this._isStarted) {
      const pointer = this._selectedEntity.engine.inputManager.pointers[0];
      if (pointer) {
        const x = pointer.position.x;
        const y = pointer.position.y;
        this._editorCamera.screenPointToRay(new Vector2(x, y), this._tempRay2);
        this._gizmoMap[this.gizmoState].component.onMove(this._tempRay2);
      }
    }
  }

  /**
   * called when gizmo movement ends
   */
  triggerGizmoEnd() {
    if (this._isStarted) {
      this._gizmoMap[this.gizmoState].component.onMoveEnd();
      this._isStarted = false;
    }
  }

  /** @internal */
  onUpdate(deltaTime: number): void {
    if (!this._entityTransformChangeFlag) {
      return;
    }
    if (this._entityTransformChangeFlag.flag) {
      this.entity.transform.worldPosition = this._selectedEntity.transform.worldPosition;
      if (this.gizmoState === GizmoState.rotate) {
        // @ts-ignore
        this._gizmoMap[this.gizmoState].component.updateTransform();
      }
    }

    if (this._editorCamera) {
      const cameraPosition = this._editorCamera.entity.transform.position;
      const currentPosition = this.entity.transform.position;
      const len = Vector3.distance(cameraPosition, currentPosition);
      const scale = len * this._scaleFactor;
      this.entity.transform.setScale(scale, scale, scale);
    }
  }

  private _createGizmoControl(control: string, gizmoComponent: new (entity: Entity) => GizmoComponent) {
    const entity = this.entity.createChild();
    const component = entity.addComponent(gizmoComponent);
    this._gizmoMap[control] = { entity, component };
  }
}
