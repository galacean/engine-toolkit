import { Camera, Entity, Plane, Ray, Vector3, Matrix } from "oasis-engine";

import { Axis } from "./Axis";
import { Utils } from "./Utils";
import { Group } from "./Group";
import { GizmoComponent, AxisProps, axisVector, axisPlane, axisType } from "./Type";
import { GizmoState } from "./enums/GizmoState";

/** @internal */
export class TranslateControl extends GizmoComponent {
  type: GizmoState = GizmoState.translate;
  private _scale: number = 1;
  private _camera: Camera;
  private _group: Group;
  private _translateAxisComponent: Array<Axis>;
  private _translateControlMap: Array<AxisProps>;

  private _selectedAxis: axisType;
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

  init(camera: Camera, group: Group): void {
    this._camera = camera;
    this._group = group;
  }

  onHoverStart(axisName: string): void {
    this._selectedAxis = axisType[axisName];
    // change color
    const currEntity = this.gizmoEntity.findByName(axisName);
    const currComponent = currEntity.getComponent(Axis);
    currComponent?.highLight && currComponent.highLight();
  }

  onHoverEnd(): void {
    // recover axis color
    const currEntity = this.gizmoEntity.findByName(axisType[this._selectedAxis]);
    const currComponent = currEntity.getComponent(Axis);
    currComponent?.unLight && currComponent.unLight();

    this._selectedAxis = null;
  }

