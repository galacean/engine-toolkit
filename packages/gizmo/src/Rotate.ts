import { Camera, Entity, Matrix, MeshRenderer, Quaternion, Ray, Vector3 } from "oasis-engine";
import { Axis } from "./Axis";
import { Utils } from "./Utils";
import { GizmoComponent, AxisProps, axisVector, axisPlane, axisType } from "./Type";
import { Group } from "./Group";
import { GizmoMesh } from "./GizmoMesh";
import { State } from "./enums/GizmoState";

/** @internal */
export class RotateControl extends GizmoComponent {
  type: State = State.rotate;
  private _group: Group;
  private _camera: Camera;

  private _rotateAxisComponent: Array<Axis> = [];
  private _rotateControlMap: Array<AxisProps> = [];

  private _gizmoRotateHelperEntity: Entity;

  private _tempMatrix: Matrix = new Matrix();
  private _axisX: Entity;
  private _axisY: Entity;
  private _axisZ: Entity;
  private _axisXHelper: Entity;
  private _axisYHelper: Entity;
  private _axisZHelper: Entity;

  private _isModified: boolean = false;

  private _startLineHelperEntity: Entity;
  private _startLineMesh = GizmoMesh.createLine(this.engine, [new Vector3(0, 0, 0), new Vector3(0, 0, 0)]);
  private _endLineHelperEntity: Entity;

  private _endLineMesh = GizmoMesh.createLine(this.engine, [new Vector3(0, 0, 0), new Vector3(0, 0, 0)]);

  private _rotateHelperPlaneEntity: Entity;
  private _rotateHelperPlaneMesh = GizmoMesh.createCircle(this.engine);

  private _selectedAxis: axisType;
  private _startScale: Vector3 = new Vector3();
  private _startQuat: Quaternion = new Quaternion();
  private _startTranslate: Vector3 = new Vector3();
  private _currQuat: Quaternion = new Quaternion();
  private _startMatrix: Matrix = new Matrix();
  private _startInvMatrix: Matrix = new Matrix();

  private _startPointUnit: Vector3 = new Vector3();
  private _currPointUnit: Vector3 = new Vector3();

  private _tempVec: Vector3 = new Vector3();
  private _tempQuat: Quaternion = new Quaternion();

  private _cameraPos: Vector3 = new Vector3();

  private _previousRad: number = 0;
  private _finalRad: number = 0;

  constructor(entity: Entity) {
    super(entity);
    this._initAxis();
    this._createAxis(entity);
  }

  /** init axis geometry */
  private _initAxis(): void {
    this._rotateControlMap = [
      {
        name: "x",
        axisMesh: [Utils.axisXTorusMesh],
        axisMaterial: Utils.redArcMaterial,
        axisHelperMesh: [Utils.axisHelpertorusMesh],
        axisHelperMaterial: Utils.invisibleMaterialRotate,
        axisRotation: [new Vector3(0, 90, 90)],
        axisTranslation: [new Vector3(0, 0, 0)]
      },
      {
        name: "y",
        axisMesh: [Utils.axisYTorusMesh],
        axisMaterial: Utils.greenArcMaterial,
        axisHelperMesh: [Utils.axisHelpertorusMesh],
        axisHelperMaterial: Utils.invisibleMaterialRotate,
        axisRotation: [new Vector3(90, 0, 0)],
        axisTranslation: [new Vector3(0, 0, 0)]
      },
      {
        name: "z",
        axisMesh: [Utils.axisZTorusMesh],
        axisMaterial: Utils.blueArcMaterial,
        axisHelperMesh: [Utils.axisHelpertorusMesh],
        axisHelperMaterial: Utils.invisibleMaterialRotate,
        axisRotation: [new Vector3(0, 0, -90)],
        axisTranslation: [new Vector3(0, 0, 0)]
      }
    ];
  }

