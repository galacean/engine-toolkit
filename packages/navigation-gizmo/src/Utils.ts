import {
  Material,
  Mesh,
  Engine,
  Vector4,
  PrimitiveMesh,
  ModelMesh,
  Vector3,
} from "oasis-engine";
import { createCircleMesh } from "./CircleMesh";
import { createMeshMaterial } from "./MeshMaterial";

class Utils {
  public redMaterial: Material;
  public greenMaterial: Material;
  public blueMaterial: Material;
  public bgMaterial: Material;
  public darkMaterial: Material;

  public axisMesh: Mesh;
  public endMesh: Mesh;
  public endInnerMesh: ModelMesh;
  public bgMesh: ModelMesh;

  public radius: number = 5;
  public endRadius: number = 1;
  public axisLength: number = this.radius - 2 * this.endRadius;
  public endDist: number = this.radius - this.endRadius;

  public xRotateVector: Vector3 = new Vector3();
  public yRotateVector: Vector3 = new Vector3();
  public zRotateVector: Vector3 = new Vector3();

  public xTranslateVector: Vector3 = new Vector3();
  public yTranslateVector: Vector3 = new Vector3();
  public zTranslateVector: Vector3 = new Vector3();

  public xEndTranslateVector: Vector3 = new Vector3();
  public yEndTranslateVector: Vector3 = new Vector3();
  public zEndTranslateVector: Vector3 = new Vector3();

  init(engine: Engine) {
    this.redMaterial = createMeshMaterial(
      engine,
      new Vector4(1.0, 0.25, 0.25, 1.0),
      false,
      false
    );

    this.greenMaterial = createMeshMaterial(
      engine,
      new Vector4(0.5, 0.8, 0.2, 1.0),
      false,
      false
    );

    this.blueMaterial = createMeshMaterial(
      engine,
      new Vector4(0.3, 0.5, 1.0, 1.0),
      false,
      false
    );

    this.bgMaterial = createMeshMaterial(
      engine,
      new Vector4(1, 1, 1, 0.2),
      true,
      true
    );

    this.darkMaterial = createMeshMaterial(
      engine,
      new Vector4(0.5, 0.5, 0.5, 0.5),
      false,
      true
    );

    this.axisMesh = PrimitiveMesh.createCylinder(
      engine,
      0.12,
      0.12,
      this.axisLength
    );
    this.endMesh = createCircleMesh(engine, this.endRadius);
    this.endInnerMesh = createCircleMesh(engine, this.endRadius - 0.24);
    this.bgMesh = createCircleMesh(engine, this.radius, 144);

    this.xRotateVector = new Vector3(0, 0, 90);
    this.yRotateVector = new Vector3(0, 90, 0);
    this.zRotateVector = new Vector3(90, 0, 0);

    this.xTranslateVector = new Vector3(utils.axisLength * 0.5, 0, 0);
    this.yTranslateVector = new Vector3(0, utils.axisLength * 0.5, 0);
    this.zTranslateVector = new Vector3(0, 0, utils.axisLength * 0.5);

    this.xEndTranslateVector = new Vector3(utils.endDist, 0, 0);
    this.yEndTranslateVector = new Vector3(0, utils.endDist, 0);
    this.zEndTranslateVector = new Vector3(0, 0, utils.endDist);
  }
}

export const utils = new Utils();
