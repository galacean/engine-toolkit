import { Camera, Entity, Matrix, MeshRenderer, Ray, Vector3, Transform, MathUtil, Pointer } from "@galacean/engine";
import { Axis } from "./Axis";
import { Utils } from "./Utils";
import { GizmoComponent, AxisProps, axisVector, axisPlane, axisType } from "./Type";
import { Group } from "./Group";
import { GizmoMesh } from "./GizmoMesh";
import { State } from "./enums/GizmoState";

/** @internal */
export class RotateControl extends GizmoComponent {
  private _group: Group;
  private _camera: Camera;

  private _rotateAxisComponent: Array<Axis> = [];
  private _rotateControlMap: Array<AxisProps> = [];

  private _gizmoRotateHelperEntity: Entity;

  private _axisX: Entity;
  private _axisY: Entity;
  private _axisZ: Entity;
  private _axisXYZ: Entity;
  private _axisXHelper: Entity;
  private _axisYHelper: Entity;
  private _axisZHelper: Entity;
  private _axisXYZHelper: Entity;

  private _isModified: boolean = false;

  private _startLineHelperEntity: Entity;
  private _startLineMesh = GizmoMesh.createLine(this.engine, [new Vector3(0, 0, 0), new Vector3(0, 0, 0)]);
  private _endLineHelperEntity: Entity;

  private _endLineMesh = GizmoMesh.createLine(this.engine, [new Vector3(0, 0, 0), new Vector3(0, 0, 0)]);

  private _rotateHelperPlaneEntity: Entity;
  private _rotateHelperPlaneMesh = GizmoMesh.createCircle(this.engine);

  private _selectedAxis: axisType;
  private _preMatrix: Matrix = new Matrix();
  private _startMatrix: Matrix = new Matrix();
  private _startInvMatrix: Matrix = new Matrix();

  private _startPointUnit: Vector3 = new Vector3();
  private _currPointUnit: Vector3 = new Vector3();

  private _cameraPos: Vector3 = new Vector3();

  private _previousRad: number = 0;
  private _finalRad: number = 0;

  private _verticalAxis: Vector3 = new Vector3(0, 1, 0);
  private _horizontalAxis: Vector3 = new Vector3();
  private _speedFactor: number = 0.01;

  private _tempMat: Matrix = new Matrix();
  private _tempMat2: Matrix = new Matrix();
  private _tempVec: Vector3 = new Vector3();
  private _tempVec2: Vector3 = new Vector3();
  private _tempVec30: Vector3 = new Vector3();
  private _tempVec31: Vector3 = new Vector3();
  private _tempVec32: Vector3 = new Vector3();
  private _tempMat41: Matrix = new Matrix();

  private _isAtBack: boolean = false;

