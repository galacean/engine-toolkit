import {
  Camera,
  Component,
  Entity,
  Matrix,
  MeshRenderer,
  Plane,
  Quaternion,
  Ray,
  RenderQueueType,
  Vector3
} from "oasis-engine";
import { Axis } from "./Axis";
import { ArcLineMesh } from "./ArcLineMesh";
import { CircleMesh } from "./CircleMesh";
import { LinesMesh } from "./LineMesh";
import { GizmoComponent, AxisProps, axisVector } from "./Type";
import { utils } from "./Utils";
import { Group } from "./Group";
import { GizmoMaterial } from "./GizmoMaterial";

/** @internal */
export class RotateControl extends Component implements GizmoComponent {
  gizmoEntity: Entity;
  gizmoHelperEntity: Entity;
  private _group: Group;

  private rotateAxisComponent: { x: Axis; y: Axis; z: Axis };
  private rotateControlMap: {
    x: AxisProps;
    y: AxisProps;
    z: AxisProps;
  };
  private xArcLineMesh = new ArcLineMesh(this.engine, {
    radius: 1.6,
    radialSegments: 96,
    arc: 360
  });

  private yArcLineMesh = new ArcLineMesh(this.engine, {
    radius: 1.6,
    radialSegments: 96,
    arc: 360
  });

  private zArcLineMesh = new ArcLineMesh(this.engine, {
    radius: 1.6,
    radialSegments: 96,
    arc: 360
  });

  private arcLineMesh = {
    x: this.xArcLineMesh,
    y: this.yArcLineMesh,
    z: this.zArcLineMesh
  };

  private _gizmoRotateHelperEntity: Entity;

  private _axisX: Entity;
  private _axisY: Entity;
  private _axisZ: Entity;
  private _helperAxisX: Entity;
  private _helperAxisY: Entity;
  private _helperAxisZ: Entity;

  private _startLineHelperEntity: Entity;
  private startLineMesh: LinesMesh = new LinesMesh(this.engine, {
    points: [
      [0, 0, 0],
      [0, 0, 0]
    ],
    count: 2
  });
  private _endLineHelperEntity: Entity;
  private endLineMesh: LinesMesh = new LinesMesh(this.engine, {
    points: [
      [0, 0, 0],
      [0, 0, 0]
    ],
    count: 2
  });
  private _rotateHelperPlaneEntity: Entity;
  private rotateHelperPlaneMesh: CircleMesh = new CircleMesh({}, this.engine);

  private _selectedAxisName: string;
  private _startPosition: Vector3 = new Vector3();
  private _startMatrix: Matrix = new Matrix();
  private _startNormalizedMatrix: Matrix = new Matrix();
  private _startQuat: Quaternion = new Quaternion();

  private _rotateAxis: Vector3 = new Vector3();
  private _startPointUnit: Vector3 = new Vector3();
  private _movePointUnit: Vector3 = new Vector3();

  private _tempVec: Vector3 = new Vector3();

  private _previousRad: number = 0;
  private _finalRad: number = 0;

