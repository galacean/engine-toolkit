import { Camera, Component, Entity, Plane, Ray, Vector3, Matrix } from "oasis-engine";

import { Axis } from "./Axis";
import { GizmoControls } from "./GizmoControls";
import { Group } from "./Group";
import { GizmoComponent, AxisProps, axisVector, axisPlane } from "./Type";
import { utils } from "./Utils";

/** @internal */
export class ScaleControl extends GizmoComponent {
  private _camera: Camera;
  private _group: Group;
  // 可以控制缩放力度
  private _scaleFactor: number = 1;

  private _scaleAxisComponent: {
    x: Axis;
    y: Axis;
    z: Axis;
    xyz: Axis;
  };
  private _scaleControlMap: {
    x: AxisProps;
    y: AxisProps;
    z: AxisProps;
    xyz: AxisProps;
  };

  private _selectedAxisName: string;
  private _startGroupMatrix: Matrix = new Matrix();
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

  init(camera: Camera, group: Group) {
    this._camera = camera;
    this._group = group;
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
    Matrix.invert(this._startGroupMatrix, this._startInvMatrix);
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

    switch (this._selectedAxisName) {
      case "x":
      case "y":
      case "z":
      case "xyz":
        scaleVec.x = scaleVec.x * factorVec.x + 1;
        scaleVec.y = scaleVec.y * factorVec.y + 1;
        scaleVec.z = scaleVec.z * factorVec.z + 1;
        break;
    }

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

  onGizmoRedraw() {
    const { _tempVec0, _tempMat } = this;
    const cameraPosition = this._camera.entity.transform.worldPosition;
    this._group.getWorldMatrix(_tempMat);
    const { elements: ele } = _tempMat;
    _tempVec0.set(ele[12], ele[13], ele[14]);
    const s = Vector3.distance(cameraPosition, _tempVec0) * GizmoControls._scaleFactor;
    const sx = s / Math.sqrt(ele[0] ** 2 + ele[1] ** 2 + ele[2] ** 2);
    const sy = s / Math.sqrt(ele[4] ** 2 + ele[5] ** 2 + ele[6] ** 2);
    const sz = s / Math.sqrt(ele[8] ** 2 + ele[9] ** 2 + ele[10] ** 2);
    this.entity.transform.worldMatrix = this._tempMat.scale(this._tempVec0.set(sx, sy, sz));
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
      xyz: {
        name: "xyz",
        axisMesh: [utils.axisCubeMesh],
        axisMaterial: utils.greyMaterial,
        axisHelperMesh: [utils.axisCubeMesh],
        axisRotation: [new Vector3(0, 0, 0)],
        axisTranslation: [new Vector3(0, 0, 0)],
        priority: 102
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
    const axisXYZ = this.gizmoEntity.createChild("xyz");

    this._scaleAxisComponent = {
      x: axisX.addComponent(Axis),
      y: axisY.addComponent(Axis),
      z: axisZ.addComponent(Axis),
      xyz: axisXYZ.addComponent(Axis)
    };

    this._scaleAxisComponent.x.initAxis(this._scaleControlMap.x);
    this._scaleAxisComponent.y.initAxis(this._scaleControlMap.y);
    this._scaleAxisComponent.z.initAxis(this._scaleControlMap.z);
    this._scaleAxisComponent.xyz.initAxis(this._scaleControlMap.xyz);
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