  constructor(entity: Entity) {
    super(entity);
    this.type = State.rotate;
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
      },
      {
        name: "xyz",
        axisMesh: [Utils.axisXYZTorusMesh],
        axisMaterial: Utils.lightMaterial,
        axisHelperMesh: [Utils.axisSphereMesh],
        axisHelperMaterial: Utils.invisibleMaterialCircle,
        axisRotation: [new Vector3(0, 0, 0)],
        axisTranslation: [new Vector3(0, 0, 0)],
        priority: 99
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
    this._axisXYZ = this.gizmoEntity.createChild("xyz");

    this._rotateAxisComponent = [
      this._axisX.addComponent(Axis),
      this._axisY.addComponent(Axis),
      this._axisZ.addComponent(Axis),
      this._axisXYZ.addComponent(Axis)
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
    this._axisXYZHelper = axisHelpers[3];

    // rotate gizmo in-process debug helper entity
    this._gizmoRotateHelperEntity = entity.createChild("helper");

    // rotate start line
    this._startLineHelperEntity = this._gizmoRotateHelperEntity.createChild("lineHelperS");
    const startHelperRenderer = this._startLineHelperEntity.addComponent(MeshRenderer);
    startHelperRenderer.receiveShadows = false;
    startHelperRenderer.castShadows = false;
    startHelperRenderer.mesh = this._startLineMesh;
    startHelperRenderer.setMaterial(Utils.yellowMaterial);
    startHelperRenderer.priority = 90;

    // rotate end line
    this._endLineHelperEntity = this._gizmoRotateHelperEntity.createChild("lineHelperE");
    const endHelperRenderer = this._endLineHelperEntity.addComponent(MeshRenderer);
    endHelperRenderer.receiveShadows = false;
    endHelperRenderer.castShadows = false;
    endHelperRenderer.mesh = this._endLineMesh;
    endHelperRenderer.setMaterial(Utils.yellowMaterial);
    endHelperRenderer.priority = 90;

    // rotate plane
    this._rotateHelperPlaneEntity = this._gizmoRotateHelperEntity.createChild("rotateHelperPlane");
    const planeHelperRenderer = this._rotateHelperPlaneEntity.addComponent(MeshRenderer);
    planeHelperRenderer.receiveShadows = false;
    planeHelperRenderer.castShadows = false;
    planeHelperRenderer.mesh = this._rotateHelperPlaneMesh;
    // @ts-ignore
    this._rotateHelperPlaneMesh._enableVAO = false;
    planeHelperRenderer.setMaterial(Utils.rotatePlaneMaterial);
    planeHelperRenderer.priority = 90;
    this._rotateHelperPlaneEntity.isActive = false;
  }

  init(camera: Camera, group: Group): void {
    this._camera = camera;
    this._group = group;
  }

  onHoverStart(axisName: string): void {
    if (this._selectedAxis === axisType[axisName]) return;
    this.onHoverEnd();

    this._selectedAxis = axisType[axisName];
    const currEntity = this.gizmoEntity.findByName(axisName);
    const currComponent = currEntity.getComponent(Axis);
    currComponent.highLight && currComponent.highLight();
  }

  onHoverEnd(): void {
    const axesEntity = this.gizmoEntity.children;
    for (let entity of axesEntity) {
      const component = entity.getComponent(Axis);
      component.unLight && component.unLight();
    }

    this._selectedAxis = null;
  }

  onMoveStart(ray: Ray, axisName: string): void {
    this._selectedAxis = axisType[axisName];
    const {
      _group: group,
      _startPointUnit: startP,
      _startMatrix: startMat,
      _tempVec: tempVec,
      _tempMat: tempMat
    } = this;

    group.getWorldMatrix(startMat);
    this._preMatrix.copyFrom(startMat);
    Matrix.invert(startMat, this._startInvMatrix);

    const s = this._getGizmoScale();
    this._tempMat.copyFrom(startMat).scale(tempVec.set(s, s, s));
    this.gizmoEntity.transform.worldMatrix = tempMat;

    switch (this._selectedAxis) {
      case axisType.x:
      case axisType.y:
      case axisType.z:
        this.gizmoHelperEntity.transform.worldMatrix = tempMat;
        this._gizmoRotateHelperEntity.transform.worldMatrix = tempMat;

        this._calRayIntersection(ray, startP);
        this._setAxisSelected(this._selectedAxis, true);

        GizmoMesh.updateLine(this._startLineMesh, [new Vector3(0, 0, 0), startP]);
        GizmoMesh.updateLine(this._endLineMesh, [new Vector3(0, 0, 0), startP]);
        GizmoMesh.updateCircle(this._rotateHelperPlaneMesh, startP, axisVector[axisName], 0);

        this._startLineHelperEntity.isActive = true;
        this._endLineHelperEntity.isActive = true;
        this._rotateHelperPlaneEntity.isActive = true;
        this._startLineHelperEntity.transform.setRotation(0, 0, 0);
        this._endLineHelperEntity.transform.setRotation(0, 0, 0);
        this._rotateHelperPlaneEntity.transform.setRotation(0, 0, 0);
        break;
      case axisType.xyz:
        this.gizmoHelperEntity.transform.worldMatrix = tempMat;
        this._setAxisSelected(this._selectedAxis, true);
        this._isAtBack = this.gizmoEntity.transform.worldUp.y < 0;
        this._isAtBack ? this._verticalAxis.set(0, -1, 0) : this._verticalAxis.set(0, 1, 0);
        break;
    }
  }

  onMove(ray: Ray, pointer: Pointer): void {
    const {
      _startPointUnit: startP,
      _currPointUnit: currP,
      _startMatrix: startMat,
      _tempMat2: mat,
      _group: group,
      _tempVec: tempVec
    } = this;

    switch (this._selectedAxis) {
      case axisType.x:
      case axisType.y:
      case axisType.z:
        const localAxis = axisVector[this._selectedAxis];
        this._calRayIntersection(ray, currP);
        const rad = this._getFinalRad(startP, currP, localAxis);
        GizmoMesh.updateCircle(this._rotateHelperPlaneMesh, startP, localAxis, rad);

        Matrix.rotateAxisAngle(startMat, localAxis, rad, mat);
        group.applyTransform(this._preMatrix, mat);
        this._preMatrix.copyFrom(mat);
        const d = (rad / Math.PI) * 180;
        this._endLineHelperEntity.transform.setRotation(d * localAxis.x, d * localAxis.y, d * localAxis.z);
        break;
      case axisType.xyz:
        const { x, y } = pointer.deltaPosition;
        const { _horizontalAxis: hAxis, _verticalAxis: vAxis } = this;
        hAxis.copyFrom(this._camera.entity.transform.worldUp);

        Vector3.cross(hAxis, vAxis, hAxis);
        this._isAtBack ? hAxis.scale(-y) : hAxis.scale(y);

        tempVec.copyFrom(vAxis);
        this._isAtBack ? tempVec.scale(-x) : tempVec.scale(x);

        Vector3.add(hAxis, tempVec, tempVec);
        Vector3.transformNormal(tempVec, this._startInvMatrix, tempVec);
        const angle = pointer.deltaPosition.length() * this._speedFactor;
        Matrix.rotateAxisAngle(startMat, tempVec, angle, startMat);
        group.applyTransform(this._preMatrix, startMat);
        this._preMatrix.copyFrom(startMat);

        Matrix.invert(startMat, this._startInvMatrix);
        break;
    }
    this.engine.dispatch("gizmo-move", "rotate");
  }

  onMoveEnd(): void {
    this._finalRad = 0;
    this._previousRad = 0;
    // recover axis color
    this._setAxisSelected(this._selectedAxis, false);
    // recover arc line
    const axisMesh = this._rotateControlMap[this._selectedAxis].axisMesh[0];

    switch (this._selectedAxis) {
      case axisType.x:
      case axisType.y:
      case axisType.z:
        GizmoMesh.updateCircleTube(axisMesh, Math.PI);
        // hide helper entity
        this._endLineHelperEntity.isActive = false;
        this._startLineHelperEntity.isActive = false;
        this._rotateHelperPlaneEntity.isActive = false;
        break;
      case axisType.xyz:
        GizmoMesh.updateCircleTube(axisMesh, 2 * Math.PI, 1.8);
        break;
    }
  }

  onUpdate(isModified: boolean = false): void {
    this._resizeControl(isModified);
    this._updateAxisTransform();
  }

  onSwitch(isModified: boolean = false) {
    this._resizeControl(isModified);
  }

  onAlphaChange(axisName: string, value: number): void {}

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
    if (this._camera.isOrthographic) {
      return this._isModified
        ? this._camera.orthographicSize * Utils.scaleFactor * 3 * 0.8
        : this._camera.orthographicSize * Utils.scaleFactor * 3;
    } else {
      return this._isModified
        ? Vector3.distance(cameraPosition, this._tempVec) * Utils.scaleFactor * 0.8
        : Vector3.distance(cameraPosition, this._tempVec) * Utils.scaleFactor;
    }
  }

