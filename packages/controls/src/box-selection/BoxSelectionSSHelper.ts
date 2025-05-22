import { Entity, InputManager, MeshRenderer, Vector2, WebGLEngine } from "@galacean/engine";
import { BoxSelectionSSMaterial } from "./BoxSelectionSSMaterial";
import { PlaneMesh } from "./PlaneMesh";
import { IBoxSelectionHelper } from "./types";

// draw according to screen space
export class BoxSelectionSSHelper implements IBoxSelectionHelper {
  element: Entity;
  sceneRoot: Entity;
  startPoint: Vector2;
  pointBottomLeft: Vector2;
  pointTopRight: Vector2;
  isDown: boolean;
  onPointerDown: any;
  onPointerMove: any;
  onPointerUp: any;
  input: InputManager;
  engine: WebGLEngine;
  material: BoxSelectionSSMaterial;

  constructor(engine: WebGLEngine, sceneRoot: Entity) {
    this.engine = engine;
    this.element = new Entity(engine);
    this.sceneRoot = sceneRoot;
    this.startPoint = new Vector2();
    this.pointBottomLeft = new Vector2();
    this.pointTopRight = new Vector2();
    this.input = engine.inputManager;
    this.init();
  }

  private init() {
    const renderer = this.element.addComponent(MeshRenderer);
    renderer.receiveShadows = false;
    renderer.castShadows = false;
    renderer.mesh = PlaneMesh.createPlane(this.engine); // PrimitiveMesh.createPlane is xoz plane, but we need xoy plane
    this.material = new BoxSelectionSSMaterial(this.engine);
    renderer.setMaterial(this.material);
    this.element.transform.rotation.x = Math.PI * 0.5;
  }

  onSelectStart(vec2: Vector2) {
    this.startPoint.x = vec2.x;
    this.startPoint.y = this.engine.canvas.height - vec2.y;
    this.sceneRoot.addChild(this.element);
  }

  onSelecting(vec2: Vector2) {
    this.pointTopRight.x = Math.max(this.startPoint.x, vec2.x);
    this.pointTopRight.y = Math.max(this.startPoint.y, this.engine.canvas.height - vec2.y);
    this.pointBottomLeft.x = Math.min(this.startPoint.x, vec2.x);
    this.pointBottomLeft.y = Math.min(this.startPoint.y, this.engine.canvas.height - vec2.y);

    this.material.maxPoint = this.pointTopRight;
    this.material.minPoint = this.pointBottomLeft;
  }

  onSelectEnd() {
    this.sceneRoot.removeChild(this.element);
  }
}
