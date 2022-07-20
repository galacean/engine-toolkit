import {
  Camera,
  Component,
  Entity,
  MeshRenderer,
  Plane,
  Quaternion,
  Ray,
  RenderQueueType,
  Vector3
} from "oasis-engine";
import { Axis } from "./Axis";
import { ArcLineMesh, CircleMesh, LinesMesh } from "./Mesh";
import { GizmoComponent, AxisProps, axisVector } from "./Type";
import { utils } from "./Utils";

export class RotateControl extends Component implements GizmoComponent {
  private rotateAxisComponent: { x: Axis; y: Axis; z: Axis };
  private rotateControlMap: {
    x: AxisProps;
    y: AxisProps;
    z: AxisProps;
  };
  private xArcLineMesh = new ArcLineMesh(this.engine, {
    radius: 1.6,
    radialSegments: 48,
    arc: 180
  });

  private yArcLineMesh = new ArcLineMesh(this.engine, {
    radius: 1.6,
    radialSegments: 48,
    arc: 180
  });
  private zArcLineMesh = new ArcLineMesh(this.engine, {
    radius: 1.6,
    radialSegments: 48,
    arc: 180
  });

  private arcLineMesh = {
    x: this.xArcLineMesh,
    y: this.yArcLineMesh,
    z: this.zArcLineMesh
  };

  public gizmoEntity: Entity;
  public gizmoHelperEntity: Entity;
  private gizmoRotateHelperEntity: Entity;
  private axisX: Entity;
  private axisY: Entity;
  private axisZ: Entity;
  private helperAxisX: Entity;
  private helperAxisY: Entity;
  private helperAxisZ: Entity;

  private startLineHelperEntity: Entity;
  private startLineMesh: LinesMesh = new LinesMesh(this.engine, {
    points: [
      [0, 0, 0],
      [0, 0, 0]
    ],
    count: 2
  });
  private endLineHelperEntity: Entity;
  private endLineMesh: LinesMesh = new LinesMesh(this.engine, {
    points: [
      [0, 0, 0],
      [0, 0, 0]
    ],
    count: 2
  });
  private rotateHelperPlaneEntity: Entity;
  private rotateHelperPlaneMesh: CircleMesh = new CircleMesh({}, this.engine);

  private selectedEntity: Entity = null;

  private rotateNormal: Vector3 = new Vector3();
  private currentAxis: string;
  private initPosition: Vector3 = new Vector3();
  private startQuaternion: Quaternion = new Quaternion();
  private startPoint: Vector3 = new Vector3();
  private startPointUnit: Vector3 = new Vector3();
  private movePoint = new Vector3();
  private movePointUnit: Vector3 = new Vector3();
  private endPoint: Vector3 = new Vector3();
  private _tempVec: Vector3 = new Vector3();
  private _tempVec1: Quaternion = new Quaternion();
  private _tempVec2: Vector3 = new Vector3();
  private _tempQuat: Quaternion = new Quaternion();
  private _camera: Camera = null;

  constructor(entity: Entity) {
    super(entity);
    this.initAxis();
    this.createAxis(entity);
  }

  initAxis() {
    this.rotateControlMap = {
      x: {
        name: "x",
        axisMesh: [this.arcLineMesh.x],
        axisMaterial: utils.redMaterial,
        axisHelperMesh: [utils.axisHelpertorusMesh],
        axisRotation: [new Vector3(0, 90, 90)],
        axisTranslation: [new Vector3(0, 0, 0)]
      },
      y: {
        name: "y",
        axisMesh: [this.arcLineMesh.y],
        axisMaterial: utils.greenMaterial,
        axisHelperMesh: [utils.axisHelpertorusMesh],
        axisRotation: [new Vector3(90, 0, 0)],
        axisTranslation: [new Vector3(0, 0, 0)]
      },
      z: {
        name: "z",
        axisMesh: [this.arcLineMesh.z],
        axisMaterial: utils.blueMaterial,
        axisHelperMesh: [utils.axisHelpertorusMesh],
        axisRotation: [new Vector3(0, 0, -90)],
        axisTranslation: [new Vector3(0, 0, 0)]
      }
    };
  }

