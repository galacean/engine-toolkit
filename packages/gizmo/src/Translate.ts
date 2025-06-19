import { Camera, Entity, Plane, Ray, Vector3, Matrix, MeshRenderer, UnlitMaterial, ModelMesh } from "@galacean/engine";

import { Axis } from "./Axis";
import { GizmoUtils, X_AXIS_ROTATION, Y_AXIS_ROTATION, Z_AXIS_ROTATION, XY_PLANE_ROTATION, YZ_PLANE_ROTATION, XZ_PLANE_ROTATION, LINE_TRANSLATION, END_TRANSLATION, PLANE_TRANSLATION } from "./constants";
import { Group } from "./Group";
import { GizmoComponent, AxisProps, axisVector, axisPlane, axisType } from "./Type";
import { State } from "./enums/GizmoState";
import { GizmoMesh } from "./GizmoMesh";

/** @internal */
export class TranslateControl extends GizmoComponent {
  private _scale: number = 1;
  private _camera: Camera;
  private _group: Group;
  private _translateAxisComponent: Array<Axis>;
  private _translateControlMap: Array<AxisProps>;

  private _selectedAxis: axisType;

  private _preMatrix: Matrix = new Matrix();
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
  private _tempScale: number = 1;
  
  // Reference line entities and meshes
  private _referenceLineEntity: Entity;
  private _referenceLineMesh: ModelMesh;

  constructor(entity: Entity) {
    super(entity);
    this.type = State.translate;
    this._initAxis();
    this._createAxis(entity);
    this._createReferenceLine(entity);
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
    
    // Make all other axes gray
    const axesEntity = this.gizmoEntity.children;
    for (let entity of axesEntity) {
      if (entity.name !== axisName) {
        const component = entity.getComponent(Axis);
        component.gray && component.gray();
      }
    }
    
    // Show reference line for axis (not for planes)
    if (axisName === "x" || axisName === "y" || axisName === "z") {
      this._showReferenceLine(axisName);
    }
  }

  onHoverEnd(): void {
    const axesEntity = this.gizmoEntity.children;
    for (let entity of axesEntity) {
      const component = entity.getComponent(Axis);
      component.unLight && component.unLight();
    }

    this._selectedAxis = null;
    
    // Hide reference line
    if (this._referenceLineEntity) {
      this._referenceLineEntity.isActive = false;
    }
  }

