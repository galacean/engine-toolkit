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
import { ArcLineMesh } from "./ArcLineMesh";
import { CircleMesh } from "./CircleMesh";
import { LinesMesh } from "./LineMesh";
import { GizmoComponent, AxisProps, axisVector } from "./Type";
import { utils } from "./Utils";

/** @internal */
export class RotateControl extends Component implements GizmoComponent {
  gizmoEntity: Entity;
  gizmoHelperEntity: Entity;
  private _camera: Camera = null;
  private _selectedEntity: Entity = null;
  private _isGlobalOrient = false;

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
  private _startQuaternion: Quaternion = new Quaternion();
  private _gizmoStartQuat = new Quaternion();

  private _rotateAxis: Vector3 = new Vector3();
  private _startPoint: Vector3 = new Vector3();
  private _startPointUnit: Vector3 = new Vector3();
  private _movePoint = new Vector3();
  private _movePointUnit: Vector3 = new Vector3();

  private _tempVec: Vector3 = new Vector3();
  private _tempVec1: Quaternion = new Quaternion();
  private _tempVec2: Vector3 = new Vector3();
  private _tempQuat: Quaternion = new Quaternion();
  private _tempQuat1: Quaternion = new Quaternion();
  private _tempQuat2: Quaternion = new Quaternion();
  private _eyeVector: Vector3 = new Vector3();
  private _alignVector: Vector3 = new Vector3();

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
    this._startLineHelperEntity = this._gizmoRotateHelperEntity.createChild("lineHelper");
    const startHelperRenderer = this._startLineHelperEntity.addComponent(MeshRenderer);
    startHelperRenderer.mesh = this.startLineMesh;
    startHelperRenderer.setMaterial(utils.yellowMaterial);

    // rotate end line
    this._endLineHelperEntity = this._gizmoRotateHelperEntity.createChild("lineHelper");
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

  initCamera(camera: Camera): void {
    this._camera = camera;
  }

  onSelected(entity: Entity) {
    this._selectedEntity = entity;
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
    // rotate axis normal
    this._rotateAxis = axisVector[this._selectedAxisName].clone();
    if (!this._isGlobalOrient) {
      Vector3.transformByQuat(this._rotateAxis, this._selectedEntity.transform.rotationQuaternion, this._rotateAxis);
    }

    // gizmo position when start
    this._gizmoStartQuat = this.gizmoEntity.transform.rotationQuaternion.clone();

    // selected entity position & rotation when start
    this._startPosition = this._selectedEntity.transform.worldPosition.clone();
    this._startQuaternion = this._selectedEntity.transform.rotationQuaternion.clone();

    // selected gizmo axis change into full circle
    this.arcLineMesh[this._selectedAxisName].update(360);
    // change color
    const entityArray = this.gizmoEntity.children;
    for (let i = 0; i < entityArray.length; i++) {
      const currEntity = entityArray[i];
      const currComponent = currEntity.getComponent(Axis);
      if (currEntity.name === this._selectedAxisName) {
        currComponent?.yellow && currComponent.yellow();
      }
    }

    // get start point
    this._startPoint = this._getRotateHitPointFromRay(ray);
    Vector3.subtract(this._startPoint, this._startPosition, this._startPointUnit);
    this._startPointUnit.normalize().scale(utils.rotateCircleRadius);

    // init start line
    this.startLineMesh.update([
      [0, 0, 0],
      [this._startPointUnit.x, this._startPointUnit.y, this._startPointUnit.z]
    ]);

    // init end line
    this.endLineMesh.update([
      [0, 0, 0],
      [this._startPointUnit.x, this._startPointUnit.y, this._startPointUnit.z]
    ]);

    // init helper plane
    this._rotateHelperPlaneEntity.isActive = true;
    this._rotateHelperPlaneEntity.transform.worldPosition = this._startPosition;
  }

