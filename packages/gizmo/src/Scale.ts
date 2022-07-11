import { Camera, Component, Entity, Plane, Ray, Vector3 } from "oasis-engine";
import { Axis } from "./Axis";
import { GizmoComponent, AxisProps, axisVector, axisIndices } from "./Type";
import { utils } from "./Utils";
export class ScaleControl extends Component implements GizmoComponent {
  private scaleAxisComponent: { x: Axis; y: Axis; z: Axis; xy: Axis; xz: Axis; yz: Axis; xyz: Axis };
  private currentAxisName: string;
  private startPoint: Vector3 = new Vector3();
  private startScale: Vector3 = new Vector3();
  private translateVector: Vector3 = new Vector3();
  private scaleControlMap: {
    x: AxisProps;
    y: AxisProps;
    z: AxisProps;
    xy: AxisProps;
    xz: AxisProps;
    yz: AxisProps;
    xyz: AxisProps;
  };
  private selectedEntity: Entity = null;
  public gizmoEntity: Entity;
  public gizmoHelperEntity: Entity;
  private movePoint = new Vector3();

  private _camera: Camera = null;
  private _plane: Plane = new Plane();
  private _tempVec: Vector3 = new Vector3();
  private _tempVec1: Vector3 = new Vector3();
  private _tempVec2: Vector3 = new Vector3();

  constructor(entity: Entity) {
    super(entity);
    this.initAxis();
    this.createAxis(entity);
  }

  initAxis() {
    this.scaleControlMap = {
      x: {
        name: "x",
        axisMesh: [utils.lineMeshShort, utils.axisEndCubeMesh, utils.axisEndCubeMesh],
        axisMaterial: utils.greenMaterial,
        axisHelperMesh: [utils.axisHelperLineMesh],
        axisRotation: [new Vector3(0, 0, -90), new Vector3(0, 0, -90), new Vector3(0, 0, 90)],
        axisTranslation: [new Vector3(0, 0, 0), new Vector3(1.5, 0, 0), new Vector3(-1.5, 0, 0)]
      },
      y: {
        name: "y",
        axisMesh: [utils.lineMeshShort, utils.axisEndCubeMesh, utils.axisEndCubeMesh],
        axisMaterial: utils.blueMaterial,
        axisHelperMesh: [utils.axisHelperLineMesh],
        axisRotation: [new Vector3(0, 90, 0), new Vector3(0, 0, 0), new Vector3(180, 0, 0)],
        axisTranslation: [new Vector3(0, 0, 0), new Vector3(0, 1.5, 0), new Vector3(0, -1.5, 0)]
      },
      z: {
        name: "z",
        axisMesh: [utils.lineMeshShort, utils.axisEndCubeMesh, utils.axisEndCubeMesh],
        axisMaterial: utils.redMaterial,
        axisHelperMesh: [utils.axisHelperLineMesh],
        axisRotation: [new Vector3(0, 90, 90), new Vector3(0, 90, 90), new Vector3(0, -90, 90)],
        axisTranslation: [new Vector3(0, 0, 0), new Vector3(0, 0, 1.5), new Vector3(0, 0, -1.5)]
      },
      xy: {
        name: "xy",
        axisMesh: [utils.axisPlaneMesh],
        axisMaterial: utils.lightRedMaterial,
        axisHelperMesh: [utils.axisHelperPlaneMesh],
        axisRotation: [new Vector3(0, 90, 90)],
        axisTranslation: [new Vector3(0.5, 0.5, 0)]
      },
      yz: {
        name: "yz",
        axisMesh: [utils.axisPlaneMesh],
        axisMaterial: utils.lightGreenMaterial,
        axisHelperMesh: [utils.axisHelperPlaneMesh],
        axisRotation: [new Vector3(90, 90, 0)],
        axisTranslation: [new Vector3(0, 0.5, 0.5)]
      },
      xz: {
        name: "xz",
        axisMesh: [utils.axisPlaneMesh],
        axisMaterial: utils.lightBlueMaterial,
        axisHelperMesh: [utils.axisHelperPlaneMesh],
        axisRotation: [new Vector3(0, 0, 0)],
        axisTranslation: [new Vector3(0.5, 0, 0.5)]
      },
      xyz: {
        name: "xyz",
        axisMesh: [utils.axisCubeMesh],
        axisMaterial: utils.greyMaterial,
        axisHelperMesh: [utils.axisCubeMesh],
        axisRotation: [new Vector3(0, 0, 0)],
        axisTranslation: [new Vector3(0, 0, 0)]
      }
    };
  }