  onMoveStart(ray: Ray, axisName: string): void {
    this._selectedAxis = axisType[axisName];
    // get gizmo start worldPosition
    this._group.getWorldMatrix(this._startGroupMatrix);
    this._preMatrix.copyFrom(this._startGroupMatrix);
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
        currComponent.yellow && currComponent.yellow();
      } else {
        currComponent.gray && currComponent.gray();
      }
    }
    
    // Show reference line for axis (not for planes)
    if (axisName === "x" || axisName === "y" || axisName === "z") {
      this._showReferenceLine(axisName);
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
    this._group.applyTransform(this._preMatrix, mat);
    this._preMatrix.copyFrom(mat);
    this.engine.dispatch("gizmo-move", "translate");
  }

  onMoveEnd(): void {
    // recover axis cover
    const entityArray = this.gizmoEntity.children;
    for (let i = 0; i < entityArray.length; i++) {
      const currEntity = entityArray[i];
      const currComponent = currEntity.getComponent(Axis);
      currComponent.recover && currComponent.recover();
    }
    
    // Hide reference line
    if (this._referenceLineEntity) {
      this._referenceLineEntity.isActive = false;
    }
  }

  onUpdate(isModified: boolean = false): void {
    this._resizeControl(isModified);
  }

  onSwitch() {
    this._resizeControl();
  }

  onAlphaChange(axisName: string, value: number) {
    switch (axisName) {
      case "x":
        this._changeAxisAlpha("x", value);
        this._changeAxisAlpha("xy", value);
        this._changeAxisAlpha("xz", value);
        break;
      case "y":
        this._changeAxisAlpha("y", value);
        this._changeAxisAlpha("xy", value);
        this._changeAxisAlpha("xz", value);
        break;
      case "z":
        this._changeAxisAlpha("z", value);
        this._changeAxisAlpha("xz", value);
        this._changeAxisAlpha("yz", value);
        break;
    }
  }

  private _initAxis(): void {
    this._translateControlMap = [
      {
        name: "x",
        axisMesh: [GizmoUtils.lineMesh, GizmoUtils.axisArrowMesh],
        axisMaterial: GizmoUtils.redMaterialTrans,
        axisHelperMesh: [GizmoUtils.axisHelperLineMesh],
        axisHelperMaterial: GizmoUtils.invisibleMaterialTrans,
        axisRotation: [X_AXIS_ROTATION, X_AXIS_ROTATION],
        axisTranslation: [LINE_TRANSLATION, END_TRANSLATION]
      },
      {
        name: "y",
        axisMesh: [GizmoUtils.lineMesh, GizmoUtils.axisArrowMesh],
        axisMaterial: GizmoUtils.greenMaterialTrans,
        axisHelperMesh: [GizmoUtils.axisHelperLineMesh],
        axisHelperMaterial: GizmoUtils.invisibleMaterialTrans,
        axisRotation: [Y_AXIS_ROTATION, new Vector3(0, 0, 0)],
        axisTranslation: [new Vector3(0, 0.75, 0), new Vector3(0, 1.5, 0)]
      },
      {
        name: "z",
        axisMesh: [GizmoUtils.lineMesh, GizmoUtils.axisArrowMesh],
        axisMaterial: GizmoUtils.blueMaterialTrans,
        axisHelperMesh: [GizmoUtils.axisHelperLineMesh],
        axisHelperMaterial: GizmoUtils.invisibleMaterialTrans,
        axisRotation: [Z_AXIS_ROTATION, Z_AXIS_ROTATION],
        axisTranslation: [new Vector3(0, 0, 0.75), new Vector3(0, 0, 1.5)]
      },
      {
        name: "xy",
        axisMesh: [GizmoUtils.axisPlaneMesh],
        axisMaterial: GizmoUtils.xyMaterial,
        axisHelperMesh: [GizmoUtils.axisHelperPlaneMesh],
        axisHelperMaterial: GizmoUtils.invisibleMaterialTrans,
        axisRotation: [XY_PLANE_ROTATION],
        axisTranslation: [PLANE_TRANSLATION]
      },
      {
        name: "yz",
        axisMesh: [GizmoUtils.axisPlaneMesh],
        axisMaterial: GizmoUtils.yzMaterial,
        axisHelperMesh: [GizmoUtils.axisHelperPlaneMesh],
        axisHelperMaterial: GizmoUtils.invisibleMaterialTrans,
        axisRotation: [YZ_PLANE_ROTATION],
        axisTranslation: [new Vector3(0, 0.25, 0.25)]
      },
      {
        name: "xz",
        axisMesh: [GizmoUtils.axisPlaneMesh],
        axisMaterial: GizmoUtils.xzMaterial,
        axisHelperMesh: [GizmoUtils.axisHelperPlaneMesh],
        axisHelperMaterial: GizmoUtils.invisibleMaterialTrans,
        axisRotation: [XZ_PLANE_ROTATION],
        axisTranslation: [new Vector3(0.25, 0, 0.25)]
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
  
  private _createReferenceLine(entity: Entity): void {
    console.log('_createReferenceLine')
    // Create reference line entity
    this._referenceLineEntity = entity.createChild("referenceLine");
    this._referenceLineEntity.isActive = false;

    // Create a long line mesh for reference that extends in both directions
    const lineLength = 1000; // Very long line to appear infinite
    const start = new Vector3(-lineLength, 0, 0); // Negative direction
    const end = new Vector3(lineLength, 0, 0);   // Positive direction
    this._referenceLineMesh = GizmoMesh.createLine(this.engine, [start, end]);
    
    // Add renderer
    const renderer = this._referenceLineEntity.addComponent(MeshRenderer);
    renderer.receiveShadows = false;
    renderer.castShadows = false;
    renderer.mesh = this._referenceLineMesh;
    
    // Create white material for the reference line
    const whiteMaterial = new UnlitMaterial(this.engine);
    whiteMaterial.isTransparent = true;
    whiteMaterial.renderState.depthState.enabled = false;
    whiteMaterial.baseColor.set(1, 1, 1, 0.5); // White with some transparency
    whiteMaterial.name = "referenceLineMaterial";
    
    renderer.setMaterial(whiteMaterial);
  }
  
  private _showReferenceLine(axisName: string): void {
    console.log('_showReferenceLine', axisName, this._referenceLineEntity);
    if (!this._referenceLineEntity) return;
    
    // Reset rotation
    // this._referenceLineEntity.transform.rotation.set(0, 0, 0);
    
    // Show the reference line
    
    // Update the scale to match the current gizmo scale
    this._referenceLineEntity.transform.scale.set(this._tempScale, this._tempScale, this._tempScale);
    
    // Update the position to match the current gizmo position
    // This ensures the reference line follows the gizmo when it moves
    this._referenceLineEntity.transform.worldMatrix = this.gizmoEntity.transform.worldMatrix.clone();

    // Set rotation based on axis
    switch (axisName) {
      case "x":
        // X axis is default
        break;
      case "y":
        // Rotate to align with Y axis
        this._referenceLineEntity.transform.rotation.set(0, 0, 90);
        break;
      case "z":
        // Rotate to align with Z axis
        this._referenceLineEntity.transform.rotation.set(0, -90, 0);
        break;
    }

    this._referenceLineEntity.isActive = true;
        
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

  private _resizeControl(isModified: boolean = false): void {
    const { _tempMat, _tempVec0 } = this;
    const cameraPosition = this._camera.entity.transform.worldPosition;
    this._group.getWorldMatrix(_tempMat);

    if (this._camera.isOrthographic) {
      this._tempScale = this._camera.orthographicSize * GizmoUtils.scaleFactor * 3;
    } else {
      _tempVec0.set(_tempMat.elements[12], _tempMat.elements[13], _tempMat.elements[14]);
      this._tempScale = this._scale = Vector3.distance(cameraPosition, _tempVec0) * GizmoUtils.scaleFactor;
    }
    this.gizmoEntity.transform.worldMatrix = this.gizmoHelperEntity.transform.worldMatrix = _tempMat.scale(
      _tempVec0.set(this._tempScale, this._tempScale, this._tempScale)
    );
    
    if (this._referenceLineEntity && this._referenceLineEntity.isActive) {
      this._referenceLineEntity.transform.scale.set(this._tempScale, this._tempScale, this._tempScale);
    }
  }

  private _changeAxisAlpha(axisName: string, value: number) {
    const entity = this.gizmoEntity.findByName(axisName);
    if (entity) {
      const component = entity.getComponent(Axis);
      component.alpha(value);
    }
  }
}