  constructor(entity: Entity) {
    super(entity);
    this._initAxis();
    this._createAxis(entity);
  }
  /** init axis geometry */
  private _initAxis() {
    this.rotateControlMap = {
      x: {
        name: "x",
        axisMesh: [this.arcLineMesh.x],
        axisMaterial: utils.redArcMaterial,
        axisHelperMesh: [utils.axisHelpertorusMesh],
        axisRotation: [new Vector3(0, 90, 90)],
        axisTranslation: [new Vector3(0, 0, 0)]
      },
      y: {
        name: "y",
        axisMesh: [this.arcLineMesh.y],
        axisMaterial: utils.greenArcMaterial,
        axisHelperMesh: [utils.axisHelpertorusMesh],
        axisRotation: [new Vector3(90, 0, 0)],
        axisTranslation: [new Vector3(0, 0, 0)]
      },
      z: {
        name: "z",
        axisMesh: [this.arcLineMesh.z],
        axisMaterial: utils.blueArcMaterial,
        axisHelperMesh: [utils.axisHelpertorusMesh],
        axisRotation: [new Vector3(0, 0, -90)],
        axisTranslation: [new Vector3(0, 0, 0)]
      }
    };
  }
  private _createAxis(entity: Entity) {
    // visible gizmo entity
    this.gizmoEntity = entity.createChild("visible");
    this.gizmoHelperEntity = entity.createChild("invisible");

    this._axisX = this.gizmoEntity.createChild("x");
    this._axisY = this.gizmoEntity.createChild("y");
    this._axisZ = this.gizmoEntity.createChild("z");

    this.rotateAxisComponent = {
      x: this._axisX.addComponent(Axis),
      y: this._axisY.addComponent(Axis),
      z: this._axisZ.addComponent(Axis)
    };

    this.rotateAxisComponent.x.initAxis(this.rotateControlMap.x);
    this.rotateAxisComponent.y.initAxis(this.rotateControlMap.y);
    this.rotateAxisComponent.z.initAxis(this.rotateControlMap.z);

    // invisible gizmo entity
    this._helperAxisX = this.gizmoHelperEntity.findByName("x");
    this._helperAxisY = this.gizmoHelperEntity.findByName("y");
    this._helperAxisZ = this.gizmoHelperEntity.findByName("z");

    // rotate gizmo in-process debug helper entity
    this._gizmoRotateHelperEntity = entity.createChild("helper");

    // rotate start line
    this._startLineHelperEntity = this._gizmoRotateHelperEntity.createChild("lineHelperS");
    const startHelperRenderer = this._startLineHelperEntity.addComponent(MeshRenderer);
    startHelperRenderer.mesh = this.startLineMesh;
    startHelperRenderer.setMaterial(utils.yellowMaterial);

    // rotate end line
    this._endLineHelperEntity = this._gizmoRotateHelperEntity.createChild("lineHelperE");
    const endHelperRenderer = this._endLineHelperEntity.addComponent(MeshRenderer);
    endHelperRenderer.mesh = this.endLineMesh;
    endHelperRenderer.setMaterial(utils.yellowMaterial);

    // rotate plane
    this._rotateHelperPlaneEntity = this._gizmoRotateHelperEntity.createChild("rotateHelperPlane");
    const planeHelperRenderer = this._rotateHelperPlaneEntity.addComponent(MeshRenderer);
    planeHelperRenderer.mesh = this.rotateHelperPlaneMesh;
    planeHelperRenderer.setMaterial(utils.rotatePlaneMaterial);
    utils.rotatePlaneMaterial.renderQueueType = RenderQueueType.Transparent;
    this._rotateHelperPlaneEntity.isActive = false;
  }

  initCamera(camera: Camera): void {}

  onSelected(value: Group) {
    this._group = value;
    (this.rotateControlMap["x"].axisMaterial as GizmoMaterial).posCutOff = true;
    (this.rotateControlMap["y"].axisMaterial as GizmoMaterial).posCutOff = true;
    (this.rotateControlMap["z"].axisMaterial as GizmoMaterial).posCutOff = true;
  }

  onHoverStart(axisName: string) {
    this._selectedAxisName = axisName;
    // high light when mouse enter
    const currEntity = this.gizmoEntity.findByName(axisName);
    const currComponent = currEntity.getComponent(Axis);
    currComponent?.highLight && currComponent.highLight();
  }

  onHoverEnd() {
    // unlight when mouse leave
    const currEntity = this.gizmoEntity.findByName(this._selectedAxisName);
    const currComponent = currEntity.getComponent(Axis);
    currComponent?.unLight && currComponent.unLight();

    this._selectedAxisName = null;
  }

