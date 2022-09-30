import { Camera, Entity, Plane, Ray, Vector3, Matrix } from "oasis-engine";

import { Axis } from "./Axis";
import { Utils } from "./Utils";
import { Group } from "./Group";
import { GizmoComponent, AxisProps, axisVector, axisType } from "./Type";
import { Type } from "./enums/GizmoState";

/** @internal */
export class ScaleControl extends GizmoComponent {
  type: Type = Type.scale;
  private _camera: Camera;
  private _group: Group;
  private _scaleFactor: number = 1;
  private _scaleAxisComponent: Array<Axis> = [];
  private _scaleControlMap: Array<AxisProps> = [];

  private _selectedAxis: axisType;
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
    this._selectedAxis = axisType[axisName];
    const currEntity = this.gizmoEntity.findByName(axisName);
    const currComponent = currEntity.getComponent(Axis);
    currComponent.highLight && currComponent.highLight();
  }

  onHoverEnd(): void {
    const currEntity = this.gizmoEntity.findByName(axisType[this._selectedAxis]);
    const currComponent = currEntity.getComponent(Axis);
    currComponent.unLight && currComponent.unLight();
  }

  onMoveStart(ray: Ray, axisName: string): void {
    this._selectedAxis = axisType[axisName];
    // get gizmo start worldPosition
    this._group.getWorldMatrix(this._startGroupMatrix);
    Matrix.invert(this._startGroupMatrix, this._startInvMatrix);
    const { _startPoint, _scaleFactor } = this;

    // get start point
    this._getHitPlane();
    this._calRayIntersection(ray, this._startPoint);
    const localAxis = axisVector[this._selectedAxis];
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
      if (axisType[currEntity.name] === this._selectedAxis) {
        currComponent.yellow && currComponent.yellow();
      } else {
        currComponent.gray && currComponent.gray();
      }
    }
  }

  onMove(ray: Ray): void {
    // transform ray to local space
    this._calRayIntersection(ray, this._currPoint);
    const { _factorVec: factorVec, _tempVec0: scaleVec, _tempMat: mat } = this;
    Vector3.subtract(this._currPoint, this._startPoint, scaleVec);

    switch (this._selectedAxis) {
      case axisType.x:
      case axisType.y:
      case axisType.z:
        scaleVec.x = scaleVec.x * factorVec.x + 1;
        scaleVec.y = scaleVec.y * factorVec.y + 1;
        scaleVec.z = scaleVec.z * factorVec.z + 1;
        break;
      case axisType.xyz:
        const start = this._startPoint.length();
        const end = this._currPoint.length();

        scaleVec.x = end / start;
        scaleVec.y = end / start;
        scaleVec.z = end / start;
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
      currComponent.recover && currComponent.recover();
    }
  }

  onUpdate(isModified: boolean = false): void {
    const { _tempVec0, _tempMat } = this;
    const cameraPosition = this._camera.entity.transform.worldPosition;
    this._group.getWorldMatrix(_tempMat);
    const { elements: ele } = _tempMat;
    _tempVec0.set(ele[12], ele[13], ele[14]);

    const s = isModified
      ? Vector3.distance(cameraPosition, _tempVec0) * Utils.scaleFactor * 0.75
      : Vector3.distance(cameraPosition, _tempVec0) * Utils.scaleFactor;

    const sx = s / Math.sqrt(ele[0] ** 2 + ele[1] ** 2 + ele[2] ** 2);
    const sy = s / Math.sqrt(ele[4] ** 2 + ele[5] ** 2 + ele[6] ** 2);
    const sz = s / Math.sqrt(ele[8] ** 2 + ele[9] ** 2 + ele[10] ** 2);
    this.entity.transform.worldMatrix = this._tempMat.scale(this._tempVec0.set(sx, sy, sz));
  }

  private _initAxis(): void {
    this._scaleControlMap = [
      {
        name: "x",
        axisMesh: [Utils.lineMeshShort, Utils.axisEndCubeMesh],
        axisMaterial: Utils.greenMaterialScale,
        axisHelperMesh: [Utils.axisHelperLineMesh],
        axisHelperMaterial: Utils.invisibleMaterialScale,
        axisRotation: [new Vector3(0, 0, -90), new Vector3(0, 0, -90)],
        axisTranslation: [new Vector3(0.75, 0, 0), new Vector3(1.5, 0, 0)],
        priority: 102
      },
      {
        name: "y",
        axisMesh: [Utils.lineMeshShort, Utils.axisEndCubeMesh],
        axisMaterial: Utils.blueMaterialScale,
        axisHelperMesh: [Utils.axisHelperLineMesh],
        axisHelperMaterial: Utils.invisibleMaterialScale,
        axisRotation: [new Vector3(0, 90, 0), new Vector3(0, 0, 0)],
        axisTranslation: [new Vector3(0, 0.75, 0), new Vector3(0, 1.5, 0)],
        priority: 102
      },
      {
        name: "z",
        axisMesh: [Utils.lineMeshShort, Utils.axisEndCubeMesh],
        axisMaterial: Utils.redMaterialScale,
        axisHelperMesh: [Utils.axisHelperLineMesh],
        axisHelperMaterial: Utils.invisibleMaterialScale,
        axisRotation: [new Vector3(0, 90, 90), new Vector3(0, 90, 90)],
        axisTranslation: [new Vector3(0, 0, 0.75), new Vector3(0, 0, 1.5)],
        priority: 102
      },
      {
        name: "xyz",
        axisMesh: [Utils.axisCubeMesh],
        axisMaterial: Utils.greyMaterial,
        axisHelperMesh: [Utils.axisCubeMesh],
        axisHelperMaterial: Utils.invisibleMaterialScale,
        axisRotation: [new Vector3(0, 0, 0)],
        axisTranslation: [new Vector3(0, 0, 0)],
        priority: 105
      }
    ];
  }

  private _createAxis(entity: Entity): void {
    this.gizmoEntity = entity.createChild("visible");
    this.gizmoHelperEntity = entity.createChild("invisible");

    const axisX = this.gizmoEntity.createChild("x");
    const axisY = this.gizmoEntity.createChild("y");
    const axisZ = this.gizmoEntity.createChild("z");
    const axisXYZ = this.gizmoEntity.createChild("xyz");

    this._scaleAxisComponent = [
      axisX.addComponent(Axis),
      axisY.addComponent(Axis),
      axisZ.addComponent(Axis),
      axisXYZ.addComponent(Axis)
    ];

    for (let i = 0; i < this._scaleControlMap.length; i++) {
      const currentComponent = this._scaleAxisComponent[i];
      const currentGeometry = this._scaleControlMap[i];

      currentComponent.initAxis(currentGeometry);
    }
  }

  private _getHitPlane(): void {
    switch (this._selectedAxis) {
      case axisType.x:
      case axisType.y:
      case axisType.z:
      case axisType.xyz:
        const { _tempVec0: centerP, _tempVec1: crossP, _tempVec2: cameraP } = this;
        cameraP.copyFrom(this._camera.entity.transform.worldPosition);
        cameraP.transformToVec3(this._startInvMatrix);
        const localAxis = axisVector[this._selectedAxis];
        Vector3.cross(cameraP, localAxis, crossP);
        Plane.fromPoints(localAxis, centerP.set(0, 0, 0), crossP, this._plane);
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
