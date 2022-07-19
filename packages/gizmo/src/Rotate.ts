import { Component, Entity, MeshRenderer, Plane, Quaternion, Ray, RenderQueueType, Vector3 } from "oasis-engine";
import { Axis } from "./Axis";
import { ArcLineMesh, CircleMesh, LinesMesh } from "./Mesh";
import { GizmoComponent, AxisProps, axisNormal, axisIndices } from "./Type";
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
  private movePoint = new Vector3();
  private currentAxis: string;
  private startPoint: Vector3 = new Vector3();

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

  onSelected(entity: Entity) {
    this.selectedEntity = entity;
  }

  onHoverStart(axis: string) {
    this.currentAxis = axis;
    const currEntity = this.gizmoEntity.findByName(axis);
    const currComponent = currEntity.getComponent(Axis);
    currComponent.highLight();
  }

  onHoverEnd() {
    const currEntity = this.gizmoEntity.findByName(this.currentAxis);
    const currComponent = currEntity.getComponent(Axis);
    currComponent.unLight();
  }
  private worldPosition: Vector3 = new Vector3();
  private startPointNormal: Vector3 = new Vector3();
  private startQuaternion: Quaternion = new Quaternion();

  onMoveStart(ray: Ray, axis: string) {
    this.currentAxis = axis;
    this.rotateNormal = axisNormal[this.currentAxis].clone();
    this.worldPosition = this.selectedEntity.transform.worldPosition.clone();
    this.startQuaternion = this.selectedEntity.transform.rotationQuaternion.clone();
    // 变成整圆
    this.arcLineMesh[this.currentAxis].update(360);
    // 变色
    const entityArray = this.gizmoEntity.children;
    for (let i = 0; i < entityArray.length; i++) {
      const currEntity = entityArray[i];
      const currComponent = currEntity.getComponent(Axis);
      if (currEntity.name === this.currentAxis) {
        currComponent.yellow();
      } else {
        currComponent.gray();
      }
    }

    let plane = new Plane(this.rotateNormal, -this.worldPosition[this.currentAxis]);
    let tempDist = ray.intersectPlane(plane);
    ray.getPoint(tempDist, this.startPoint);

    Vector3.subtract(this.startPoint, this.worldPosition, this.startPointNormal);
    this.startPointNormal.normalize().scale(utils.rotateCircleRadius);

    // 初始化开始辅助线
    this.startLineMesh.update([
      [0, 0, 0],
      [this.startPointNormal.x, this.startPointNormal.y, this.startPointNormal.z]
    ]);

    //初始化结束辅助线
    this.endLineMesh.update([
      [0, 0, 0],
      [this.startPointNormal.x, this.startPointNormal.y, this.startPointNormal.z]
    ]);

    // 初始化辅助面

    this.rotateHelperPlaneEntity.isActive = true;
    this.rotateHelperPlaneEntity.transform.worldPosition = this.worldPosition;
    this.rotateHelperPlaneMesh.update({
      startPoint: this.startPointNormal,
      normal: this.rotateNormal,
      thetaLength: 0
    });
  }
  private movePointNormal: Vector3 = new Vector3();
  private endPoint: Vector3 = new Vector3();
  private tempVec: Vector3 = new Vector3();
  private temp: Quaternion = new Quaternion();
  onMove(ray: Ray): void {
    let plane = new Plane(this.rotateNormal, -this.worldPosition[this.currentAxis]);
    let tempDist = ray.intersectPlane(plane);
    ray.getPoint(tempDist, this.movePoint);

    // 移动点在圆弧上的点
    Vector3.subtract(this.movePoint, this.worldPosition, this.movePointNormal);
    this.movePointNormal.normalize().scale(utils.rotateCircleRadius);
    Vector3.add(this.worldPosition, this.movePointNormal, this.endPoint);
    // 空间中两向量夹角
    let dot = Vector3.dot(this.startPointNormal, this.movePointNormal);
    Vector3.cross(this.startPointNormal, this.movePointNormal, this.tempVec);
    let direction = Vector3.dot(this.tempVec, this.rotateNormal);
    let rad = -Math.sign(direction) * Math.acos(dot / utils.rotateCircleRadius ** 2);

    // 更细结束辅助线
    this.endLineMesh.update([
      [0, 0, 0],
      [this.movePointNormal.x, this.movePointNormal.y, this.movePointNormal.z]
    ]);
    // 更新辅助面
    this.rotateHelperPlaneMesh.update({
      thetaLength: rad
    });

    // 更新节点
    let quat = new Quaternion();
    Quaternion.rotationAxisAngle(this.rotateNormal, rad, quat);
    Quaternion.multiply(quat, this.startQuaternion, this.temp);
    this.selectedEntity.transform.rotationQuaternion = this.temp;
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
}