  createAxis(entity: Entity) {
    // visible gizmo
    this.gizmoEntity = entity.createChild("visible");
    this.gizmoHelperEntity = entity.createChild("invisible");

    this.axisX = this.gizmoEntity.createChild("x");
    this.axisY = this.gizmoEntity.createChild("y");
    this.axisZ = this.gizmoEntity.createChild("z");

    this.rotateAxisComponent = {
      x: this.axisX.addComponent(Axis),
      y: this.axisY.addComponent(Axis),
      z: this.axisZ.addComponent(Axis)
    };

    this.rotateAxisComponent.x.initAxis(this.rotateControlMap.x);
    this.rotateAxisComponent.y.initAxis(this.rotateControlMap.y);
    this.rotateAxisComponent.z.initAxis(this.rotateControlMap.z);
    // invisible gizmo
    this.helperAxisX = this.gizmoHelperEntity.findByName("x");
    this.helperAxisY = this.gizmoHelperEntity.findByName("y");
    this.helperAxisZ = this.gizmoHelperEntity.findByName("z");
    // rotate gizmo helper
    this.gizmoRotateHelperEntity = entity.createChild("helper");

    // 开始辅助线
    this.startLineHelperEntity = this.gizmoRotateHelperEntity.createChild("lineHelper");
    const startHelperRenderer = this.startLineHelperEntity.addComponent(MeshRenderer);
    startHelperRenderer.mesh = this.startLineMesh;
    startHelperRenderer.setMaterial(utils.yellowMaterial);

    // 结束辅助线
    this.endLineHelperEntity = this.gizmoRotateHelperEntity.createChild("lineHelper");
    const endHelperRenderer = this.endLineHelperEntity.addComponent(MeshRenderer);
    endHelperRenderer.mesh = this.endLineMesh;
    endHelperRenderer.setMaterial(utils.yellowMaterial);

    // 旋转辅助面
    this.rotateHelperPlaneEntity = this.gizmoRotateHelperEntity.createChild("rotateHelperPlane");
    const planeHelperRenderer = this.rotateHelperPlaneEntity.addComponent(MeshRenderer);
    planeHelperRenderer.mesh = this.rotateHelperPlaneMesh;
    planeHelperRenderer.setMaterial(utils.rotatePlaneMaterial);
    utils.rotatePlaneMaterial.renderQueueType = RenderQueueType.Transparent;
    this.rotateHelperPlaneEntity.isActive = false;
  }

  initCamera(camera: Camera): void {
    this._camera = camera;
  }

  getRotateHitPointFromRay(ray: Ray) {
    let plane = new Plane(this.rotateNormal, -this.initPosition[this.currentAxis]);
    let tempDist = ray.intersectPlane(plane);
    ray.getPoint(tempDist, this._tempVec2);
    return this._tempVec2;
  }

  onSelected(entity: Entity) {
    this.selectedEntity = entity;
  }

  onHoverStart(axis: string) {
    this.currentAxis = axis;
    const currEntity = this.gizmoEntity.findByName(axis);
    const currComponent = currEntity.getComponent(Axis);
    currComponent?.highLight && currComponent.highLight();
  }

  onHoverEnd() {
    const currEntity = this.gizmoEntity.findByName(this.currentAxis);
    const currComponent = currEntity.getComponent(Axis);
    currComponent?.unLight && currComponent.unLight();
  }

  onMoveStart(ray: Ray, axis: string) {
    this.currentAxis = axis;
    this.rotateNormal = axisVector[this.currentAxis].clone();
    this.initPosition = this.selectedEntity.transform.worldPosition.clone();
    this.startQuaternion = this.selectedEntity.transform.rotationQuaternion.clone();
    // 变成整圆
    this.arcLineMesh[this.currentAxis].update(360);
    // 变色
    const entityArray = this.gizmoEntity.children;
    for (let i = 0; i < entityArray.length; i++) {
      const currEntity = entityArray[i];
      const currComponent = currEntity.getComponent(Axis);
      if (currEntity.name === this.currentAxis) {
        currComponent?.yellow && currComponent.yellow();
      } else {
        currComponent?.gray && currComponent.gray();
      }
    }

    this.startPoint = this.getRotateHitPointFromRay(ray);
    Vector3.subtract(this.startPoint, this.initPosition, this.startPointUnit);
    this.startPointUnit.normalize().scale(utils.rotateCircleRadius);

    // 初始化开始辅助线
    this.startLineMesh.update([
      [0, 0, 0],
      [this.startPointUnit.x, this.startPointUnit.y, this.startPointUnit.z]
    ]);

    //初始化结束辅助线
    this.endLineMesh.update([
      [0, 0, 0],
      [this.startPointUnit.x, this.startPointUnit.y, this.startPointUnit.z]
    ]);

    // 初始化辅助面
    this.rotateHelperPlaneEntity.isActive = true;
    this.rotateHelperPlaneEntity.transform.worldPosition = this.initPosition;
    this.rotateHelperPlaneMesh.update({
      startPoint: this.startPointUnit,
      normal: this.rotateNormal,
      thetaLength: 0
    });
  }