  onMoveStart(ray: Ray, axisName: string): void {
    this._selectedAxis = axisType[axisName];
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
      if (axisType[currEntity.name] === this._selectedAxis) {
        currComponent?.yellow && currComponent.yellow();
      } else {
        currComponent?.gray && currComponent.gray();
      }
    }
  }

  onMove(ray: Ray): void {
    // transform ray to local space
    this._calRayIntersection(ray, this._currPoint);
    const currScale = this._scale;
    const { _tempMat: mat, _tempVec0: subVec, _startScale } = this;
    // eliminate the side effect of gizmo's scaling
    subVec.x = this._currPoint.x - (this._startPoint.x / _startScale) * currScale;
    subVec.y = this._currPoint.y - (this._startPoint.y / _startScale) * currScale;
    subVec.z = this._currPoint.z - (this._startPoint.z / _startScale) * currScale;

    const localAxis = axisVector[this._selectedAxis];
    mat.identity();
    mat.elements[12] = subVec.x * localAxis.x;
    mat.elements[13] = subVec.y * localAxis.y;
    mat.elements[14] = subVec.z * localAxis.z;

    Matrix.multiply(this._startGroupMatrix, mat, mat);
    this._group.setWorldMatrix(mat);
  }

  onMoveEnd(): void {
    // recover axis cover
    const entityArray = this.gizmoEntity.children;
    for (let i = 0; i < entityArray.length; i++) {
      const currEntity = entityArray[i];
      const currComponent = currEntity.getComponent(Axis);
      currComponent?.recover && currComponent.recover();
    }
  }

  onGizmoRedraw(): void {
    const { _tempMat, _tempVec0 } = this;
    const cameraPosition = this._camera.entity.transform.worldPosition;
    this._group.getWorldMatrix(_tempMat);
    _tempVec0.set(_tempMat.elements[12], _tempMat.elements[13], _tempMat.elements[14]);
    const s = (this._scale = Vector3.distance(cameraPosition, _tempVec0) * Utils.scaleFactor);
    this.gizmoEntity.transform.worldMatrix = this.gizmoHelperEntity.transform.worldMatrix = _tempMat.scale(
      _tempVec0.set(s, s, s)
    );
  }

  private _initAxis(): void {
    this._translateControlMap = [
      {
        name: "x",
        axisMesh: [Utils.lineMesh, Utils.axisArrowMesh, Utils.axisArrowMesh],
        axisMaterial: Utils.greenMaterial,
        axisHelperMesh: [Utils.axisHelperLineMesh],
        axisRotation: [new Vector3(0, 0, -90), new Vector3(0, 0, -90), new Vector3(0, 0, 90)],
        axisTranslation: [new Vector3(0, 0, 0), new Vector3(1.5, 0, 0), new Vector3(-1.5, 0, 0)]
      },
      {
        name: "y",
        axisMesh: [Utils.lineMesh, Utils.axisArrowMesh, Utils.axisArrowMesh],
        axisMaterial: Utils.blueMaterial,
        axisHelperMesh: [Utils.axisHelperLineMesh],
        axisRotation: [new Vector3(0, 90, 0), new Vector3(0, 0, 0), new Vector3(180, 0, 0)],
        axisTranslation: [new Vector3(0, 0, 0), new Vector3(0, 1.5, 0), new Vector3(0, -1.5, 0)]
      },
      {
        name: "z",
        axisMesh: [Utils.lineMesh, Utils.axisArrowMesh, Utils.axisArrowMesh],
        axisMaterial: Utils.redMaterial,
        axisHelperMesh: [Utils.axisHelperLineMesh],
        axisRotation: [new Vector3(0, 90, 90), new Vector3(0, 90, 90), new Vector3(0, -90, 90)],
        axisTranslation: [new Vector3(0, 0, 0), new Vector3(0, 0, 1.5), new Vector3(0, 0, -1.5)]
      },
      {
        name: "xy",
        axisMesh: [Utils.axisPlaneMesh],
        axisMaterial: Utils.lightRedMaterial,
        axisHelperMesh: [Utils.axisHelperPlaneMesh],
        axisRotation: [new Vector3(0, 90, 90)],
        axisTranslation: [new Vector3(0.5, 0.5, 0)]
      },
      {
        name: "yz",
        axisMesh: [Utils.axisPlaneMesh],
        axisMaterial: Utils.lightGreenMaterial,
        axisHelperMesh: [Utils.axisHelperPlaneMesh],
        axisRotation: [new Vector3(90, 90, 0)],
        axisTranslation: [new Vector3(0, 0.5, 0.5)]
      },
      {
        name: "xz",
        axisMesh: [Utils.axisPlaneMesh],
        axisMaterial: Utils.lightBlueMaterial,
        axisHelperMesh: [Utils.axisHelperPlaneMesh],
        axisRotation: [new Vector3(0, 0, 0)],
        axisTranslation: [new Vector3(0.5, 0, 0.5)]
      }
    ];
  }

  private _createAxis(entity: Entity): void {
    this.gizmoEntity = entity.createChild("visible");
    this.gizmoHelperEntity = entity.createChild("invisible");

    const axisX = this.gizmoEntity.createChild("x");
    const axisY = this.gizmoEntity.createChild("y");
    const axisZ = this.gizmoEntity.createChild("z");
    const axisXY = this.gizmoEntity.createChild("xy");
    const axisYZ = this.gizmoEntity.createChild("yz");
    const axisXZ = this.gizmoEntity.createChild("xz");

    this._translateAxisComponent = [
      axisX.addComponent(Axis),
      axisY.addComponent(Axis),
      axisZ.addComponent(Axis),
      axisXY.addComponent(Axis),
      axisYZ.addComponent(Axis),
      axisXZ.addComponent(Axis)
    ];

    for (let i = 0; i < this._translateControlMap.length; i++) {
      const currentComponent = this._translateAxisComponent[i];
      const currentGeometry = this._translateControlMap[i];

      currentComponent.initAxis(currentGeometry);
    }
  }

  private _getHitPlane(): void {
    switch (this._selectedAxis) {
      case axisType.x:
      case axisType.y:
      case axisType.z:
        const { _tempVec0: centerP, _tempVec1: crossP, _tempVec2: cameraP } = this;
        cameraP.copyFrom(this._camera.entity.transform.worldPosition);
        cameraP.transformToVec3(this._startInvMatrix);
        const localAxis = axisVector[this._selectedAxis];

        Vector3.cross(cameraP, localAxis, crossP);
        Plane.fromPoints(localAxis, centerP.set(0, 0, 0), crossP, this._plane);
        break;
      case axisType.xy:
      case axisType.yz:
      case axisType.xz:
        this._plane.copyFrom(axisPlane[this._selectedAxis]);
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
