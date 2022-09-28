import { Camera, Entity, Plane, Ray, Vector3, Matrix } from "oasis-engine";

import { Axis } from "./Axis";
import { Utils } from "./Utils";
import { Group } from "./Group";
import { GizmoComponent, AxisProps, axisVector } from "./Type";
import { GizmoState } from "./enums/GizmoState";

/** @internal */
export class ScaleControl extends GizmoComponent {
  type: GizmoState = GizmoState.scale;
  private _camera: Camera;
  private _group: Group;
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

  init(camera: Camera, group: Group): void {
    this._camera = camera;
    this._group = group;
  }

  onHoverStart(axisName: string): void {
    this._selectedAxisName = axisName;
    const currEntity = this.gizmoEntity.findByName(axisName);
    const currComponent = currEntity.getComponent(Axis);
    currComponent?.highLight && currComponent.highLight();
  }

  onHoverEnd(): void {
    const currEntity = this.gizmoEntity.findByName(this._selectedAxisName);
    const currComponent = currEntity.getComponent(Axis);
    currComponent?.unLight && currComponent.unLight();
  }

  onMoveStart(ray: Ray, axisName: string): void {
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
    // transform ray to local space
    this._calRayIntersection(ray, this._currPoint);
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

  onMoveEnd(): void {
    const entityArray = this.gizmoEntity.children;
    for (let i = 0; i < entityArray.length; i++) {
      const currEntity = entityArray[i];
      const currComponent = currEntity.getComponent(Axis);
      currComponent?.recover && currComponent.recover();
    }
  }

  onGizmoRedraw(): void {
    const { _tempVec0, _tempMat } = this;
    const cameraPosition = this._camera.entity.transform.worldPosition;
    this._group.getWorldMatrix(_tempMat);
    const { elements: ele } = _tempMat;
    _tempVec0.set(ele[12], ele[13], ele[14]);
    const s = Vector3.distance(cameraPosition, _tempVec0) * Utils.scaleFactor;
    const sx = s / Math.sqrt(ele[0] ** 2 + ele[1] ** 2 + ele[2] ** 2);
    const sy = s / Math.sqrt(ele[4] ** 2 + ele[5] ** 2 + ele[6] ** 2);
    const sz = s / Math.sqrt(ele[8] ** 2 + ele[9] ** 2 + ele[10] ** 2);
    this.entity.transform.worldMatrix = this._tempMat.scale(this._tempVec0.set(sx, sy, sz));
  }

  private _initAxis(): void {
    this._scaleControlMap = {
      x: {
        name: "x",
        axisMesh: [Utils.lineMeshShort, Utils.axisEndCubeMesh, Utils.axisEndCubeMesh],
        axisMaterial: Utils.greenMaterial,
        axisHelperMesh: [Utils.axisHelperLineMesh],
        axisRotation: [new Vector3(0, 0, -90), new Vector3(0, 0, -90), new Vector3(0, 0, 90)],
        axisTranslation: [new Vector3(0, 0, 0), new Vector3(1.5, 0, 0), new Vector3(-1.5, 0, 0)]
      },
      y: {
        name: "y",
        axisMesh: [Utils.lineMeshShort, Utils.axisEndCubeMesh, Utils.axisEndCubeMesh],
        axisMaterial: Utils.blueMaterial,
        axisHelperMesh: [Utils.axisHelperLineMesh],
        axisRotation: [new Vector3(0, 90, 0), new Vector3(0, 0, 0), new Vector3(180, 0, 0)],
        axisTranslation: [new Vector3(0, 0, 0), new Vector3(0, 1.5, 0), new Vector3(0, -1.5, 0)]
      },
      z: {
        name: "z",
        axisMesh: [Utils.lineMeshShort, Utils.axisEndCubeMesh, Utils.axisEndCubeMesh],
        axisMaterial: Utils.redMaterial,
        axisHelperMesh: [Utils.axisHelperLineMesh],
        axisRotation: [new Vector3(0, 90, 90), new Vector3(0, 90, 90), new Vector3(0, -90, 90)],
        axisTranslation: [new Vector3(0, 0, 0), new Vector3(0, 0, 1.5), new Vector3(0, 0, -1.5)]
      },
      xyz: {
        name: "xyz",
        axisMesh: [Utils.axisCubeMesh],
        axisMaterial: Utils.greyMaterial,
        axisHelperMesh: [Utils.axisCubeMesh],
        axisRotation: [new Vector3(0, 0, 0)],
        axisTranslation: [new Vector3(0, 0, 0)],
        priority: 102
      }
    };
  }

  private _createAxis(entity: Entity): void {
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

  private _getHitPlane(): void {
    switch (this._selectedAxisName) {
      case "x":
      case "y":
      case "z":
      case "xyz":
        const { _tempVec0: centerP, _tempVec1: crossP, _tempVec2: cameraP } = this;
        cameraP.copyFrom(this._camera.entity.transform.worldPosition);
        cameraP.transformToVec3(this._startInvMatrix);
        const localAxis = axisVector[this._selectedAxisName];
        Vector3.cross(cameraP, localAxis, crossP);
        Plane.fromPoints(localAxis, centerP.set(0, 0, 0), crossP, this._plane);
        break;
      default:
        break;
    }
  }

  private _calRayIntersection(ray: Ray, out: Vector3): void {
    const worldToLocal = this._startInvMatrix;
    Vector3.transformCoordinate(ray.origin, worldToLocal, ray.origin);
    Vector3.transformNormal(ray.direction, worldToLocal, ray.direction);
    ray.getPoint(ray.intersectPlane(this._plane), out);
  }
}
