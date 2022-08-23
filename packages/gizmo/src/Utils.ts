import { Material, Mesh, Engine, Vector4, PrimitiveMesh } from "oasis-engine";
import { ArcLineMesh } from "./ArcLineMesh";
import { GizmoMaterial } from "./GizmoMaterial";
import { LinesMesh } from "./LineMesh";

class Utils {
  public redMaterial: Material;
  public lightRedMaterial: Material;
  public redArcMaterial: Material;
  public greenMaterial: Material;
  public lightGreenMaterial: Material;
  public greenArcMaterial: Material;
  public blueMaterial: Material;
  public lightBlueMaterial: Material;
  public blueArcMaterial: Material;
  public yellowMaterial: Material;

  public greyMaterial: Material;

  public rotatePlaneMaterial: Material;

  public invisibleMaterial: Material;

  public lineMesh: LinesMesh;
  public lineMeshShort: LinesMesh;
  public arcLineMesh: ArcLineMesh;

  public axisHelpertorusMesh: Mesh;

  public torusColliderMesh: Mesh;

  public rotateCircleRadius = 1.6;

  public axisHelperLineMesh: Mesh;
  public axisHelperPlaneMesh: Mesh;
  public axisArrowMesh: Mesh;
  public axisHelperArrowMesh: Mesh;
  public axisPlaneMesh: Mesh;
  public axisCubeMesh: Mesh;
  public axisSphereMesh: Mesh;
  public axisEndCubeMesh: Mesh;

  init(engine: Engine) {
    this.redMaterial = new GizmoMaterial(engine, {
      color: new Vector4(1.0, 0.25, 0.25, 1.0),
      depthTest: false,
      doubleSide: true,
      blend: true
    });
    this.lightRedMaterial = new GizmoMaterial(engine, {
      color: new Vector4(1.0, 0.25, 0.25, 0.9),
      depthTest: false,
      doubleSide: true,
      blend: true
    });
    this.redArcMaterial = new GizmoMaterial(engine, {
      color: new Vector4(1.0, 0.25, 0.25, 1.0),
      depthTest: false,
      doubleSide: true,
      blend: true
    });

    this.greenMaterial = new GizmoMaterial(engine, {
      color: new Vector4(0.5, 0.8, 0.2, 1.0),
      depthTest: false,
      blend: true
    });
    this.lightGreenMaterial = new GizmoMaterial(engine, {
      color: new Vector4(0.5, 0.8, 0.2, 0.9),
      depthTest: false,
      blend: true
    });
    this.greenArcMaterial = new GizmoMaterial(engine, {
      color: new Vector4(0.5, 0.8, 0.2, 1.0),
      depthTest: false,
      blend: true
    });

    this.blueMaterial = new GizmoMaterial(engine, {
      color: new Vector4(0.3, 0.5, 1.0, 1.0),
      depthTest: false,
      blend: true
    });
    this.yellowMaterial = new GizmoMaterial(engine, {
      color: new Vector4(1.0, 0.95, 0.0, 1.0),
      depthTest: false,
      blend: true
    });
    this.blueArcMaterial = new GizmoMaterial(engine, {
      color: new Vector4(0.3, 0.5, 1.0, 1.0),
      depthTest: false,
      blend: true
    });

    this.lightBlueMaterial = new GizmoMaterial(engine, {
      color: new Vector4(0.3, 0.5, 1.0, 0.9),
      depthTest: false,
      blend: true
    });

    this.greyMaterial = new GizmoMaterial(engine, {
      color: new Vector4(0.75, 0.75, 0.75, 1.0),
      depthTest: false,
      blend: true
    });

    this.rotatePlaneMaterial = new GizmoMaterial(engine, {
      color: new Vector4(1.0, 0.95, 0.0, 0.2),
      depthTest: false,
      blend: true,
      doubleSide: true
    });

    this.invisibleMaterial = new GizmoMaterial(engine, {
      color: new Vector4(0.0, 0.0, 0.0, 0.0),
      depthTest: false,
      blend: true
    });

    this.lineMesh = new LinesMesh(engine, {
      points: [
        [0, 0, 0],
        [0, 1.5, 0]
      ],
      count: 2
    });

    this.lineMeshShort = new LinesMesh(engine, {
      points: [
        [0, 0.2, 0],
        [0, 1.5, 0]
      ],
      count: 2
    });

    this.arcLineMesh = new ArcLineMesh(engine, {
      radius: 1.6,
      radialSegments: 48,
      arc: 180
    });

    this.axisArrowMesh = PrimitiveMesh.createCone(engine, 0.06, 0.24);
    this.axisPlaneMesh = PrimitiveMesh.createPlane(engine, 0.35, 0.35);
    this.axisCubeMesh = PrimitiveMesh.createCuboid(engine, 0.2, 0.2, 0.2);
    this.axisSphereMesh = PrimitiveMesh.createSphere(engine, 0.2);
    this.axisEndCubeMesh = PrimitiveMesh.createCuboid(engine, 0.2, 0.2, 0.2);

    this.axisHelperLineMesh = PrimitiveMesh.createCylinder(engine, 0.12, 0.12, 3.35);
    this.axisHelperPlaneMesh = PrimitiveMesh.createPlane(engine, 0.75, 0.75);
    this.axisHelpertorusMesh = PrimitiveMesh.createTorus(engine, 1.6, 0.16, 6, 18, 180);
  }
}

export const utils = new Utils();