  private _updateAxisTransform(): void {
    const { _tempMat: _tempMat, _tempVec, _tempVec2, _cameraPos } = this;
    // 相机位置
    _cameraPos.copyFrom(this._camera.entity.transform.worldPosition);
    const gizmoTrans = this.gizmoEntity.transform;
    // 获取参照向量(Gizmo 中点 -> 相机)（世界坐标）
    Vector3.subtract(_cameraPos, gizmoTrans.worldPosition, _tempVec);
    // 逆矩阵（世界 -> Gizmo）
    Matrix.invert(gizmoTrans.worldMatrix, _tempMat);
    // 将向量(Gizmo 中点 -> 相机)映射到 Gizmo 坐标系中，此处 XYZ 局部向量是相同的
    Vector3.transformNormal(_tempVec, _tempMat, _tempVec2);
    const factor = MathUtil.radToDegreeFactor;
    const { x, y, z } = _tempVec2;
    // 用 yoz 投影计算 X 轴的局部旋转
    this._axisX.transform.rotation.x = this._axisXHelper.transform.rotation.x = -Math.atan2(y, z) * factor;
    // 用 xoz 投影计算 Y 轴的局部旋转
    this._axisY.transform.rotation.y = this._axisYHelper.transform.rotation.y = Math.atan2(x, z) * factor;
    // 用 yox 投影计算 Z 轴的局部旋转
    this._axisZ.transform.rotation.z = this._axisZHelper.transform.rotation.z = Math.atan2(y, x) * factor;
    // xyz 投影
    this._localLookAt(this._axisXYZ.transform, _tempVec2);
    this._axisXYZHelper.transform.rotationQuaternion = this._axisXYZ.transform.rotationQuaternion;
  }

  private _resizeControl(isModified: boolean = false): void {
    this._group.getWorldMatrix(this._tempMat);
    this._isModified = isModified;
    const s = this._getGizmoScale();
    this.gizmoEntity.transform.worldMatrix = this.gizmoHelperEntity.transform.worldMatrix = this._tempMat.scale(
      this._tempVec.set(s, s, s)
    );
  }

  private _localLookAt(transform: Transform, targetPosition: Vector3) {
    const zAxis = this._tempVec30;
    Vector3.subtract(transform.position, targetPosition, zAxis);
    zAxis.normalize();
    const xAxis = this._tempVec31.set(zAxis.z, 0, -zAxis.x).normalize();
    const yAxis = this._tempVec32;
    Vector3.cross(zAxis, xAxis, yAxis);
    yAxis.normalize();
    const rotMat = this._tempMat41;
    const { elements: e } = rotMat;
    (e[0] = xAxis.x), (e[1] = xAxis.y), (e[2] = xAxis.z);
    (e[4] = yAxis.x), (e[5] = yAxis.y), (e[6] = yAxis.z);
    (e[8] = zAxis.x), (e[9] = zAxis.y), (e[10] = zAxis.z);
    rotMat.getRotation(transform.rotationQuaternion);
  }
}
