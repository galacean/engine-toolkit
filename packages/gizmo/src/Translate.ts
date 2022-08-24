import { Camera, Component, Entity, Plane, Ray, Vector3, Matrix } from "oasis-engine";

import { Axis } from "./Axis";
import { Group } from "./Group";
import { GizmoComponent, AxisProps, axisVector, axisPlane } from "./Type";
import { utils } from "./Utils";

/** @internal */
export class TranslateControl extends Component implements GizmoComponent {
  gizmoEntity: Entity;
  gizmoHelperEntity: Entity;
  private _camera: Camera;
  private _group: Group;
  private _translateAxisComponent: {
    x: Axis;
    y: Axis;
    z: Axis;
    xy: Axis;
    xz: Axis;
    yz: Axis;
  };
  private _translateControlMap: {
    x: AxisProps;
    y: AxisProps;
    z: AxisProps;
    xy: AxisProps;
    xz: AxisProps;
    yz: AxisProps;
  };

  private _selectedAxisName: string;
  private _startGroupMatrix: Matrix = new Matrix();
  private _startGizmoMatrix: Matrix = new Matrix();
  private _startInvMatrix: Matrix = new Matrix();
  private _startPoint: Vector3 = new Vector3();
  private _currPoint = new Vector3();
  private _plane: Plane = new Plane();

  private _tempVec0: Vector3 = new Vector3();
  private _tempVec1: Vector3 = new Vector3();
  private _tempVec2: Vector3 = new Vector3();
  private _tempMat: Matrix = new Matrix();

  constructor(entity: Entity) {
    super(entity);
    this._initAxis();
    this._createAxis(entity);
  }

  private _initAxis() {
    this._translateControlMap = {
      x: {
        name: "x",
        axisMesh: [utils.lineMesh, utils.axisArrowMesh, utils.axisArrowMesh],
        axisMaterial: utils.greenMaterial,
        axisHelperMesh: [utils.axisHelperLineMesh],
        axisRotation: [new Vector3(0, 0, -90), new Vector3(0, 0, -90), new Vector3(0, 0, 90)],
        axisTranslation: [new Vector3(0, 0, 0), new Vector3(1.5, 0, 0), new Vector3(-1.5, 0, 0)]
      },
      y: {
        name: "y",
        axisMesh: [utils.lineMesh, utils.axisArrowMesh, utils.axisArrowMesh],
        axisMaterial: utils.blueMaterial,
        axisHelperMesh: [utils.axisHelperLineMesh],
        axisRotation: [new Vector3(0, 90, 0), new Vector3(0, 0, 0), new Vector3(180, 0, 0)],
        axisTranslation: [new Vector3(0, 0, 0), new Vector3(0, 1.5, 0), new Vector3(0, -1.5, 0)]
      },
      z: {
        name: "z",
        axisMesh: [utils.lineMesh, utils.axisArrowMesh, utils.axisArrowMesh],
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
      }
    };
  }

  private _createAxis(entity: Entity) {
    this.gizmoEntity = entity.createChild("visible");
    this.gizmoHelperEntity = entity.createChild("invisible");
    const axisX = this.gizmoEntity.createChild("x");
    const axisY = this.gizmoEntity.createChild("y");
    const axisZ = this.gizmoEntity.createChild("z");
    const axisXY = this.gizmoEntity.createChild("xy");
    const axisXZ = this.gizmoEntity.createChild("xz");
    const axisYZ = this.gizmoEntity.createChild("yz");

    this._translateAxisComponent = {
      x: axisX.addComponent(Axis),
      y: axisY.addComponent(Axis),
      z: axisZ.addComponent(Axis),
      xy: axisXY.addComponent(Axis),
      yz: axisYZ.addComponent(Axis),
      xz: axisXZ.addComponent(Axis)
    };

    this._translateAxisComponent.x.initAxis(this._translateControlMap.x);
    this._translateAxisComponent.y.initAxis(this._translateControlMap.y);
    this._translateAxisComponent.z.initAxis(this._translateControlMap.z);
    this._translateAxisComponent.xy.initAxis(this._translateControlMap.xy);
    this._translateAxisComponent.xz.initAxis(this._translateControlMap.xz);
    this._translateAxisComponent.yz.initAxis(this._translateControlMap.yz);
  }