  private _createAxis(entity: Entity): void {
    // visible gizmo entity
    this.gizmoEntity = entity.createChild("visible");
    this.gizmoHelperEntity = entity.createChild("invisible");

    this._axisX = this.gizmoEntity.createChild("x");
    this._axisY = this.gizmoEntity.createChild("y");
    this._axisZ = this.gizmoEntity.createChild("z");

    this._rotateAxisComponent = [
      this._axisX.addComponent(Axis),
      this._axisY.addComponent(Axis),
      this._axisZ.addComponent(Axis)
    ];

    for (let i = 0; i < this._rotateControlMap.length; i++) {
      const currentComponent = this._rotateAxisComponent[i];
      const currentGeometry = this._rotateControlMap[i];

      currentComponent.initAxis(currentGeometry);
    }
    const axisHelpers = this.gizmoHelperEntity.children;
    this._axisXHelper = axisHelpers[0];
    this._axisYHelper = axisHelpers[1];
    this._axisZHelper = axisHelpers[2];

    // rotate gizmo in-process debug helper entity
    this._gizmoRotateHelperEntity = entity.createChild("helper");

    // rotate start line
    this._startLineHelperEntity = this._gizmoRotateHelperEntity.createChild("lineHelperS");
    const startHelperRenderer = this._startLineHelperEntity.addComponent(MeshRenderer);
    startHelperRenderer.mesh = this._startLineMesh;
    startHelperRenderer.setMaterial(Utils.yellowMaterial);

    // rotate end line
    this._endLineHelperEntity = this._gizmoRotateHelperEntity.createChild("lineHelperE");
    const endHelperRenderer = this._endLineHelperEntity.addComponent(MeshRenderer);
    endHelperRenderer.mesh = this._endLineMesh;
    endHelperRenderer.setMaterial(Utils.yellowMaterial);

    // rotate plane
    this._rotateHelperPlaneEntity = this._gizmoRotateHelperEntity.createChild("rotateHelperPlane");
    const planeHelperRenderer = this._rotateHelperPlaneEntity.addComponent(MeshRenderer);
    planeHelperRenderer.mesh = this._rotateHelperPlaneMesh;
    // @ts-ignore
    this._rotateHelperPlaneMesh._enableVAO = false;
    planeHelperRenderer.setMaterial(Utils.rotatePlaneMaterial);
    this._rotateHelperPlaneEntity.isActive = false;
  }

  init(camera: Camera, group: Group): void {
    this._camera = camera;
    this._group = group;
  }

  onHoverStart(axisName: string): void {
    this._selectedAxis = axisType[axisName];
    // high light when mouse enter
    const currEntity = this.gizmoEntity.findByName(axisName);
    const currComponent = currEntity.getComponent(Axis);
    currComponent.highLight && currComponent.highLight();
  }

  onHoverEnd(): void {
    // unlight when mouse leave
    const currEntity = this.gizmoEntity.findByName(axisType[this._selectedAxis]);
    const currComponent = currEntity.getComponent(Axis);
    currComponent.unLight && currComponent.unLight();
    this._selectedAxis = null;
  }

  onMoveStart(ray: Ray, axisName: string): void {
    this._selectedAxis = axisType[axisName];

    const { _group, _startPointUnit: startP } = this;
    _group.getWorldMatrix(this._startMatrix);
    this._startMatrix.decompose(this._startTranslate, this._startQuat, this._startScale);
    Matrix.invert(this._startMatrix, this._startInvMatrix);

    this._calRayIntersection(ray, startP);
    this._setAxisSelected(this._selectedAxis, true);

    GizmoMesh.updateLine(this._startLineMesh, [new Vector3(0, 0, 0), startP]);
    GizmoMesh.updateLine(this._endLineMesh, [new Vector3(0, 0, 0), startP]);
    GizmoMesh.updateCircle(this._rotateHelperPlaneMesh, startP, axisVector[axisName], 0);

    const s = this._getGizmoScale();
    this._startMatrix.scale(this._tempVec.set(s, s, s));
    this.gizmoEntity.transform.worldMatrix = this._startMatrix;
    this.gizmoHelperEntity.transform.worldMatrix = this._startMatrix;
    this._gizmoRotateHelperEntity.transform.worldMatrix = this._startMatrix;
    this._startLineHelperEntity.isActive = true;
    this._endLineHelperEntity.isActive = true;
    this._rotateHelperPlaneEntity.isActive = true;
    this._startLineHelperEntity.transform.setRotation(0, 0, 0);
    this._endLineHelperEntity.transform.setRotation(0, 0, 0);
    this._rotateHelperPlaneEntity.transform.setRotation(0, 0, 0);
  }

  onMove(ray: Ray): void {
    const { _startPointUnit: startP, _currPointUnit: currP } = this;
    const localAxis = axisVector[this._selectedAxis];

    this._calRayIntersection(ray, currP);
    const rad = this._getFinalRad(startP, currP, localAxis);
    GizmoMesh.updateCircle(this._rotateHelperPlaneMesh, startP, localAxis, rad);

    this._currQuat.copyFrom(this._startQuat).rotateAxisAngle(localAxis, rad);
    const { _tempMatrix: mat } = this;
    Matrix.affineTransformation(this._startScale, this._currQuat, this._startTranslate, mat);
    this._group.setWorldMatrix(mat);

    const d = (rad / Math.PI) * 180;
    this._endLineHelperEntity.transform.setRotation(d * localAxis.x, d * localAxis.y, d * localAxis.z);
  }

