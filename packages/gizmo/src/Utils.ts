import { Mesh, Engine, PrimitiveMesh, ModelMesh, Vector3, UnlitMaterial, Color, CullMode } from "oasis-engine";
import { GizmoMaterial } from "./GizmoMaterial";
import { GizmoMesh } from "./GizmoMesh";

export class Utils {
  static rotateCircleRadius = 1.6;
  static scaleFactor = 0.05773502691896257;

  static redMaterial: UnlitMaterial;
  static lightRedMaterial: UnlitMaterial;
  static redArcMaterial: GizmoMaterial;
  static greenMaterial: UnlitMaterial;
  static lightGreenMaterial: UnlitMaterial;
  static greenArcMaterial: GizmoMaterial;
  static blueMaterial: UnlitMaterial;
  static lightBlueMaterial: UnlitMaterial;
  static blueArcMaterial: GizmoMaterial;
  static yellowMaterial: UnlitMaterial;

  static greyMaterial: UnlitMaterial;

  static rotatePlaneMaterial: UnlitMaterial;

  static invisibleMaterial: UnlitMaterial;

  static lineMesh: ModelMesh;
  static lineMeshShort: ModelMesh;
  static arcLineMesh: ModelMesh;
  static axisTorusMesh: ModelMesh;

  static axisHelpertorusMesh: Mesh;
  static axisHelperCubeMesh: Mesh;
  static torusColliderMesh: Mesh;

  static axisHelperLineMesh: Mesh;
  static axisHelperPlaneMesh: Mesh;
  static axisArrowMesh: Mesh;
  static axisHelperArrowMesh: Mesh;
  static axisPlaneMesh: Mesh;
  static axisCubeMesh: Mesh;
  static axisSphereMesh: Mesh;
  static axisEndCubeMesh: Mesh;

  init(engine: Engine) {
    Utils.redMaterial = this._createUnlitMaterial(engine, 1.0, 0.25, 0.25, 1.0);
    Utils.lightRedMaterial = this._createUnlitMaterial(engine, 1.0, 0.25, 0.25, 0.9);

    const redArcMaterial = new GizmoMaterial(engine);
    redArcMaterial.baseColor = new Color(1, 0.25, 0.25, 1);
    Utils.redArcMaterial = redArcMaterial;

    Utils.greenMaterial = this._createUnlitMaterial(engine, 0.5, 0.8, 0.2, 1.0);
    Utils.lightGreenMaterial = this._createUnlitMaterial(engine, 0.5, 0.8, 0.2, 0.9);

    const greenArcMaterial = new GizmoMaterial(engine);
    greenArcMaterial.baseColor = new Color(0.5, 0.8, 0.2, 1);
    Utils.greenArcMaterial = greenArcMaterial;

    Utils.blueMaterial = this._createUnlitMaterial(engine, 0.3, 0.5, 1.0, 1.0);
    Utils.lightBlueMaterial = this._createUnlitMaterial(engine, 0.3, 0.5, 1.0, 0.9);

    const blueArcMaterial = new GizmoMaterial(engine);
    blueArcMaterial.baseColor = new Color(0.3, 0.5, 1.0, 1);
    Utils.blueArcMaterial = blueArcMaterial;

    Utils.yellowMaterial = this._createUnlitMaterial(engine, 1.0, 0.95, 0.0, 1.0);

    Utils.greyMaterial = this._createUnlitMaterial(engine, 0.75, 0.75, 0.75, 1.0);
    Utils.rotatePlaneMaterial = this._createUnlitMaterial(engine, 1.0, 0.95, 0.0, 0.2);

    Utils.rotatePlaneMaterial.renderState.rasterState.cullMode = CullMode.Off;
    Utils.invisibleMaterial = this._createUnlitMaterial(engine, 0, 0, 0, 0);

    Utils.lineMesh = PrimitiveMesh.createCylinder(engine, 0.02, 0.02, 1.5);
    Utils.lineMeshShort = PrimitiveMesh.createCylinder(engine, 0.02, 0.02, 1.3);

    Utils.arcLineMesh = GizmoMesh.createArc(engine, Math.PI, 1.6, 96);

    Utils.axisArrowMesh = PrimitiveMesh.createCone(engine, 0.08, 0.24);
    Utils.axisPlaneMesh = PrimitiveMesh.createPlane(engine, 0.35, 0.35);
    Utils.axisCubeMesh = PrimitiveMesh.createCuboid(engine, 0.3, 0.3, 0.3);
    Utils.axisSphereMesh = PrimitiveMesh.createSphere(engine, 0.2);
    Utils.axisEndCubeMesh = PrimitiveMesh.createCuboid(engine, 0.2, 0.2, 0.2);
    Utils.axisTorusMesh = PrimitiveMesh.createTorus(engine, 1.6, 0.02, 6, 72, 360);

    Utils.axisHelperLineMesh = PrimitiveMesh.createCylinder(engine, 0.12, 0.12, 3.35);
    Utils.axisHelperCubeMesh = PrimitiveMesh.createCuboid(engine, 0.4, 0.4, 0.4);
    Utils.axisHelperPlaneMesh = PrimitiveMesh.createPlane(engine, 0.75, 0.75);
    Utils.axisHelpertorusMesh = PrimitiveMesh.createTorus(engine, 1.6, 0.16, 6, 18, 360);
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