  onMoveStart(ray: Ray, axisName: string) {
    this._selectedAxisName = axisName;
    const { worldPosition, worldMatrix } = this._group;
    this._startMatrix.copyFrom(worldMatrix);
    this._rotateAxis.copyFrom(axisVector[axisName]);
    this._group.getNormalizedMatrix(this._startNormalizedMatrix);
    // rotate axis normal
    this._startNormalizedMatrix.getRotation(this._startQuat);
    Vector3.transformByQuat(this._rotateAxis, this._startQuat, this._rotateAxis);
    // selected entity position & rotation when start
    this._startPosition.copyFrom(worldPosition);

    // selected gizmo axis change into full circle
    this.rotateControlMap[axisName].axisMaterial.posCutOff = false;
    // change color
    const entityArray = this.gizmoEntity.children;
    for (let i = 0; i < entityArray.length; i++) {
      const currEntity = entityArray[i];
      const currComponent = currEntity.getComponent(Axis);
      if (currEntity.name === axisName) {
        currComponent?.yellow && currComponent.yellow();
      }
    }

    const { _startPointUnit: startPointUnit } = this;
    // get start point
    this._getRotateHitPointFromRay(ray, startPointUnit);
    const tempMat = this._startNormalizedMatrix.clone();
    startPointUnit.transformToVec3(tempMat.invert());
    startPointUnit.normalize().scale(utils.rotateCircleRadius);

    // init line and plane
    this._startLineHelperEntity.isActive = true;
    this._endLineHelperEntity.isActive = true;
    this._rotateHelperPlaneEntity.isActive = true;

    this.startLineMesh.update([
      [0, 0, 0],
      [startPointUnit.x, startPointUnit.y, startPointUnit.z]
    ]);
    this.endLineMesh.update([
      [0, 0, 0],
      [startPointUnit.x, startPointUnit.y, startPointUnit.z]
    ]);
    this.rotateHelperPlaneMesh.update({
      startPoint: this._startPointUnit,
      normal: axisVector[axisName],
      thetaLength: 0
    });
  }

  onMove(ray: Ray): void {
    // 点击点的世界坐标
    this._getRotateHitPointFromRay(ray, this._movePointUnit);
    const tempMat = this._startNormalizedMatrix.clone().invert();
    const localAxis = axisVector[this._selectedAxisName];
    // 转到局部坐标
    this._movePointUnit.transformToVec3(tempMat);
    this._movePointUnit.normalize().scale(utils.rotateCircleRadius);
    // 起始点与重点之间的角度
    const dot = Vector3.dot(this._startPointUnit, this._movePointUnit);
    Vector3.cross(this._startPointUnit, this._movePointUnit, this._tempVec);
    const direction = Vector3.dot(this._tempVec, localAxis);
    const currentRad = Math.sign(direction) * Math.acos(dot / utils.rotateCircleRadius ** 2);
    const incrementRad = currentRad - this._previousRad;

    if (this._previousRad * currentRad < 0) {
      Math.abs(currentRad) < Math.PI / 2
        ? (this._finalRad += incrementRad)
        : (this._finalRad += -Math.sign(incrementRad) * (2 * Math.PI - Math.abs(incrementRad)));
    } else {
      this._finalRad += incrementRad;
    }
    this._previousRad = currentRad;

    // update plane
    this.rotateHelperPlaneMesh.update({
      startPoint: this._startPointUnit,
      normal: localAxis,
      thetaLength: this._finalRad
    });

    const _tempMat = new Matrix();
    const _tempQuat = new Quaternion();
    Matrix.rotateAxisAngle(this._startNormalizedMatrix, localAxis, this._finalRad, _tempMat);
    _tempMat.getRotation(_tempQuat);
    // Matrix.rotateAxisAngle(this._startMatrix, localAxis, this._finalRad, _tempMat);
    this._group.worldQuat = _tempQuat;
  }

  onMyLateUpdate() {
    this._startLineHelperEntity.transform.worldMatrix = this._startNormalizedMatrix;
    // this._startLineHelperEntity.transform.worldRotationQuaternion =
    this._rotateHelperPlaneEntity.transform.worldMatrix = this._startNormalizedMatrix;
  }

  onMoveEnd() {
    // recover axis color
    const entityArray = this.gizmoEntity.children;
    for (let i = 0; i < entityArray.length; i++) {
      const currEntity = entityArray[i];
      const currComponent = currEntity.getComponent(Axis);
      currComponent?.recover && currComponent.recover();
    }

    // recover arc line
    this.rotateControlMap[this._selectedAxisName].axisMaterial.posCutOff = true;

    // hide helper entity
    this._endLineHelperEntity.isActive = false;
    this._startLineHelperEntity.isActive = false;
    this._rotateHelperPlaneEntity.isActive = false;

    this._finalRad = 0;
    this._previousRad = 0;
  }

  private _getRotateHitPointFromRay(ray: Ray, out: Vector3) {
    // hit plane
    const plane = new Plane(
      this._rotateAxis,
      -Vector3.dot(this._rotateAxis, this._startPosition) / this._rotateAxis.length()
    );
    ray.getPoint(ray.intersectPlane(plane), out);
  }
}
