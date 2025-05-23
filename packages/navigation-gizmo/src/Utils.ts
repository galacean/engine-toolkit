import { Mesh, Engine, PrimitiveMesh, ModelMesh, Vector3 } from "@galacean/engine";
import { createCircleMesh } from "./CircleMesh";
import { PlainColorMaterial } from "@galacean/engine-toolkit-custom-material";

/** @internal */
export class Utils {
  public redMaterial: PlainColorMaterial;
  public greenMaterial: PlainColorMaterial;
  public blueMaterial: PlainColorMaterial;
  public bgMaterial: PlainColorMaterial;
  public greyMaterial: PlainColorMaterial;

  public axisMesh: Mesh;
  public endMesh: ModelMesh;
  public bgMesh: ModelMesh;

  public radius: number = 9.2;
  public endRadius: number = 1.6;
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

  constructor(engine: Engine) {
    const redMaterial = new PlainColorMaterial(engine);
    redMaterial.isTransparent = true;
    redMaterial.baseColor.set(1.0, 0.05087608817155679, 0.05087608817155679, 1.0);
    this.redMaterial = redMaterial;

    const greenMaterial = new PlainColorMaterial(engine);
    greenMaterial.isTransparent = true;
    greenMaterial.baseColor.set(0.21404114048223255, 0.6038273388553378, 0.033104766570885055, 1.0);
    this.greenMaterial = greenMaterial;

    const blueMaterial = new PlainColorMaterial(engine);
    blueMaterial.isTransparent = true;
    blueMaterial.baseColor.set(0.07323895587840543, 0.21404114048223255, 1.0, 1.0);
    this.blueMaterial = blueMaterial;

    const bgMaterial = new PlainColorMaterial(engine);
    bgMaterial.isTransparent = true;
    bgMaterial.baseColor.set(1, 1, 1, 0.1);
    this.bgMaterial = bgMaterial;

    const greyMaterial = new PlainColorMaterial(engine);
    greyMaterial.isTransparent = true;
    greyMaterial.baseColor.set(0.21404114048223255, 0.21404114048223255, 0.21404114048223255, 1);
    this.greyMaterial = greyMaterial;

    this.axisMesh = PrimitiveMesh.createCylinder(engine, 0.12, 0.12, this.axisLength);

    this.bgMesh = createCircleMesh(engine, this.radius, 144);
    this.endMesh = createCircleMesh(engine, this.endRadius - 0.2);

    this.xRotateVector = new Vector3(0, 0, 90);
    this.yRotateVector = new Vector3(0, 90, 0);
    this.zRotateVector = new Vector3(90, 0, 0);

    this.xTranslateVector = new Vector3(this.axisLength * 0.5, 0, 0);
    this.yTranslateVector = new Vector3(0, this.axisLength * 0.5, 0);
    this.zTranslateVector = new Vector3(0, 0, this.axisLength * 0.5);

    this.xEndTranslateVector = new Vector3(this.endDist, 0, 0);
    this.yEndTranslateVector = new Vector3(0, this.endDist, 0);
    this.zEndTranslateVector = new Vector3(0, 0, this.endDist);
  }
}
