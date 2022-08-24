import { Camera, Entity, Matrix, Ray, Component, Vector3 } from "oasis-engine";
import { ScaleControl } from "./Scale";
import { TranslateControl } from "./Translate";
import { RotateControl } from "./Rotate";
import { GizmoComponent } from "./Type";
import { utils } from "./Utils";
import { GizmoState } from "./enums/GizmoState";
import { AnchorType, CoordinateType, Group } from "./Group";

/**
 * Gizmo controls, including translate, rotate, scale
 */
export class GizmoControls extends Component {
  gizmoState: GizmoState = GizmoState.translate;

  private _isStarted = false;
  private _isHovered = false;
  private _scaleFactor = 0.05773502691896257;
  private _gizmoMap: Record<string, { entity: Entity; component: GizmoComponent }> = {};
  private _editorCamera: Camera;
  private _selectedAxisName: string;
  private _group: Group = new Group();
  private _tempRay: Ray = new Ray();
  private _tempRay2: Ray = new Ray();
  private _tempMatrix: Matrix = new Matrix();

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
   * toggle gizmo orientation type
   * @param isGlobal - true if orientation is global, false if orientation is local
   */
  onToggleGizmoOrient(isGlobal: boolean) {
    this._group.coordinateType = isGlobal ? CoordinateType.Global : CoordinateType.Local;
  }

  /**
   * toggle gizmo anchor type
   * @param isGlobal - true if anchor is center, false if anchor is pivot
   */
  onToggleGizmoAnchor(isCenter: boolean) {
    this._group.anchorType = isCenter ? AnchorType.Center : AnchorType.Pivot;
  }

  /**
   * toggle gizmo state
   * @param targetState - gizmo new state
   */
  onGizmoChange(targetState: GizmoState) {
    this.gizmoState = targetState;
    const { _gizmoMap: gizmoMap } = this;
    const states = Object.keys(gizmoMap);
    for (let i = states.length - 1; i >= 0; i--) {
      const state = states[i];
      gizmoMap[state].entity.isActive = targetState === state;
    }
  }

  /**
   * called when entity is selected
   * @param entity - the selected entity, could be empty
   */
  onEntitySelected(entity: Entity | null) {
    /** 目前是单选，所以清空之前选中的物体 */
    const { _group: group } = this;
    group.reset();
    if (!entity) {
      return;
    }
    group.addEntity([entity]);
    Object.values(this._gizmoMap).forEach((gizmo) => gizmo.component.onSelected(group));
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
    const pointerPosition = this.engine.inputManager.pointerPosition;
    if (pointerPosition) {
      const { _tempRay } = this;
      this._editorCamera.screenPointToRay(pointerPosition, _tempRay);
      this._gizmoMap[this.gizmoState].component.onMoveStart(_tempRay, this._selectedAxisName);
    }
  }
  /**
   * called when gizmo is moving
   */
  onGizmoMove() {
    if (this._isStarted) {
      const pointerPosition = this.engine.inputManager.pointerPosition;
      if (pointerPosition) {
        this._editorCamera.screenPointToRay(pointerPosition, this._tempRay2);
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
      if (this.gizmoState === GizmoState.rotate && this._group.coordinateType === CoordinateType.Global) {
        // 如果是旋转且为世界参考坐标，需要更新一下
        this._group.coordinateType = CoordinateType.Local;
        this._group.coordinateType = CoordinateType.Global;
      }
      this._isStarted = false;
    }
  }

  private update(): void {
    let s: number = 1;
    if (this._editorCamera) {
      const cameraPosition = this._editorCamera.entity.transform.worldPosition;
      const currentPosition = this.entity.transform.worldPosition;
      s = Vector3.distance(cameraPosition, currentPosition) * this._scaleFactor;
    }
    // hack 操作，记录下当前 gizmo 显示的缩放
    window.gizmoScale = s;
    // 需要 group 归一化后的世界矩阵
    this._group.getNormalizedMatrix(this._tempMatrix, s);
    this.entity.transform.worldMatrix = this._tempMatrix;
    if (this._isStarted && this.gizmoState === GizmoState.rotate) {
      (this._gizmoMap[GizmoState.rotate].component as RotateControl).onLateUpdate();
    }
  }

  private _createGizmoControl(control: string, gizmoComponent: new (entity: Entity) => GizmoComponent) {
    const entity = this.entity.createChild();
    const component = entity.addComponent(gizmoComponent);
    this._gizmoMap[control] = { entity, component };
  }
}
