import {
  Camera,
  Component,
  Entity,
  Matrix,
  MeshRenderer,
  Quaternion,
  Ray,
  RenderQueueType,
  Vector3,
} from "oasis-engine";
import { Axis } from "./Axis";
import { utils } from "./Utils";
import { GizmoComponent, AxisProps, axisVector, axisPlane } from "./Type";
import { Group } from "./Group";
import { GizmoControls } from "./GizmoControls";
import { GizmoMesh } from "./GizmoMesh";

/** @internal */
export class RotateControl extends GizmoComponent {
  private _group: Group;
  private _camera: Camera;

  private rotateAxisComponent: { x: Axis; y: Axis; z: Axis };
  private rotateControlMap: {
    x: AxisProps;
    y: AxisProps;
    z: AxisProps;
  };

  private xArcLineMesh = utils.arcLineMesh;
  private yArcLineMesh = utils.arcLineMesh;
  private zArcLineMesh = utils.arcLineMesh;

  private arcLineMesh = {
    x: this.xArcLineMesh,
    y: this.yArcLineMesh,
    z: this.zArcLineMesh,
  };

  private _gizmoRotateHelperEntity: Entity;

  private _tempMatrix: Matrix = new Matrix();
  private _axisX: Entity;
  private _axisY: Entity;
  private _axisZ: Entity;

  private _startLineHelperEntity: Entity;
  private startLineMesh = GizmoMesh.createLine(this.engine, [
    new Vector3(0, 0, 0),
    new Vector3(0, 0, 0),
  ]);
  private _endLineHelperEntity: Entity;

  private endLineMesh = GizmoMesh.createLine(this.engine, [
    new Vector3(0, 0, 0),
    new Vector3(0, 0, 0),
  ]);

  private _rotateHelperPlaneEntity: Entity;
  private _rotateHelperPlaneMesh = GizmoMesh.createCircle(this.engine);

  private _selectedAxisName: string;
  private _startScale: Vector3 = new Vector3();
  private _startQuat: Quaternion = new Quaternion();
  private _startTranslate: Vector3 = new Vector3();
  private _currQuat: Quaternion = new Quaternion();
  private _startMatrix: Matrix = new Matrix();
  private _startInvMatrix: Matrix = new Matrix();

  private _startPointUnit: Vector3 = new Vector3();
  private _currPointUnit: Vector3 = new Vector3();

  private _tempVec: Vector3 = new Vector3();

  private _previousRad: number = 0;
  private _finalRad: number = 0;

  constructor(entity: Entity) {
    super(entity);
    this._initAxis();
    this._createAxis(entity);
  }