  onMove(ray: Ray): void {
    // get move point
    this._movePoint = this._getRotateHitPointFromRay(ray);
    Vector3.subtract(this._movePoint, this._startPosition, this._movePointUnit);
    this._movePointUnit.normalize().scale(utils.rotateCircleRadius);

    // radian between start point and move point
    const dot = Vector3.dot(this._startPointUnit, this._movePointUnit);
    Vector3.cross(this._startPointUnit, this._movePointUnit, this._tempVec);
    const direction = Vector3.dot(this._tempVec, this._rotateAxis);
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

    // update end line
    this.endLineMesh.update([
      [0, 0, 0],
      [this._movePointUnit.x, this._movePointUnit.y, this._movePointUnit.z]
    ]);
    // update plane
    this.rotateHelperPlaneMesh.update({
      startPoint: this._startPointUnit,
      normal: this._rotateAxis,
      thetaLength: this._finalRad
    });
    // update gizmo position
    Quaternion.rotationAxisAngle(this._rotateAxis, this._finalRad, this._tempQuat);
    this.gizmoEntity.transform.rotationQuaternion = this._tempQuat;

    // align selected entity
    Quaternion.multiply(this._tempQuat, this._startQuaternion, this._tempVec1);
    this._selectedEntity.transform.rotationQuaternion = this._tempVec1;
  }

  onMoveEnd() {
    // gizmo return to initial position
    this.gizmoEntity.transform.rotationQuaternion = this._gizmoStartQuat;

    // recover axis color
    const entityArray = this.gizmoEntity.children;
    for (let i = 0; i < entityArray.length; i++) {
      const currEntity = entityArray[i];
      const currComponent = currEntity.getComponent(Axis);
      currComponent?.recover && currComponent.recover();
    }

    // recover arc line
    this.arcLineMesh[this._selectedAxisName].update(180);

    // hide helper entity
    this.startLineMesh.update([
      [0, 0, 0],
      [0, 0, 0]
    ]);
    this.endLineMesh.update([
      [0, 0, 0],
      [0, 0, 0]
    ]);

    this.rotateHelperPlaneMesh.update({
      startPoint: this._startPointUnit,
      normal: this._rotateAxis,
      thetaLength: 0
    });
    this._rotateHelperPlaneEntity.isActive = false;

    this._finalRad = 0;
    this._previousRad = 0;
  }

  toggleOrientation(isGlobal: boolean) {
    this._isGlobalOrient = isGlobal;
  }

  updateTransform() {
    this._eyeVector = this._camera.entity.transform.worldPosition.clone();

    if (this._isGlobalOrient) {
      this._tempQuat1 = this.gizmoEntity.transform.rotationQuaternion;
      Vector3.transformByQuat(this._eyeVector, this._tempQuat1, this._alignVector);
    } else {
      this._tempQuat1 = this._selectedEntity.transform.worldRotationQuaternion.clone();
      this._tempQuat2 = this._selectedEntity.transform.worldRotationQuaternion.clone();
      Quaternion.invert(this._tempQuat2, this._tempQuat2);
      Vector3.transformByQuat(this._eyeVector, this._tempQuat2, this._alignVector);
    }

    Quaternion.rotationX(Math.atan2(-this._alignVector.y, this._alignVector.z), this._tempQuat2);
    Quaternion.multiply(this._tempQuat1, this._tempQuat2, this._tempQuat2);
    this._axisX.transform.rotationQuaternion = this._tempQuat2;
    this._helperAxisX.transform.rotationQuaternion = this._tempQuat2;

    Quaternion.rotationY(Math.atan2(this._alignVector.x, this._alignVector.z), this._tempQuat2);
    Quaternion.multiply(this._tempQuat1, this._tempQuat2, this._tempQuat2);
    this._axisY.transform.rotationQuaternion = this._tempQuat2;
    this._helperAxisY.transform.rotationQuaternion = this._tempQuat2;

    Quaternion.rotationZ(Math.atan2(this._alignVector.y, this._alignVector.x), this._tempQuat2);
    Quaternion.multiply(this._tempQuat1, this._tempQuat2, this._tempQuat2);
    this._axisZ.transform.rotationQuaternion = this._tempQuat2;
    this._helperAxisZ.transform.rotationQuaternion = this._tempQuat2;
  }

  private _getRotateHitPointFromRay(ray: Ray) {
    // hit plane
    const plane = new Plane(
      this._rotateAxis,
      -Vector3.dot(this._rotateAxis, this._startPosition) / this._rotateAxis.length()
    );

    const tempDist = ray.intersectPlane(plane);
    ray.getPoint(tempDist, this._tempVec2);
    return this._tempVec2;
  }
}
