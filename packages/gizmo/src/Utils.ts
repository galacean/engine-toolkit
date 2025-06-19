import { Engine, PrimitiveMesh, ModelMesh, CullMode, Vector3, Color, UnlitMaterial } from "@galacean/engine";
import { State } from "./enums/GizmoState";
import { GizmoMesh } from "./GizmoMesh";

export class Utils {
  static rotateCircleRadius = 1.6;
  static scaleFactor = 0.05773502691896257;
  static rectFactor = 0.05;

  static redMaterialTrans: UnlitMaterial;
  static lightRedMaterial: UnlitMaterial;
  static greenMaterialTrans: UnlitMaterial;
  static lightGreenMaterial: UnlitMaterial;
  static blueMaterialTrans: UnlitMaterial;
  static lightBlueMaterial: UnlitMaterial;
  static invisibleMaterialTrans: UnlitMaterial;

  static yzMaterial: UnlitMaterial;

  static redArcMaterial: UnlitMaterial;
  static greenArcMaterial: UnlitMaterial;
  static blueArcMaterial: UnlitMaterial;
  static yellowMaterial: UnlitMaterial;
  static rotatePlaneMaterial: UnlitMaterial;
  static invisibleMaterialRotate: UnlitMaterial;
  static invisibleMaterialCircle: UnlitMaterial;

  static redMaterialScale: UnlitMaterial;
  static greenMaterialScale: UnlitMaterial;
  static blueMaterialScale: UnlitMaterial;
  static greyMaterial: UnlitMaterial;
  static lightMaterial: UnlitMaterial;
  static invisibleMaterialScale: UnlitMaterial;

  static visibleMaterialRect: UnlitMaterial;
  static invisibleMaterialRect: UnlitMaterial;

  static lineMesh: ModelMesh;
  static lineMeshShort: ModelMesh;
  static axisXTorusMesh: ModelMesh;
  static axisYTorusMesh: ModelMesh;
  static axisZTorusMesh: ModelMesh;
  static axisXYZTorusMesh: ModelMesh;

  static axisHelpertorusMesh: ModelMesh;
  static axisHelperLineMesh: ModelMesh;
  static axisHelperPlaneMesh: ModelMesh;
  static axisArrowMesh: ModelMesh;
  static axisPlaneMesh: ModelMesh;
  static axisCubeMesh: ModelMesh;
  static axisSphereMesh: ModelMesh;
  static axisEndCubeMesh: ModelMesh;

  static xAxisPositive: Vector3;
  static yAxisPositive: Vector3;
  static zAxisPositive: Vector3;

