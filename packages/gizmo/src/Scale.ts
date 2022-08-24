import { Camera, Component, Entity, Plane, Ray, Vector3, Matrix } from "oasis-engine";

import { Axis } from "./Axis";
import { Group } from "./Group";
import { GizmoComponent, AxisProps, axisVector, axisPlane } from "./Type";
import { utils } from "./Utils";

/** @internal */
export class ScaleControl extends Component implements GizmoComponent {
  gizmoEntity: Entity;
  gizmoHelperEntity: Entity;
  private _camera: Camera;
  private _group: Group;
  // 可以控制缩放力度
  private _scaleFactor: number = 1;

  private _scaleAxisComponent: {
    x: Axis;
    y: Axis;
    z: Axis;
    xy: Axis;
    xz: Axis;
    yz: Axis;
    xyz: Axis;
  };
  private _scaleControlMap: {
    x: AxisProps;
    y: AxisProps;
    z: AxisProps;
    xy: AxisProps;
    xz: AxisProps;
    yz: AxisProps;
    xyz: AxisProps;
  };

  private _selectedAxisName: string;
  private _startGroupMatrix: Matrix = new Matrix();
  private _startGizmoMatrix: Matrix = new Matrix();
  private _startInvMatrix: Matrix = new Matrix();
  private _startPoint: Vector3 = new Vector3();
  private _factorVec: Vector3 = new Vector3();
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

  /** init axis geometry */
  private _initAxis() {
    this._scaleControlMap = {
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
  /** assemble axis */
  private _createAxis(entity: Entity) {
    this.gizmoEntity = entity.createChild("visible");
    this.gizmoHelperEntity = entity.createChild("invisible");
    const axisX = this.gizmoEntity.createChild("x");
    const axisY = this.gizmoEntity.createChild("y");
    const axisZ = this.gizmoEntity.createChild("z");
    const axisXY = this.gizmoEntity.createChild("xy");
    const axisXZ = this.gizmoEntity.createChild("xz");
    const axisYZ = this.gizmoEntity.createChild("yz");
    const axisXYZ = this.gizmoEntity.createChild("xyz");

    this._scaleAxisComponent = {
      x: axisX.addComponent(Axis),
      y: axisY.addComponent(Axis),
      z: axisZ.addComponent(Axis),
      xy: axisXY.addComponent(Axis),
      yz: axisYZ.addComponent(Axis),
      xz: axisXZ.addComponent(Axis),
      xyz: axisXYZ.addComponent(Axis)
    };

    this._scaleAxisComponent.x.initAxis(this._scaleControlMap.x);
    this._scaleAxisComponent.y.initAxis(this._scaleControlMap.y);
    this._scaleAxisComponent.z.initAxis(this._scaleControlMap.z);
    this._scaleAxisComponent.xy.initAxis(this._scaleControlMap.xy);
    this._scaleAxisComponent.yz.initAxis(this._scaleControlMap.yz);
    this._scaleAxisComponent.xz.initAxis(this._scaleControlMap.xz);
    this._scaleAxisComponent.xyz.initAxis(this._scaleControlMap.xyz);
  }

  initCamera(camera: Camera): void {
    this._camera = camera;
  }
  onSelected(value: Group) {
    this._group = value;
  }

  onHoverStart(axisName: string) {
    this._selectedAxisName = axisName;
    const currEntity = this.gizmoEntity.findByName(axisName);
    const currComponent = currEntity.getComponent(Axis);
    currComponent?.highLight && currComponent.highLight();
  }

  onHoverEnd() {
    const currEntity = this.gizmoEntity.findByName(this._selectedAxisName);
    const currComponent = currEntity.getComponent(Axis);
    currComponent?.unLight && currComponent.unLight();
  }

  onMoveStart(ray: Ray, axisName: string) {
    this._selectedAxisName = axisName;
    // get gizmo start worldPosition
    this._group.getWorldMatrix(this._startGroupMatrix);
    this._group.getNormalizedMatrix(this._startGizmoMatrix);
    Matrix.invert(this._startGizmoMatrix, this._startInvMatrix);
    const { _startPoint, _scaleFactor } = this;

    // get start point
    this._getHitPlane();
    this._calRayIntersection(ray, this._startPoint);
    const localAxis = axisVector[this._selectedAxisName];
    this._factorVec.set(
      _startPoint.x === 0 ? 0 : (_scaleFactor * localAxis.x) / _startPoint.x,
      _startPoint.y === 0 ? 0 : (_scaleFactor * localAxis.y) / _startPoint.y,
      _startPoint.z === 0 ? 0 : (_scaleFactor * localAxis.z) / _startPoint.z
    );

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
    // 计算局部射线与面的交点
    this._calRayIntersection(ray, this._currPoint);
    // 计算开始交点与当前交点的差，得到缩放比例
    const { _factorVec: factorVec, _tempVec0: scaleVec, _tempMat: mat } = this;
    Vector3.subtract(this._currPoint, this._startPoint, scaleVec);
    scaleVec.x = scaleVec.x * factorVec.x + 1;
    scaleVec.y = scaleVec.y * factorVec.y + 1;
    scaleVec.z = scaleVec.z * factorVec.z + 1;
    Matrix.scale(this._startGroupMatrix, scaleVec, mat);
    this._group.setWorldMatrix(mat);
  }

  onMoveEnd() {
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
