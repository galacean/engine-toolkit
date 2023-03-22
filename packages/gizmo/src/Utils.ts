import { Engine, PrimitiveMesh, ModelMesh, CullMode, Color } from "oasis-engine";
import { State } from "./enums/GizmoState";
import { GizmoMesh } from "./GizmoMesh";
import { PlainColorMaterial } from "@oasis-engine-toolkit/custom-material";
import { ArcMaterial } from "./GizmoMaterial";

export class Utils {
  static rotateCircleRadius = 1.6;
  static scaleFactor = 0.05773502691896257;

  static redMaterialTrans: PlainColorMaterial;
  static lightRedMaterial: PlainColorMaterial;
  static greenMaterialTrans: PlainColorMaterial;
  static lightGreenMaterial: PlainColorMaterial;
  static blueMaterialTrans: PlainColorMaterial;
  static lightBlueMaterial: PlainColorMaterial;
  static invisibleMaterialTrans: PlainColorMaterial;

  static redArcMaterial: ArcMaterial;
  static greenArcMaterial: ArcMaterial;
  static blueArcMaterial: ArcMaterial;
  static yellowMaterial: PlainColorMaterial;
  static rotatePlaneMaterial: PlainColorMaterial;
  static invisibleMaterialRotate: PlainColorMaterial;
  static sphereMaterial: PlainColorMaterial;

  static redMaterialScale: PlainColorMaterial;
  static greenMaterialScale: PlainColorMaterial;
  static blueMaterialScale: PlainColorMaterial;
  static greyMaterial: PlainColorMaterial;
  static invisibleMaterialScale: PlainColorMaterial;

  static lineMesh: ModelMesh;
  static lineMeshShort: ModelMesh;
  static axisXTorusMesh: ModelMesh;
  static axisYTorusMesh: ModelMesh;
  static axisZTorusMesh: ModelMesh;

  static axisHelpertorusMesh: ModelMesh;
  static axisHelperCubeMesh: ModelMesh;
  static torusColliderMesh: ModelMesh;
  static axisHelperLineMesh: ModelMesh;
  static axisHelperPlaneMesh: ModelMesh;
  static axisArrowMesh: ModelMesh;
  static axisHelperArrowMesh: ModelMesh;
  static axisPlaneMesh: ModelMesh;
  static axisCubeMesh: ModelMesh;
  static axisSphereMesh: ModelMesh;
  static axisEndCubeMesh: ModelMesh;