  createAxis(entity: Entity) {
    this.gizmoEntity = entity.createChild("visible");
    this.gizmoHelperEntity = entity.createChild("invisible");
    const axisX = this.gizmoEntity.createChild("x");
    const axisY = this.gizmoEntity.createChild("y");
    const axisZ = this.gizmoEntity.createChild("z");
    const axisXY = this.gizmoEntity.createChild("xy");
    const axisXZ = this.gizmoEntity.createChild("xz");
    const axisYZ = this.gizmoEntity.createChild("yz");
    const axisXYZ = this.gizmoEntity.createChild("xyz");

    this.scaleAxisComponent = {
      x: axisX.addComponent(Axis),
      y: axisY.addComponent(Axis),
      z: axisZ.addComponent(Axis),
      xy: axisXY.addComponent(Axis),
      yz: axisYZ.addComponent(Axis),
      xz: axisXZ.addComponent(Axis),
      xyz: axisXYZ.addComponent(Axis)
    };

    this.scaleAxisComponent.x.initAxis(this.scaleControlMap.x);
    this.scaleAxisComponent.y.initAxis(this.scaleControlMap.y);
    this.scaleAxisComponent.z.initAxis(this.scaleControlMap.z);
    this.scaleAxisComponent.xy.initAxis(this.scaleControlMap.xy);
    this.scaleAxisComponent.yz.initAxis(this.scaleControlMap.yz);
    this.scaleAxisComponent.xz.initAxis(this.scaleControlMap.xz);
    this.scaleAxisComponent.xyz.initAxis(this.scaleControlMap.xyz);
  }

  initCamera(camera: Camera): void {
    this._camera = camera;
  }
  onSelected(entity: Entity) {
    this.selectedEntity = entity;
  }

  onHoverStart(axis: string) {
    this.currentAxisName = axis;
    const currEntity = this.gizmoEntity.findByName(axis);
    const currComponent = currEntity.getComponent(Axis);
    currComponent?.highLight && currComponent.highLight();
  }

  onHoverEnd() {
    const currEntity = this.gizmoEntity.findByName(this.currentAxisName);
    const currComponent = currEntity.getComponent(Axis);
    currComponent?.unLight && currComponent.unLight();
  }

  onMoveStart(ray: Ray, axis: string) {
    this.currentAxisName = axis;
    this.startScale = this.selectedEntity.transform.scale.clone();
    this.getHitPlane();

    let tempDist = ray.intersectPlane(this._plane);
    ray.getPoint(tempDist, this.startPoint);

    // 变色
    const entityArray = this.gizmoEntity.children;
    for (let i = 0; i < entityArray.length; i++) {
      const currEntity = entityArray[i];
      const currComponent = currEntity.getComponent(Axis);
      if (currEntity.name === this.currentAxisName) {
        currComponent?.yellow && currComponent.yellow();
      } else {
        currComponent?.gray && currComponent.gray();
      }
    }
  }
  onMove(ray: Ray): void {
    let tempDist = ray.intersectPlane(this._plane);
    ray.getPoint(tempDist, this.movePoint);

    Vector3.subtract(this.movePoint, this.startPoint, this.translateVector);
    // 增量
    const currScale = this.selectedEntity.transform.scale;
    this.selectedEntity.transform.scale = this.addWithAxis(this.currentAxisName, currScale);
  }

  onMoveEnd() {
    const entityArray = this.gizmoEntity.children;
    for (let i = 0; i < entityArray.length; i++) {
      const currEntity = entityArray[i];
      const currComponent = currEntity.getComponent(Axis);
      currComponent?.recover && currComponent.recover();
    }
  }

  addWithAxis(axis: string, out: Vector3): Vector3 {
    const currentAxisIndices = axisIndices[axis];
    let i = currentAxisIndices.length - 1;
    while (i >= 0) {
      const elementIndex = currentAxisIndices[i];
      out[elementIndex] = this.startScale[elementIndex] + this.translateVector[elementIndex];
      i--;
    }
    return out;
  }

  getHitPlane() {
    const currentAxis = axisVector[this.currentAxisName];
    const endPoint = new Vector3();
    Vector3.transformToVec3(currentAxis, this.selectedEntity.transform.worldMatrix, endPoint);
    const currentWorldPos = this.selectedEntity.transform.worldPosition;
    const cameraPos = this._camera.entity.transform.worldPosition;
    Vector3.subtract(endPoint, currentWorldPos, this._tempVec);
    Vector3.subtract(cameraPos, currentWorldPos, this._tempVec1);
    Vector3.cross(this._tempVec, this._tempVec1, this._tempVec2);
    const pointTop = new Vector3();
    Vector3.add(currentWorldPos, this._tempVec2, pointTop);
    Plane.fromPoints(pointTop, currentWorldPos, endPoint, this._plane);
  }
}