  static init(engine: Engine) {
    // translate material
    Utils.redMaterialTrans = this._createPlainColorMaterial(
      engine,
      State.translate,
      1,
      0,
      0
    );
    Utils.lightRedMaterial = this._createPlainColorMaterial(
      engine,
      State.translate,
      1.0,
      0,
      0,
      0.9
    );
    Utils.greenMaterialTrans = this._createPlainColorMaterial(
      engine,
      State.translate,
      0,
      1,
      0
    );
    Utils.lightGreenMaterial = this._createPlainColorMaterial(
      engine,
      State.translate,
      0,
      1,
      0,
      0.9
    );
    Utils.blueMaterialTrans = this._createPlainColorMaterial(
      engine,
      State.translate,
      0,
      0,
      1.0
    );
    Utils.lightBlueMaterial = this._createPlainColorMaterial(
      engine,
      State.translate,
      0,
      0,
      1.0,
      0.9
    );
    Utils.invisibleMaterialTrans = this._createPlainColorMaterial(engine, State.translate, 0, 0, 0, 0);

    // rotate material
    Utils.redArcMaterial = this._createPlainColorMaterial(
      engine,
      State.rotate,
      1.0,
      0.05087608817155679,
      0.05087608817155679
    );
    Utils.greenArcMaterial = this._createPlainColorMaterial(
      engine,
      State.rotate,
      0.21404114048223255,
      0.6038273388553378,
      0.033104766570885055
    );
    Utils.blueArcMaterial = this._createPlainColorMaterial(
      engine,
      State.rotate,
      0.07323895587840543,
      0.21404114048223255,
      1.0
    );
    const yellowColor = Color.lerp(
      Utils.redArcMaterial.baseColor,
      Utils.greenArcMaterial.baseColor,
      0.5,
      new Color()
    )
    
    Utils.rotatePlaneMaterial = this._createPlainColorMaterial(engine, State.rotate, 1.0, 0.8900054069935289, 0.0, 0.2);
    Utils.rotatePlaneMaterial.renderState.rasterState.cullMode = CullMode.Off;
    Utils.invisibleMaterialRotate = this._createPlainColorMaterial(engine, State.rotate, 0, 0, 0, 0);
    Utils.invisibleMaterialRotate.renderState.rasterState.cullMode = CullMode.Off;
    Utils.invisibleMaterialCircle = this._createPlainColorMaterial(engine, State.rotate, 0, 0, 0, 0);

    // scale material
    Utils.redMaterialScale = this._createPlainColorMaterial(
      engine,
      State.scale,
      1.0,
      0.05087608817155679,
      0.05087608817155679
    );
    Utils.greenMaterialScale = this._createPlainColorMaterial(
      engine,
      State.scale,
      0.21404114048223255,
      0.6038273388553378,
      0.033104766570885055
    );
    Utils.blueMaterialScale = this._createPlainColorMaterial(
      engine,
      State.scale,
      0.07323895587840543,
      0.21404114048223255,
      1.0
    );
    Utils.greyMaterial = this._createPlainColorMaterial(
      engine,
      State.scale,
      0.5225215539683921,
      0.5225215539683921,
      0.5225215539683921
    );
    Utils.lightMaterial = this._createPlainColorMaterial(
      engine,
      State.scale,
      0.44798841244188325,
      0.44798841244188325,
      0.44798841244188325
    );

    const yzColor = Color.lerp(Utils.greenMaterialTrans.baseColor, Utils.blueMaterialTrans.baseColor, 0.5, new Color());

    Utils.yzMaterial = this._createPlainColorMaterial(engine, State.translateYZ, yzColor.r, yzColor.g, yzColor.b);

    Utils.invisibleMaterialScale = this._createPlainColorMaterial(engine, State.scale, 0, 0, 0, 0);

    // rect material
    Utils.visibleMaterialRect = this._createPlainColorMaterial(
      engine,
      State.rect,
      0.3662525955988395,
      0.4072402119017367,
      0.45641102318040466
    );
    Utils.invisibleMaterialRect = this._createPlainColorMaterial(engine, State.rect, 0, 0, 0, 0);

    Utils.lineMesh = PrimitiveMesh.createCylinder(engine, 0.003, 0.003, 1.5);
    Utils.lineMeshShort = PrimitiveMesh.createCylinder(engine, 0.003, 0.003, 1.3);
    Utils.axisArrowMesh = PrimitiveMesh.createCone(engine, 0.05, 0.2, 8);
    Utils.axisPlaneMesh = PrimitiveMesh.createPlane(engine, 0.5, 0.5);
    Utils.axisCubeMesh = PrimitiveMesh.createCuboid(engine, 0.32, 0.32, 0.32);
    Utils.axisSphereMesh = PrimitiveMesh.createSphere(engine, 1.8, 48);
    Utils.axisEndCubeMesh = PrimitiveMesh.createCuboid(engine, 0.25, 0.25, 0.25);
    Utils.axisXTorusMesh = GizmoMesh.createCircleTube(engine, Math.PI, 1.6, 0.02);
    Utils.axisYTorusMesh = GizmoMesh.createCircleTube(engine, Math.PI, 1.6, 0.02);
    Utils.axisZTorusMesh = GizmoMesh.createCircleTube(engine, Math.PI, 1.6, 0.02);

    Utils.axisXYZTorusMesh = GizmoMesh.createCircleTube(engine, 2 * Math.PI, 1.8, 0.02);

    Utils.axisHelperLineMesh = PrimitiveMesh.createCylinder(engine, 0.15, 0.15, 1.75);
    Utils.axisHelperPlaneMesh = PrimitiveMesh.createPlane(engine, 0.75, 0.75);
    Utils.axisHelpertorusMesh = GizmoMesh.createCircleTube(engine, Math.PI, 1.6, 0.24);

    Utils.xAxisPositive = new Vector3(-1, 0, 0);
    Utils.yAxisPositive = new Vector3(0, -1, 0);
    Utils.zAxisPositive = new Vector3(0, 0, -1);
  }

  private static _createPlainColorMaterial(
    engine: Engine,
    name: State,
    r: number = 1.0,
    g: number = 1.0,
    b: number = 1.0,
    a: number = 1.0
  ): UnlitMaterial {
    const material = new UnlitMaterial(engine);
    material.isTransparent = true;
    material.renderState.depthState.enabled = false;
    material.baseColor.set(r, g, b, a);
    material.name = name.toString();
    return material;
  }
}
