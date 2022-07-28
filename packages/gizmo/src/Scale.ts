import { Camera, Component, Entity, Plane, Quaternion, Ray, Vector3 } from "oasis-engine";

import { Axis } from "./Axis";
import { GizmoComponent, AxisProps, axisVector, axisIndices } from "./Type";
import { utils } from "./Utils";

  /** @internal */
  export class ScaleControl extends Component implements GizmoComponent {
  gizmoEntity: Entity;
  gizmoHelperEntity: Entity;
  private _camera: Camera = null;
  private _selectedEntity: Entity = null;

  private _scaleAxisComponent: { x: Axis; y: Axis; z: Axis; xy: Axis; xz: Axis; yz: Axis; xyz: Axis };
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
  private _startScale: Vector3 = new Vector3();
  private _startPoint: Vector3 = new Vector3();
  private _movePoint = new Vector3();
  private _plane: Plane = new Plane();

  private _tempVec: Vector3 = new Vector3();
  private _tempVec1: Vector3 = new Vector3();
  private _tempVec2: Vector3 = new Vector3();
  private _endPoint: Vector3 = new Vector3();
  private _topPoint: Vector3 = new Vector3();

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
  onSelected(entity: Entity) {
    this._selectedEntity = entity;
    this.entity.transform.rotationQuaternion = entity.transform.rotationQuaternion;
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
    this._startScale = this._selectedEntity.transform.scale.clone();

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
    this._selectedEntity.transform.scale = this._addWithAxis();
  }

  onMoveEnd() {
    const entityArray = this.gizmoEntity.children;
    for (let i = 0; i < entityArray.length; i++) {
      const currEntity = entityArray[i];
      const currComponent = currEntity.getComponent(Axis);
      currComponent?.recover && currComponent.recover();
    }
  }

  private _addWithAxis(): Vector3 {
    const out = this._selectedEntity.transform.scale;
    Vector3.subtract(this._movePoint, this._startPoint, this._tempVec);

    const currentAxisIndices = axisIndices[this._selectedAxisName];
    let i = currentAxisIndices.length - 1;
    while (i >= 0) {
      const elementIndex = currentAxisIndices[i];
      out[elementIndex] = this._startScale[elementIndex] + this._tempVec[elementIndex];
      i--;
    }
    return out;
  }

  private _getHitPlane() {
    // get endPoint for plane
    const currentAxis = axisVector[this._selectedAxisName];
    Vector3.transformToVec3(currentAxis, this._selectedEntity.transform.worldMatrix, this._endPoint);

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
}
