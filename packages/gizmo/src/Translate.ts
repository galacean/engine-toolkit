import { Camera, Entity, Plane, Ray, Vector3, Matrix } from "oasis-engine";

import { Axis } from "./Axis";
import { GizmoControls } from "./GizmoControls";
import { Group } from "./Group";
import { GizmoComponent, AxisProps, axisVector, axisPlane } from "./Type";
import { utils } from "./Utils";

/** @internal */
export class TranslateControl extends GizmoComponent {
  private _scale: number = 1;
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
  private _startInvMatrix: Matrix = new Matrix();
  private _startScale: number = 1;
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

  init(camera: Camera, group: Group) {
    this._camera = camera;
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
    Matrix.invert(this._startGroupMatrix, this._startInvMatrix);

    // get start scale
    this._startScale = this._scale;

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
    const currScale = this._scale;
    const { _tempMat: mat, _tempVec0: subVec, _startScale } = this;
    // 换算一下缩放，两次的缩放是不一样的，所以用原点计算
    subVec.x = this._currPoint.x - (this._startPoint.x / _startScale) * currScale;
    subVec.y = this._currPoint.y - (this._startPoint.y / _startScale) * currScale;
    subVec.z = this._currPoint.z - (this._startPoint.z / _startScale) * currScale;

    const localAxis = axisVector[this._selectedAxisName];
    mat.identity();
    mat.elements[12] = subVec.x * localAxis.x;
    mat.elements[13] = subVec.y * localAxis.y;
    mat.elements[14] = subVec.z * localAxis.z;
    // align movement
    Matrix.multiply(this._startGroupMatrix, mat, mat);
    // 更新组内所有 entity 的位置
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

  onGizmoRedraw() {
    const { _tempMat, _tempVec0 } = this;
    const cameraPosition = this._camera.entity.transform.worldPosition;
    this._group.getWorldMatrix(_tempMat);
    _tempVec0.set(_tempMat.elements[12], _tempMat.elements[13], _tempMat.elements[14]);
    const s = (this._scale = Vector3.distance(cameraPosition, _tempVec0) * GizmoControls._scaleFactor);
    this.gizmoEntity.transform.worldMatrix = _tempMat.scale(_tempVec0.set(s, s, s));
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

  private _getHitPlane() {
    switch (this._selectedAxisName) {
      case "x":
      case "y":
      case "z":
      case "xyz":
        const { _tempVec0: centerP, _tempVec1: crossP, _tempVec2: cameraP } = this;
        cameraP.copyFrom(this._camera.entity.transform.worldPosition);
        cameraP.transformToVec3(this._startInvMatrix);
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
