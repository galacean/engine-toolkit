import { Camera, Component, Entity, Plane, Quaternion, Ray, Vector3 } from "oasis-engine";

import { Axis } from "./Axis";
import { GizmoComponent, AxisProps, axisVector, axisIndices } from "./Type";
import { utils } from "./Utils";

  /** @internal */
export class TranslateControl extends Component implements GizmoComponent {
  gizmoEntity: Entity;
  gizmoHelperEntity: Entity;
  private _camera: Camera = null;
  private _selectedEntity: Entity = null;
  private _isGlobalOrient = true;
  private _translateAxisComponent: { x: Axis; y: Axis; z: Axis; xy: Axis; xz: Axis; yz: Axis };
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
  private _entityQuaternion: Quaternion = new Quaternion();
  private _startPoint: Vector3 = new Vector3();
  private _movePoint = new Vector3();
  private _plane: Plane = new Plane();

  private _tempVec: Vector3 = new Vector3();
  private _tempVec1: Vector3 = new Vector3();
  private _tempVec2: Vector3 = new Vector3();
  private _tempVec3: Vector3 = new Vector3();
  private _endPoint: Vector3 = new Vector3();
  private _topPoint: Vector3 = new Vector3();

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

  onSelected(entity: Entity) {
    this._selectedEntity = entity;
    this._entityQuaternion = entity.transform.rotationQuaternion.clone();
    this.entity.transform.rotationQuaternion = this._entityQuaternion;
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
    this._startPosition = this._selectedEntity.transform.worldPosition.clone();

    // get start point
    this._getHitPlane();
    const tempDist = ray.intersectPlane(this._plane);
    ray.getPoint(tempDist, this._startPoint);

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
    this._selectedEntity.transform.worldPosition = this._addWithAxis();
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

  toggleOrientation(isGlobalOrient: boolean) {
    this._isGlobalOrient = isGlobalOrient;

    this.entity.transform.rotationQuaternion = isGlobalOrient
      ? new Quaternion(0, 0, 0, 1)
      : this._selectedEntity.transform.rotationQuaternion;
    this._entityQuaternion = isGlobalOrient
      ? new Quaternion(0, 0, 0, 1)
      : this._selectedEntity.transform.rotationQuaternion;
  }

  private _getHitPlane() {
    // get endPoint for plane
    const currentAxis = axisVector[this._selectedAxisName];
    Vector3.transformByQuat(currentAxis, this._entityQuaternion, this._tempVec3);
    Vector3.transformToVec3(this._tempVec3, this._selectedEntity.transform.worldMatrix, this._endPoint);

    // get topPoint for plane
    const currentWorldPos = this._selectedEntity.transform.worldPosition;
    const cameraPos = this._camera.entity.transform.worldPosition;
    Vector3.subtract(this._endPoint, currentWorldPos, this._tempVec);
    Vector3.subtract(cameraPos, currentWorldPos, this._tempVec1);
    Vector3.cross(this._tempVec, this._tempVec1, this._tempVec2);
    Vector3.add(currentWorldPos, this._tempVec2, this._topPoint);

    // get the hit plane
    Plane.fromPoints(this._topPoint, currentWorldPos, this._endPoint, this._plane);
  }

  /** calculate movement */
  private _addWithAxis(): Vector3 {
    Vector3.subtract(this._movePoint, this._startPoint, this._tempVec);

    const currentAxisIndices = axisIndices[this._selectedAxisName];
    let i = currentAxisIndices.length - 1;
    const c = new Vector3();
    while (i >= 0) {
      const elementIndex = currentAxisIndices[i];
      const currentAxis = axisVector[elementIndex];
      const currentRotateAxis = new Vector3();
      Vector3.transformByQuat(currentAxis, this._entityQuaternion, currentRotateAxis);
      // get move distance along this axis
      const moveDist = Vector3.dot(this._tempVec, currentRotateAxis);
      this._tempVec1 = currentRotateAxis.clone();
      // get move vector
      this._tempVec1.scale(moveDist);
      Vector3.add(c, this._tempVec1, c);
      i--;
    }
    Vector3.add(this._startPosition, c, this._tempVec2);
    return this._tempVec2;
  }
}