  onMove(ray: Ray): void {
    this.movePoint = this.getRotateHitPointFromRay(ray);

    // 移动点在圆弧上的点
    Vector3.subtract(this.movePoint, this.initPosition, this.movePointUnit);
    this.movePointUnit.normalize().scale(utils.rotateCircleRadius);
    Vector3.add(this.initPosition, this.movePointUnit, this.endPoint);
    // 空间中两向量夹角
    let dot = Vector3.dot(this.startPointUnit, this.movePointUnit);
    Vector3.cross(this.startPointUnit, this.movePointUnit, this._tempVec);
    let direction = Vector3.dot(this._tempVec, this.rotateNormal);
    let rad = Math.sign(direction) * Math.acos(dot / utils.rotateCircleRadius ** 2);

    // 更细结束辅助线
    this.endLineMesh.update([
      [0, 0, 0],
      [this.movePointUnit.x, this.movePointUnit.y, this.movePointUnit.z]
    ]);

    // 更新辅助面
    this.rotateHelperPlaneMesh.update({
      thetaLength: rad
    });
    // 更新节点
    Quaternion.rotationAxisAngle(this.rotateNormal, rad, this._tempQuat);
    Quaternion.multiply(this._tempQuat, this.startQuaternion, this._tempVec1);
    this.selectedEntity.transform.rotationQuaternion = this._tempVec1;
  }

  onMoveEnd() {
    const entityArray = this.gizmoEntity.children;
    for (let i = 0; i < entityArray.length; i++) {
      const currEntity = entityArray[i];
      const currComponent = currEntity.getComponent(Axis);
      currComponent?.recover && currComponent.recover();
    }
    this.arcLineMesh[this.currentAxis].update(180);
    this.startLineMesh.update([
      [0, 0, 0],
      [0, 0, 0]
    ]);
    this.endLineMesh.update([
      [0, 0, 0],
      [0, 0, 0]
    ]);
    this.rotateHelperPlaneEntity.isActive = false;
  }

  updateTransform() {
    // if (this.isStarted) {
    //   return;
    // }
    // 相机位置
    // this._camera.entity.transform.worldPosition.cloneTo(this.cameraWorldPosition);
    // this.entity.transform.worldPosition = this.worldPosition;
    // this.selectedEntity.transform.worldRotationQuaternion.cloneTo(this.worldQuaternion);
    // const quaternion = this.worldQuaternion;
    // const tempQuaternion2 = this.tempQuaternion2;
    // const tempQuaternion = this.tempQuaternion;
    // const alignVector = this.alignVector;
    // this._camera.entity.transform.worldPosition.cloneTo(alignVector);
    // this.selectedEntity.transform.worldRotationQuaternion.cloneTo(tempQuaternion2);
    // this.selectedEntity.transform.worldRotationQuaternion.cloneTo(tempQuaternion); // 倒数
    // Quaternion.invert(tempQuaternion, tempQuaternion);
    // Vector3.transformByQuat(alignVector, tempQuaternion, alignVector);
    // Quaternion.rotationX(Math.atan2(-alignVector.y, alignVector.z), tempQuaternion);
    // Quaternion.multiply(tempQuaternion2, tempQuaternion, tempQuaternion);
    // this.axisX.transform.rotationQuaternion = tempQuaternion;
    // this.helperAxisX.transform.rotationQuaternion = tempQuaternion;
    // Quaternion.rotationY(Math.atan2(alignVector.x, alignVector.z), tempQuaternion);
    // Quaternion.multiply(tempQuaternion2, tempQuaternion, tempQuaternion);
    // this.axisY.transform.rotationQuaternion = tempQuaternion;
    // this.helperAxisY.transform.rotationQuaternion = tempQuaternion;
    // Quaternion.rotationZ(Math.atan2(alignVector.y, alignVector.x), tempQuaternion);
    // Quaternion.multiply(tempQuaternion2, tempQuaternion, tempQuaternion);
    // this.axisZ.transform.rotationQuaternion = tempQuaternion;
    // this.helperAxisZ.transform.rotationQuaternion = tempQuaternion;
  }
}