  initCamera(camera: Camera): void {
    this._camera = camera;
  }

  onSelected(group: Group) {
    this._group = group;
  }

  onHoverStart(axisName: string) {
    this._selectedAxisName = axisName;
    // change color
    const currEntity = this.gizmoEntity.findByName(axisName);
    const currComponent = currEntity.getComponent(Axis);
    currComponent?.highLight && currComponent.highLight();
  }

  onHoverEnd() {
    // recover axis color
    const currEntity = this.gizmoEntity.findByName(this._selectedAxisName);
    const currComponent = currEntity.getComponent(Axis);
    currComponent?.unLight && currComponent.unLight();

    this._selectedAxisName = null;
  }

  onMoveStart(ray: Ray, axisName: string) {
    this._selectedAxisName = axisName;
    // get gizmo start worldPosition
    this._group.getWorldMatrix(this._startGroupMatrix);
    this._group.getNormalizedMatrix(this._startGizmoMatrix);
    Matrix.invert(this._startGizmoMatrix, this._startInvMatrix);

    // get start point
    this._getHitPlane();
    this._calRayIntersection(ray, this._startPoint);

    // change axis color
    const entityArray = this.gizmoEntity.children;
    for (let i = 0; i < entityArray.length; i++) {
      const currEntity = entityArray[i];
      const currComponent = currEntity.getComponent(Axis);
      if (currEntity.name === this._selectedAxisName) {
        currComponent?.yellow && currComponent.yellow();
      } else {
        currComponent?.gray && currComponent.gray();
      }
    }
  }
  onMove(ray: Ray): void {
    // 计算局部射线
    this._calRayIntersection(ray, this._currPoint);

    const { _tempMat: mat, _tempVec0: subVec } = this;
    Vector3.subtract(this._currPoint, this._startPoint, subVec);
    const localAxis = axisVector[this._selectedAxisName];
    mat.identity();
    mat.elements[12] = subVec.x * localAxis.x;
    mat.elements[13] = subVec.y * localAxis.y;
    mat.elements[14] = subVec.z * localAxis.z;
    // align movement
    Matrix.multiply(this._startGroupMatrix, mat, mat);
    this._group.setWorldMatrix(mat);
  }

  onMoveEnd() {
    // recover axis cover
    const entityArray = this.gizmoEntity.children;
    for (let i = 0; i < entityArray.length; i++) {
      const currEntity = entityArray[i];
      const currComponent = currEntity.getComponent(Axis);
      currComponent?.recover && currComponent.recover();
    }
  }

  private _getHitPlane() {
    switch (this._selectedAxisName) {
      case "x":
      case "y":
      case "z":
      case "xyz":
        const { _tempVec0: centerP, _tempVec1: crossP, _tempVec2: cameraP } = this;
        // 原点 ---> 相机
        cameraP.copyFrom(this._camera.entity.transform.worldPosition);
        cameraP.transformToVec3(this._startInvMatrix);
        // 原点 ---> 缩放轴
        const localAxis = axisVector[this._selectedAxisName];
        // 垂直于上方两个向量的 cross 向量
        Vector3.cross(cameraP, localAxis, crossP);
        Plane.fromPoints(localAxis, centerP.set(0, 0, 0), crossP, this._plane);
        break;
      case "xy":
      case "yz":
      case "xz":
        this._plane.copyFrom(axisPlane[this._selectedAxisName]);
        break;
      default:
        break;
    }
  }

  private _calRayIntersection(ray: Ray, out: Vector3) {
    // 将世界射线转为局部射线
    const worldToLocal = this._startInvMatrix;
    Vector3.transformCoordinate(ray.origin, worldToLocal, ray.origin);
    Vector3.transformNormal(ray.direction, worldToLocal, ray.direction);
    // 取与面的交点
    ray.getPoint(ray.intersectPlane(this._plane), out);
  }
}
