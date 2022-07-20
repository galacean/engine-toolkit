import { Camera, Entity, Ray, Script, Vector2, Vector3 } from "oasis-engine";
import { ScaleControl } from "./Scale";
import { TranslateControl } from "./Translate";
import { RotateControl } from "./Rotate";
import { GizmoComponent } from "./Type";
import { utils } from "./Utils";

type GizmoState = "rotate" | "translate" | "scale" | null;
export class GizmoControls extends Script {
  public gizmoState: GizmoState = "translate";
  private editorCamera: Camera;
  private gizmoMap: {
    [key: string]: { entity: Entity; component: GizmoComponent };
  } = {};
  private entityTransformChangeFlag;
  private selectedEntity: Entity;
  private isStarted: boolean = false;
  private scaleFactor = 0.05773502691896257;
  constructor(entity: Entity) {
    super(entity);

    utils.init(this.engine);

    this.createGizmoControl("translate", TranslateControl);
    this.createGizmoControl("scale", ScaleControl);
    this.createGizmoControl("rotate", RotateControl);
    this.onGizmoChange(this.gizmoState);
  }

  public initGizmoControl(camera: Camera) {
    this.editorCamera = camera;
    Object.values(this.gizmoMap).forEach((gizmo) => gizmo.component.initCamera(camera));
  }

  // 建立gizmo
  createGizmoControl(name: string, gizmoComponent: new (entity: Entity) => GizmoComponent) {
    const entity = this.entity.createChild(name);
    const component = entity.addComponent(gizmoComponent);

    this.gizmoMap[name] = { entity, component };
  }

  public onGizmoChange(currentState: GizmoState) {
    Object.values(this.gizmoMap).forEach((gizmo) => (gizmo.entity.isActive = false));
    this.gizmoState = currentState;
    if (currentState) {
      this.gizmoMap[currentState].entity.isActive = true;
      //   this.currentActiveNode && this.alignBoth();
    }
  }

  onSelected(entity: Entity | null) {
    if (this.entityTransformChangeFlag) {
      this.entityTransformChangeFlag.destroy();
    }
    this.selectedEntity = entity;
    Object.values(this.gizmoMap).forEach((gizmo) => gizmo.component.onSelected(entity));
    if (!entity) {
      this.entity.isActive = false;
      this.entityTransformChangeFlag = null;
      return;
    }
    this.entity.isActive = true;
    this.entityTransformChangeFlag = entity.transform.registerWorldChangeFlag();
  }
  private currentAxis: string;
  private isHovered: boolean = false;

  public hoverStart(axis: string) {
    this.currentAxis = axis;
    this.isHovered = true;
    this.gizmoMap[this.gizmoState].component.onHoverStart(axis);
  }

  public hoverEnd() {
    if (this.isHovered) {
      this.gizmoMap[this.gizmoState].component.onHoverEnd();
      this.isHovered = false;
    }
  }

  triggerGizmoStart(axis: string) {
    this.isStarted = true;
    this.currentAxis = axis;

    if (this.selectedEntity.engine.inputManager.pointers[0]) {
      const x = this.selectedEntity.engine.inputManager.pointers[0].position.x;
      const y = this.selectedEntity.engine.inputManager.pointers[0].position.y;
      let ray = new Ray();
      this.editorCamera.screenPointToRay(new Vector2(x, y), ray);
      this.gizmoMap[this.gizmoState].component.onMoveStart(ray, this.currentAxis);
    }
  }

  triggerGizmoEnd() {
    if (this.isStarted) {
      this.gizmoMap[this.gizmoState].component.onMoveEnd();
      this.isStarted = false;
    }
  }

  public onMove() {
    if (this.isStarted) {
      if (this.selectedEntity.engine.inputManager.pointers[0]) {
        const x = this.selectedEntity.engine.inputManager.pointers[0].position.x;
        const y = this.selectedEntity.engine.inputManager.pointers[0].position.y;
        let ray = new Ray();
        this.editorCamera.screenPointToRay(new Vector2(x, y), ray);
        this.gizmoMap[this.gizmoState].component.onMove(ray);
      }
    }
  }

  onUpdate(deltaTime: number): void {
    if (!this.entityTransformChangeFlag) {
      return;
    }
    if (this.entityTransformChangeFlag.flag) {
      this.entity.transform.worldPosition = this.selectedEntity.transform.worldPosition;
    }
    if (this.editorCamera) {
      const cameraPosition = this.editorCamera.entity.transform.position;
      const currentPosition = this.entity.transform.position;
      const len = Vector3.distance(cameraPosition, currentPosition);
      const scale = len * this.scaleFactor;
      this.entity.transform.setScale(scale, scale, scale);
    }
  }
}
