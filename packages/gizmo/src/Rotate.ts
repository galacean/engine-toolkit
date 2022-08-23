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
import { GizmoComponent, AxisProps, axisVector, axisPlane } from "./Type";
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
  private _rotateHelperPlaneMesh: CircleMesh = new CircleMesh({}, this.engine);

  private _selectedAxisName: string;
  private _startQuat: Quaternion = new Quaternion();
  private _endQuat: Quaternion = new Quaternion();
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
    planeHelperRenderer.mesh = this._rotateHelperPlaneMesh;
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
    // 记录一些开始点击的参数
    this._selectedAxisName = axisName;
    const { _group, _startQuat, _startPointUnit: startP } = this;
    _group.getNormalizedMatrix(this._startMatrix);
    Matrix.invert(this._startMatrix, this._startInvMatrix);
    this._startMatrix.getRotation(_startQuat);
    // 计算局部射线在局部空间中的交点，作为旋转的起点
    this._calRayIntersection(ray, startP);
    // 更新正在操作的轴的表现
    this.setAxisSelected(axisName, true);
    // 初始化辅助线和辅助面板
    this.startLineMesh.update([
      [0, 0, 0],
      [startP.x, startP.y, startP.z]
    ]);
    this.endLineMesh.update([
      [0, 0, 0],
      [startP.x, startP.y, startP.z]
    ]);
    this._rotateHelperPlaneMesh.update({
      startPoint: startP,
      normal: axisVector[axisName],
      thetaLength: 0
    });
    this._startLineHelperEntity.isActive = true;
    this._endLineHelperEntity.isActive = true;
    this._rotateHelperPlaneEntity.isActive = true;
  }

  onMove(ray: Ray): void {
    const { _startPointUnit: startP, _currPointUnit: currP } = this;
    const localAxis = axisVector[this._selectedAxisName];
    // 计算局部射线在局部空间中的交点，为当前旋转的位置
    this._calRayIntersection(ray, currP);
    // 累计旋转角度
    const rad = this._getFinalRad(startP, currP, localAxis);
    // 更新辅助面板
    this._rotateHelperPlaneMesh.update({
      startPoint: startP,
      normal: localAxis,
      thetaLength: rad
    });
    // 更新 Group 的旋转
    this._endQuat.copyFrom(this._startQuat).rotateAxisAngle(localAxis, rad);
    this._group.setWorldQuat(this._endQuat);
  }

  onMoveEnd() {
    this._finalRad = 0;
    this._previousRad = 0;
    // recover axis color
    this.setAxisSelected(this._selectedAxisName, false);
    // recover arc line
    this.rotateControlMap[this._selectedAxisName].axisMaterial.posCutOff = true;
    // hide helper entity
    this._endLineHelperEntity.isActive = false;
    this._startLineHelperEntity.isActive = false;
    this._rotateHelperPlaneEntity.isActive = false;
  }

  onLateUpdate() {
    this._startLineHelperEntity.transform.worldRotationQuaternion = this._startQuat;
    this._rotateHelperPlaneEntity.transform.worldRotationQuaternion = this._startQuat;
  }

  private setAxisSelected(axisName: string, isSelected: boolean) {
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

  private _calRayIntersection(ray: Ray, out: Vector3) {
    // 将世界射线转为局部射线
    const worldToLocal = this._startInvMatrix;
    Vector3.transformCoordinate(ray.origin, worldToLocal, ray.origin);
    Vector3.transformNormal(ray.direction, worldToLocal, ray.direction);
    // 取与面的交点
    ray.getPoint(ray.intersectPlane(axisPlane[this._selectedAxisName]), out);
    out.normalize().scale(utils.rotateCircleRadius);
  }

  private _getFinalRad(p1: Vector3, p2: Vector3, rotateAxis: Vector3): number {
    const dot = Vector3.dot(p1, p2);
    Vector3.cross(p1, p2, this._tempVec);
    const direction = Vector3.dot(this._tempVec, rotateAxis);
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
    return this._finalRad;
  }
}