  /** init axis geometry */
  private _initAxis():void {
    this.rotateControlMap = {
      x: {
        name: "x",
        axisMesh: [this.arcLineMesh.x],
        axisMaterial: utils.redArcMaterial,
        axisHelperMesh: [utils.axisHelpertorusMesh],
        axisRotation: [new Vector3(0, 90, 90)],
        axisTranslation: [new Vector3(0, 0, 0)],
      },
      y: {
        name: "y",
        axisMesh: [this.arcLineMesh.y],
        axisMaterial: utils.greenArcMaterial,
        axisHelperMesh: [utils.axisHelpertorusMesh],
        axisRotation: [new Vector3(90, 0, 0)],
        axisTranslation: [new Vector3(0, 0, 0)],
      },
      z: {
        name: "z",
        axisMesh: [this.arcLineMesh.z],
        axisMaterial: utils.blueArcMaterial,
        axisHelperMesh: [utils.axisHelpertorusMesh],
        axisRotation: [new Vector3(0, 0, -90)],
        axisTranslation: [new Vector3(0, 0, 0)],
      },
    };
  }
  private _createAxis(entity: Entity):void {
    // visible gizmo entity
    this.gizmoEntity = entity.createChild("visible");
    this.gizmoHelperEntity = entity.createChild("invisible");

    this._axisX = this.gizmoEntity.createChild("x");
    this._axisY = this.gizmoEntity.createChild("y");
    this._axisZ = this.gizmoEntity.createChild("z");

    this.rotateAxisComponent = {
      x: this._axisX.addComponent(Axis),
      y: this._axisY.addComponent(Axis),
      z: this._axisZ.addComponent(Axis),
    };

    this.rotateAxisComponent.x.initAxis(this.rotateControlMap.x);
    this.rotateAxisComponent.y.initAxis(this.rotateControlMap.y);
    this.rotateAxisComponent.z.initAxis(this.rotateControlMap.z);

    // invisible gizmo entity
    this.rotateControlMap.x.axisMaterial.posCutOff = true;
    this.rotateControlMap.y.axisMaterial.posCutOff = true;
    this.rotateControlMap.z.axisMaterial.posCutOff = true;

    // rotate gizmo in-process debug helper entity
    this._gizmoRotateHelperEntity = entity.createChild("helper");

    // rotate start line
    this._startLineHelperEntity =
      this._gizmoRotateHelperEntity.createChild("lineHelperS");
    const startHelperRenderer =
      this._startLineHelperEntity.addComponent(MeshRenderer);
    startHelperRenderer.mesh = this.startLineMesh;
    startHelperRenderer.setMaterial(utils.yellowMaterial);

    // rotate end line
    this._endLineHelperEntity =
      this._gizmoRotateHelperEntity.createChild("lineHelperE");
    const endHelperRenderer =
      this._endLineHelperEntity.addComponent(MeshRenderer);
    endHelperRenderer.mesh = this.endLineMesh;
    endHelperRenderer.setMaterial(utils.yellowMaterial);

    // rotate plane
    this._rotateHelperPlaneEntity =
      this._gizmoRotateHelperEntity.createChild("rotateHelperPlane");
    const planeHelperRenderer =
      this._rotateHelperPlaneEntity.addComponent(MeshRenderer);
    planeHelperRenderer.mesh = this._rotateHelperPlaneMesh;
    // @ts-ignore
    this._rotateHelperPlaneMesh._enableVAO = false;

    planeHelperRenderer.setMaterial(utils.rotatePlaneMaterial);
    utils.rotatePlaneMaterial.renderState.renderQueueType = RenderQueueType.Transparent;
    this._rotateHelperPlaneEntity.isActive = false;
  }

  init(camera: Camera, group: Group):void {
    this._camera = camera;
    this._group = group;
  }

  onHoverStart(axisName: string):void {
    this._selectedAxisName = axisName;
    // high light when mouse enter
    const currEntity = this.gizmoEntity.findByName(axisName);
    const currComponent = currEntity.getComponent(Axis);
    currComponent?.highLight && currComponent.highLight();
  }

  onHoverEnd():void {
    // unlight when mouse leave
    const currEntity = this.gizmoEntity.findByName(this._selectedAxisName);
    const currComponent = currEntity.getComponent(Axis);
    currComponent?.unLight && currComponent.unLight();
    this._selectedAxisName = null;
  }

