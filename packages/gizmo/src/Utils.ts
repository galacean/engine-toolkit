import { Mesh, Engine, PrimitiveMesh, ModelMesh, Vector3, UnlitMaterial, Color, CullMode } from "oasis-engine";
import { GizmoMaterial } from "./GizmoMaterial";
import { GizmoMesh } from "./GizmoMesh";

class Utils {
  rotateCircleRadius = 1.6;
  scaleFactor = 0.05773502691896257;

  redMaterial: UnlitMaterial;
  lightRedMaterial: UnlitMaterial;
  redArcMaterial: GizmoMaterial;
  greenMaterial: UnlitMaterial;
  lightGreenMaterial: UnlitMaterial;
  greenArcMaterial: GizmoMaterial;
  blueMaterial: UnlitMaterial;
  lightBlueMaterial: UnlitMaterial;
  blueArcMaterial: GizmoMaterial;
  yellowMaterial: UnlitMaterial;

  greyMaterial: UnlitMaterial;

  rotatePlaneMaterial: UnlitMaterial;

  invisibleMaterial: UnlitMaterial;

  lineMesh: ModelMesh;
  lineMeshShort: ModelMesh;
  arcLineMesh: ModelMesh;

  axisHelpertorusMesh: Mesh;
  axisHelperCubeMesh: Mesh;
  torusColliderMesh: Mesh;

  axisHelperLineMesh: Mesh;
  axisHelperPlaneMesh: Mesh;
  axisArrowMesh: Mesh;
  axisHelperArrowMesh: Mesh;
  axisPlaneMesh: Mesh;
  axisCubeMesh: Mesh;
  axisSphereMesh: Mesh;
  axisEndCubeMesh: Mesh;

  init(engine: Engine) {
    this.redMaterial = this._createUnlitMaterial(engine, 1.0, 0.25, 0.25, 1.0);
    this.lightRedMaterial = this._createUnlitMaterial(engine, 1.0, 0.25, 0.25, 0.9);

    const redArcMaterial = new GizmoMaterial(engine);
    redArcMaterial.baseColor = new Color(1, 0.25, 0.25, 1);
    this.redArcMaterial = redArcMaterial;

    this.greenMaterial = this._createUnlitMaterial(engine, 0.5, 0.8, 0.2, 1.0);
    this.lightGreenMaterial = this._createUnlitMaterial(engine, 0.5, 0.8, 0.2, 0.9);

    const greenArcMaterial = new GizmoMaterial(engine);
    greenArcMaterial.baseColor = new Color(0.5, 0.8, 0.2, 1);
    this.greenArcMaterial = greenArcMaterial;

    this.blueMaterial = this._createUnlitMaterial(engine, 0.3, 0.5, 1.0, 1.0);
    this.lightBlueMaterial = this._createUnlitMaterial(engine, 0.3, 0.5, 1.0, 0.9);

    const blueArcMaterial = new GizmoMaterial(engine);
    blueArcMaterial.baseColor = new Color(0.3, 0.5, 1.0, 1);
    this.blueArcMaterial = blueArcMaterial;

    this.yellowMaterial = this._createUnlitMaterial(engine, 1.0, 0.95, 0.0, 1.0);

    this.greyMaterial = this._createUnlitMaterial(engine, 0.75, 0.75, 0.75, 1.0);
    this.rotatePlaneMaterial = this._createUnlitMaterial(engine, 1.0, 0.95, 0.0, 0.2);

    this.rotatePlaneMaterial.renderState.rasterState.cullMode = CullMode.Off;
    this.invisibleMaterial = this._createUnlitMaterial(engine, 0, 0, 0, 0);

    this.lineMesh = GizmoMesh.createLine(engine, [new Vector3(0, 0, 0), new Vector3(0, 1.5, 0)]);

    this.lineMeshShort = GizmoMesh.createLine(engine, [new Vector3(0, 0.2, 0), new Vector3(0, 1.5, 0)]);

    this.arcLineMesh = GizmoMesh.createArc(engine, Math.PI, 1.6, 96);

    this.axisArrowMesh = PrimitiveMesh.createCone(engine, 0.06, 0.24);
    this.axisPlaneMesh = PrimitiveMesh.createPlane(engine, 0.35, 0.35);
    this.axisCubeMesh = PrimitiveMesh.createCuboid(engine, 0.3, 0.3, 0.3);
    this.axisSphereMesh = PrimitiveMesh.createSphere(engine, 0.2);
    this.axisEndCubeMesh = PrimitiveMesh.createCuboid(engine, 0.2, 0.2, 0.2);

    this.axisHelperLineMesh = PrimitiveMesh.createCylinder(engine, 0.12, 0.12, 3.35);
    this.axisHelperCubeMesh = PrimitiveMesh.createCuboid(engine, 0.4, 0.4, 0.4);
    this.axisHelperPlaneMesh = PrimitiveMesh.createPlane(engine, 0.75, 0.75);
    this.axisHelpertorusMesh = PrimitiveMesh.createTorus(engine, 1.6, 0.16, 6, 18, 180);
  }

  private _createUnlitMaterial(
    engine: Engine,
    r: number = 1.0,
    g: number = 1.0,
    b: number = 1.0,
    a: number = 1.0
  ): UnlitMaterial {
    const material = new UnlitMaterial(engine);
    material.isTransparent = true;
    material.renderState.depthState.enabled = false;
    material.baseColor.set(r, g, b, a);
    return material;
  }
}

export const utils = new Utils();
