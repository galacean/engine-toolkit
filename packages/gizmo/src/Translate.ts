import { Camera, Component, Entity, Plane, Ray, Vector3, Matrix } from "oasis-engine";

import { Axis } from "./Axis";
import { Group } from "./Group";
import { GizmoComponent, AxisProps, axisVector, axisIndices } from "./Type";
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
  private _startPosition: Vector3 = new Vector3();
  private _startPoint: Vector3 = new Vector3();
  private _movePoint = new Vector3();
  private _plane: Plane = new Plane();

  private _tempVec: Vector3 = new Vector3();
  private _tempVec1: Vector3 = new Vector3();
  private _tempVec2: Vector3 = new Vector3();
  private _tempMat: Matrix = new Matrix();

  private _planePoint1: Vector3 = new Vector3();
  private _planePoint2: Vector3 = new Vector3();
  private _planePoint3: Vector3 = new Vector3();

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
    this._group.getWorldPosition(this._startPosition);

    // get start point
    this._getHitPlane();
    ray.getPoint(ray.intersectPlane(this._plane), this._startPoint);

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
    // get move point
    const tempDist = ray.intersectPlane(this._plane);
    ray.getPoint(tempDist, this._movePoint);

    // align movement
    const { _tempMat: groupWorldMat } = this;
    if (this._group.getWorldMatrix(groupWorldMat)) {
      const { elements: e } = groupWorldMat;
      const trans = this._addWithAxis();
      (e[12] = trans.x), (e[13] = trans.y), (e[14] = trans.z);
      this._group.setWorldMatrix(groupWorldMat);
    }
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
    const { _planePoint1, _planePoint2, _planePoint3, _tempMat } = this;
    this._group.getWorldMatrix(_tempMat);
    this._group.getWorldPosition(_planePoint1);

    // get endPoint for plane
    const currentAxis = axisVector[this._selectedAxisName];
    Vector3.transformToVec3(currentAxis, _tempMat, _planePoint2);

    // get topPoint for plane
    const cameraPos = this._camera.entity.transform.worldPosition;
    Vector3.subtract(_planePoint2, _planePoint1, this._tempVec);
    Vector3.subtract(cameraPos, _planePoint1, this._tempVec1);
    Vector3.cross(this._tempVec, this._tempVec1, this._tempVec2);
    Vector3.add(_planePoint1, this._tempVec2, _planePoint3);

    // get the hit plane
    Plane.fromPoints(_planePoint3, _planePoint1, _planePoint2, this._plane);
  }

  /** calculate movement */
  private _addWithAxis(): Vector3 {
    const { _tempVec, _tempVec1, _tempVec2, _tempMat } = this;
    Vector3.subtract(this._movePoint, this._startPoint, _tempVec);
    const currentAxisIndices = axisIndices[this._selectedAxisName];
    _tempVec1.set(0, 0, 0);
    this._group.getWorldMatrix(_tempMat);
    for (let i = currentAxisIndices.length - 1; i >= 0; i--) {
      const elementIndex = currentAxisIndices[i];
      const currentAxis = axisVector[elementIndex];
      Vector3.transformNormal(currentAxis, _tempMat, _tempVec2);
      // get move distance along this axis
      const moveDist = Vector3.dot(_tempVec, _tempVec2);
      _tempVec2.normalize().scale(moveDist);
      _tempVec1.add(_tempVec2);
    }
    Vector3.add(this._startPosition, _tempVec1, _tempVec2);
    return _tempVec2;
  }
}
