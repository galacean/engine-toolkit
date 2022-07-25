import { Camera, Entity, Ray, Script, Vector2, Vector3 } from "oasis-engine";

import { ScaleControl } from "./Scale";
import { TranslateControl } from "./Translate";
import { RotateControl } from "./Rotate";
import { GizmoComponent } from "./Type";
import { utils } from "./Utils";

export enum GizmoState {
  rotate = "rotate",
  translate = "translate",
  scale = "scale"
}

export class GizmoControls extends Script {
  gizmoState: GizmoState = GizmoState.translate;
  private _isStarted = false;
  private _isHovered = false;
  private _scaleFactor = 0.05773502691896257;

  private gizmoMap: {
    [key: string]: { entity: Entity; component: GizmoComponent };
  } = {};
  private _entityTransformChangeFlag: any;
  /** the scene camera  */
  private _editorCamera: Camera;
  /** the selected entity  */
  private _selectedEntity: Entity;
  /** current active axis name */
  private _selectedAxisName: string;

  constructor(entity: Entity) {
    super(entity);

    utils.init(this.engine);

    this._createGizmoControl("translate", TranslateControl);
    this._createGizmoControl("scale", ScaleControl);
    this._createGizmoControl("rotate", RotateControl);
    this.onGizmoChange(this.gizmoState);
  }

  /**
   * initial scene camera in gizmo
   * @param camera - The scene camera
   */
  initGizmoControl(camera: Camera) {
    this._editorCamera = camera;
    Object.values(this.gizmoMap).forEach((gizmo) => gizmo.component.initCamera(camera));
  }
  /**
   * toggle gizmo orientation mode
   * @param isGlobal - true if orientation is global, false if orientation is local
   */
  onToggleGizmoOrient(isGlobal: boolean) {
    Object.values(this.gizmoMap).forEach(
      (gizmo) => gizmo.component.toggleOrientation && gizmo.component.toggleOrientation(isGlobal)
    );
  }

  /**
   * toggle gizmo state
   * @param currentState - gizmo new state
   */
  onGizmoChange(currentState: GizmoState) {
    Object.values(this.gizmoMap).forEach((gizmo) => (gizmo.entity.isActive = false));
    this.gizmoState = currentState;
    if (currentState) {
      this.gizmoMap[currentState].entity.isActive = true;
      if (this._selectedEntity) {
        Object.values(this.gizmoMap).forEach((gizmo) => gizmo.component.onSelected(this._selectedEntity));
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
    Object.values(this.gizmoMap).forEach((gizmo) => gizmo.component.onSelected(entity));
    this._entityTransformChangeFlag = entity.transform.registerWorldChangeFlag();
  }

  /**
   * called when pointer enters gizmo
   * @param axisName - the hovered axis name
   */
  onGizmoHoverStart(axisName: string) {
    this._selectedAxisName = axisName;
    this._isHovered = true;
    this.gizmoMap[this.gizmoState].component.onHoverStart(axisName);
  }

  /**
   * called when pointer leaves gizmo
   */
  onGizmoHoverEnd() {
    if (this._isHovered) {
      this.gizmoMap[this.gizmoState].component.onHoverEnd();
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

    if (this._selectedEntity.engine.inputManager.pointers[0]) {
      const x = this._selectedEntity.engine.inputManager.pointers[0].position.x;
      const y = this._selectedEntity.engine.inputManager.pointers[0].position.y;
      const ray = new Ray();
      this._editorCamera.screenPointToRay(new Vector2(x, y), ray);
      this.gizmoMap[this.gizmoState].component.onMoveStart(ray, this._selectedAxisName);
    }
  }
  /**
   * called when gizmo is moving
   */
  onGizmoMove() {
    if (this._isStarted) {
      if (this._selectedEntity.engine.inputManager.pointers[0]) {
        const x = this._selectedEntity.engine.inputManager.pointers[0].position.x;
        const y = this._selectedEntity.engine.inputManager.pointers[0].position.y;
        const ray = new Ray();
        this._editorCamera.screenPointToRay(new Vector2(x, y), ray);
        this.gizmoMap[this.gizmoState].component.onMove(ray);
      }
    }
  }

  /**
   * called when gizmo movement ends
   */
  triggerGizmoEnd() {
    if (this._isStarted) {
      this.gizmoMap[this.gizmoState].component.onMoveEnd();
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
      if (this.gizmoState === "rotate") {
        // @ts-ignore
        this.gizmoMap[this.gizmoState].component.updateTransform();
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

  /** setup gizmo control */
  private _createGizmoControl(controlName: string, gizmoComponent: new (entity: Entity) => GizmoComponent) {
    const entity = this.entity.createChild(controlName);
    const component = entity.addComponent(gizmoComponent);

    this.gizmoMap[controlName] = { entity, component };
  }
}