  onMoveEnd(): void {
    this._finalRad = 0;
    this._previousRad = 0;
    // recover axis color
    this._setAxisSelected(this._selectedAxis, false);
    // recover arc line
    const axisMesh = this._rotateControlMap[this._selectedAxis].axisMesh[0];
    GizmoMesh.updateCircleTube(axisMesh, Math.PI);
    // hide helper entity
    this._endLineHelperEntity.isActive = false;
    this._startLineHelperEntity.isActive = false;
    this._rotateHelperPlaneEntity.isActive = false;
  }

  onUpdate(isModified: boolean = false): void {
    this._group.getWorldMatrix(this._tempMatrix);

    this._isModified = isModified;
    const s = this._getGizmoScale();
    this.gizmoEntity.transform.worldMatrix = this.gizmoHelperEntity.transform.worldMatrix = this._tempMatrix.scale(
      this._tempVec.set(s, s, s)
    );

    this._updateAxisTransform();
  }

  private _setAxisSelected(axis: axisType, isSelected: boolean): void {
    const axisMesh = this._rotateControlMap[axis].axisMesh[0];
    GizmoMesh.updateCircleTube(axisMesh, 2 * Math.PI);
    const entityArray = this.gizmoEntity.children;
    for (let i = 0; i < entityArray.length; i++) {
      const currEntity = entityArray[i];
      const currComponent = currEntity.getComponent(Axis);
      if (axisType[currEntity.name] === axis) {
        if (isSelected) {
          currComponent.yellow && currComponent.yellow();
        } else {
          currComponent.recover && currComponent.recover();
        }
      }
    }
  }

  private _calRayIntersection(ray: Ray, out: Vector3): void {
    // transform ray to local space
    const worldToLocal = this._startInvMatrix;
    Vector3.transformCoordinate(ray.origin, worldToLocal, ray.origin);
    Vector3.transformNormal(ray.direction, worldToLocal, ray.direction);
    ray.getPoint(ray.intersectPlane(axisPlane[this._selectedAxis]), out);
    out.normalize().scale(Utils.rotateCircleRadius);
  }

  private _getFinalRad(p1: Vector3, p2: Vector3, rotateAxis: Vector3): number {
    const dot = Vector3.dot(p1, p2);
    Vector3.cross(p1, p2, this._tempVec);
    const direction = Vector3.dot(this._tempVec, rotateAxis);
    const currentRad = Math.sign(direction) * Math.acos(dot / Utils.rotateCircleRadius ** 2);
    const incrementRad = currentRad - this._previousRad;
    if (this._previousRad * currentRad < 0) {
      Math.abs(currentRad) < Math.PI / 2
        ? (this._finalRad += incrementRad)
        : (this._finalRad += -Math.sign(incrementRad) * (2 * Math.PI - Math.abs(incrementRad)));
    } else {
      this._finalRad += incrementRad;
    }
    this._previousRad = currentRad;
    return this._finalRad;
  }

  private _getGizmoScale(): number {
    const cameraPosition = this._camera.entity.transform.worldPosition;
    this._group.getWorldPosition(this._tempVec);
    return this._isModified
      ? Vector3.distance(cameraPosition, this._tempVec) * Utils.scaleFactor * 0.8
      : Vector3.distance(cameraPosition, this._tempVec) * Utils.scaleFactor;
  }

  private _updateAxisTransform(): void {
    this._cameraPos.copyFrom(this._camera.entity.transform.position);
    this._tempMatrix.getRotation(this._tempQuat);

    const { _tempQuat: tempQuat } = this;

    Quaternion.invert(tempQuat, tempQuat);
    Vector3.transformByQuat(this._cameraPos, tempQuat, this._cameraPos);

    Quaternion.rotationX(-Math.atan2(this._cameraPos.y, this._cameraPos.z), tempQuat);
    this._axisX.transform.rotationQuaternion = tempQuat;
    this._axisXHelper.transform.rotationQuaternion = tempQuat;

    Quaternion.rotationY(Math.atan2(this._cameraPos.x, this._cameraPos.z), tempQuat);
    this._axisY.transform.rotationQuaternion = tempQuat;
    this._axisYHelper.transform.rotationQuaternion = tempQuat;

    Quaternion.rotationZ(Math.atan2(this._cameraPos.y, this._cameraPos.x), tempQuat);
    this._axisZ.transform.rotationQuaternion = tempQuat;
    this._axisZHelper.transform.rotationQuaternion = tempQuat;
  }
}