  onMoveStart(ray: Ray, axisName: string):void {
    this._selectedAxisName = axisName;
    const { _group, _startPointUnit: startP } = this;
    _group.getWorldMatrix(this._startMatrix);
    this._startMatrix.decompose(
      this._startTranslate,
      this._startQuat,
      this._startScale
    );
    Matrix.invert(this._startMatrix, this._startInvMatrix);
    this._calRayIntersection(ray, startP);
    this._setAxisSelected(axisName, true);
    GizmoMesh.updateLine(this.startLineMesh, [new Vector3(0, 0, 0), startP]);
    GizmoMesh.updateLine(this.endLineMesh, [new Vector3(0, 0, 0), startP]);

    GizmoMesh.updateCircle(
      this._rotateHelperPlaneMesh,
      startP,
      axisVector[axisName],
      0
    );

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
    const localAxis = axisVector[this._selectedAxisName];

    this._calRayIntersection(ray, currP);
    const rad = this._getFinalRad(startP, currP, localAxis);
    GizmoMesh.updateCircle(this._rotateHelperPlaneMesh, startP, localAxis, rad);

    this._currQuat.copyFrom(this._startQuat).rotateAxisAngle(localAxis, rad);
    const { _tempMatrix: mat } = this;
    Matrix.affineTransformation(
      this._startScale,
      this._currQuat,
      this._startTranslate,
      mat
    );
    this._group.setWorldMatrix(mat);

    const d = (rad / Math.PI) * 180;
    this._endLineHelperEntity.transform.setRotation(
      d * localAxis.x,
      d * localAxis.y,
      d * localAxis.z
    );
  }

  onMoveEnd():void {
    this._finalRad = 0;
    this._previousRad = 0;
    // recover axis color
    this._setAxisSelected(this._selectedAxisName, false);
    // recover arc line
    this.rotateControlMap[this._selectedAxisName].axisMaterial.posCutOff = true;
    // hide helper entity
    this._endLineHelperEntity.isActive = false;
    this._startLineHelperEntity.isActive = false;
    this._rotateHelperPlaneEntity.isActive = false;
  }

  onGizmoRedraw():void {
    this._group.getWorldMatrix(this._tempMatrix);
    const s = this._getGizmoScale();
    this.gizmoEntity.transform.worldMatrix =
      this.gizmoHelperEntity.transform.worldMatrix = this._tempMatrix.scale(
        this._tempVec.set(s, s, s)
      );
    this.gizmoHelperEntity;
  }

  private _setAxisSelected(axisName: string, isSelected: boolean):void {
    this.rotateControlMap[axisName].axisMaterial.posCutOff = !isSelected;
    const entityArray = this.gizmoEntity.children;
    for (let i = 0; i < entityArray.length; i++) {
      const currEntity = entityArray[i];
      const currComponent = currEntity.getComponent(Axis);
      if (currEntity.name === axisName) {
        if (isSelected) {
          currComponent?.yellow && currComponent.yellow();
        } else {
          currComponent?.recover && currComponent.recover();
        }
      }
    }
  }

  private _calRayIntersection(ray: Ray, out: Vector3):void {
    // transform ray to local space
    const worldToLocal = this._startInvMatrix;
    Vector3.transformCoordinate(ray.origin, worldToLocal, ray.origin);
    Vector3.transformNormal(ray.direction, worldToLocal, ray.direction);
    ray.getPoint(ray.intersectPlane(axisPlane[this._selectedAxisName]), out);
    out.normalize().scale(utils.rotateCircleRadius);
  }

  private _getFinalRad(p1: Vector3, p2: Vector3, rotateAxis: Vector3): number {
    const dot = Vector3.dot(p1, p2);
    Vector3.cross(p1, p2, this._tempVec);
    const direction = Vector3.dot(this._tempVec, rotateAxis);
    const currentRad =
      Math.sign(direction) * Math.acos(dot / utils.rotateCircleRadius ** 2);
    const incrementRad = currentRad - this._previousRad;
    if (this._previousRad * currentRad < 0) {
      Math.abs(currentRad) < Math.PI / 2
        ? (this._finalRad += incrementRad)
        : (this._finalRad +=
            -Math.sign(incrementRad) * (2 * Math.PI - Math.abs(incrementRad)));
    } else {
      this._finalRad += incrementRad;
    }
    this._previousRad = currentRad;
    return this._finalRad;
  }

  private _getGizmoScale(): number {
    const cameraPosition = this._camera.entity.transform.worldPosition;
    this._group.getWorldPosition(this._tempVec);
    return (
      Vector3.distance(cameraPosition, this._tempVec) *
      GizmoControls._scaleFactor
    );
  }
}