  static init(engine: Engine) {
    // translate material
    Utils.redMaterialTrans = this._createPlainColorMaterial(engine, State.translate, 1.0, 0.25, 0.25, 1.0);
    Utils.lightRedMaterial = this._createPlainColorMaterial(engine, State.translate, 1.0, 0.25, 0.25, 0.9);
    Utils.greenMaterialTrans = this._createPlainColorMaterial(engine, State.translate, 0.5, 0.8, 0.2, 1.0);
    Utils.lightGreenMaterial = this._createPlainColorMaterial(engine, State.translate, 0.5, 0.8, 0.2, 0.9);
    Utils.blueMaterialTrans = this._createPlainColorMaterial(engine, State.translate, 0.3, 0.5, 1.0, 1.0);
    Utils.lightBlueMaterial = this._createPlainColorMaterial(engine, State.translate, 0.3, 0.5, 1.0, 0.9);
    Utils.invisibleMaterialTrans = this._createPlainColorMaterial(engine, State.translate, 0, 0, 0, 0);

    // rotate material
    Utils.redArcMaterial = this._createArcMaterial(engine, State.rotate, 1.0, 0.25, 0.25);
    Utils.greenArcMaterial = this._createArcMaterial(engine, State.rotate, 0.5, 0.8, 0.2);
    Utils.blueArcMaterial = this._createArcMaterial(engine, State.rotate, 0.3, 0.5, 1.0);
    Utils.yellowMaterial = this._createPlainColorMaterial(engine, State.rotate, 1.0, 0.95, 0.0, 1.0);
    Utils.rotatePlaneMaterial = this._createPlainColorMaterial(engine, State.rotate, 1.0, 0.95, 0.0, 0.2);
    Utils.rotatePlaneMaterial.renderState.rasterState.cullMode = CullMode.Off;
    Utils.invisibleMaterialRotate = this._createPlainColorMaterial(engine, State.rotate, 0, 0, 0, 0);
    Utils.invisibleMaterialRotate.renderState.rasterState.cullMode = CullMode.Off;
    Utils.sphereMaterial = this._createPlainColorMaterial(engine, State.rotate, 0.9, 0.9, 0.9, 0);
    Utils.sphereMaterial.renderState.rasterState.cullMode = CullMode.Off;

    // scale material
    Utils.redMaterialScale = this._createPlainColorMaterial(engine, State.scale, 1.0, 0.25, 0.25, 1.0);
    Utils.greenMaterialScale = this._createPlainColorMaterial(engine, State.scale, 0.5, 0.8, 0.2, 1.0);
    Utils.blueMaterialScale = this._createPlainColorMaterial(engine, State.scale, 0.3, 0.5, 1.0, 1.0);
    Utils.greyMaterial = this._createPlainColorMaterial(engine, State.scale, 0.75, 0.75, 0.75, 1.0);
    Utils.invisibleMaterialScale = this._createPlainColorMaterial(engine, State.scale, 0, 0, 0, 0);

    Utils.lineMesh = PrimitiveMesh.createCylinder(engine, 0.02, 0.02, 1.5);
    Utils.lineMeshShort = PrimitiveMesh.createCylinder(engine, 0.02, 0.02, 1.3);
    Utils.axisArrowMesh = PrimitiveMesh.createCone(engine, 0.08, 0.3);
    Utils.axisPlaneMesh = PrimitiveMesh.createPlane(engine, 0.35, 0.35);
    Utils.axisCubeMesh = PrimitiveMesh.createCuboid(engine, 0.32, 0.32, 0.32);
    Utils.axisSphereMesh = PrimitiveMesh.createSphere(engine, 1.6, 48);
    Utils.axisEndCubeMesh = PrimitiveMesh.createCuboid(engine, 0.25, 0.25, 0.25);
    Utils.axisXTorusMesh = GizmoMesh.createCircleTube(engine, Math.PI, 1.6, 0.02);
    Utils.axisYTorusMesh = GizmoMesh.createCircleTube(engine, Math.PI, 1.6, 0.02);
    Utils.axisZTorusMesh = GizmoMesh.createCircleTube(engine, Math.PI, 1.6, 0.02);

    Utils.axisHelperLineMesh = PrimitiveMesh.createCylinder(engine, 0.15, 0.15, 1.75);
    Utils.axisHelperCubeMesh = PrimitiveMesh.createCuboid(engine, 0.4, 0.4, 0.4);
    Utils.axisHelperPlaneMesh = PrimitiveMesh.createPlane(engine, 0.75, 0.75);
    Utils.axisHelpertorusMesh = GizmoMesh.createCircleTube(engine, Math.PI, 1.6, 0.16);
  }

  private static _createPlainColorMaterial(
    engine: Engine,
    name: State,
    r: number = 1.0,
    g: number = 1.0,
    b: number = 1.0,
    a: number = 1.0
  ): PlainColorMaterial {
    const material = new PlainColorMaterial(engine);
    material.isTransparent = true;
    material.renderState.depthState.enabled = false;
    material.baseColor.set(r, g, b, a);
    material.name = name.toString();
    return material;
  }

  private static _createArcMaterial(
    engine: Engine,
    name: State,
    r: number = 1.0,
    g: number = 1.0,
    b: number = 1.0
  ): ArcMaterial {
    const material = new ArcMaterial(engine);
    material.baseColor = new Color(r, g, b, 1.0);
    material.name = name.toString();
    return material;
  }
}
