import { Camera, Entity, Plane, Ray, Vector3, Matrix, MeshRenderer, UnlitMaterial, ModelMesh, Shader, ShaderData, Color } from "@galacean/engine";

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
  private _referenceLineEntityX: Entity;
  private _referenceLineEntityY: Entity;
  private _referenceLineEntityZ: Entity;
  private _referenceLineMeshX: ModelMesh;
  private _referenceLineMeshY: ModelMesh;
  private _referenceLineMeshZ: ModelMesh;
  private _referenceLineMaterialX: UnlitMaterial;
  private _referenceLineMaterialY: UnlitMaterial;
  private _referenceLineMaterialZ: UnlitMaterial;

  constructor(entity: Entity) {
    super(entity);
    this.type = State.translate;
    this._initAxis();
    this._createAxis(entity);
    this._createReferenceLines(entity);
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
    
    // Hide all reference lines
    this._referenceLineEntityX.isActive = false;
    this._referenceLineEntityY.isActive = false;
    this._referenceLineEntityZ.isActive = false;
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
    
    // Hide all reference lines
    this._referenceLineEntityX.isActive = false;
    this._referenceLineEntityY.isActive = false;
    this._referenceLineEntityZ.isActive = false;
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
  
  private _createReferenceLines(entity: Entity): void {
    const lineLength = 1000; // Very long line to appear infinite
    
    // Create shader for gradient lines if it doesn't exist
    if (!Shader.find("gradientLine")) {
      this._createGradientLineShader();
    }
    
    // Create X axis reference line
    this._referenceLineEntityX = entity.createChild("referenceLineX");
    this._referenceLineEntityX.isActive = false;
    const startX = new Vector3(-lineLength, 0, 0);
    const endX = new Vector3(lineLength, 0, 0);
    this._referenceLineMeshX = GizmoMesh.createLine(this.engine, [startX, endX]);
    
    // Create Y axis reference line
    this._referenceLineEntityY = entity.createChild("referenceLineY");
    this._referenceLineEntityY.isActive = false;
    const startY = new Vector3(0, -lineLength, 0);
    const endY = new Vector3(0, lineLength, 0);
    this._referenceLineMeshY = GizmoMesh.createLine(this.engine, [startY, endY]);
    
    // Create Z axis reference line
    this._referenceLineEntityZ = entity.createChild("referenceLineZ");
    this._referenceLineEntityZ.isActive = false;
    const startZ = new Vector3(0, 0, -lineLength);
    const endZ = new Vector3(0, 0, lineLength);
    this._referenceLineMeshZ = GizmoMesh.createLine(this.engine, [startZ, endZ]);
    
    // Create materials for each line with matching colors
    this._referenceLineMaterialX = this._createGradientMaterial(GizmoUtils.redMaterialTrans.baseColor);
    this._referenceLineMaterialY = this._createGradientMaterial(GizmoUtils.greenMaterialTrans.baseColor);
    this._referenceLineMaterialZ = this._createGradientMaterial(GizmoUtils.blueMaterialTrans.baseColor);
    
    // Add renderers for each line
    const rendererX = this._referenceLineEntityX.addComponent(MeshRenderer);
    rendererX.receiveShadows = false;
    rendererX.castShadows = false;
    rendererX.mesh = this._referenceLineMeshX;
    rendererX.setMaterial(this._referenceLineMaterialX);
    
    const rendererY = this._referenceLineEntityY.addComponent(MeshRenderer);
    rendererY.receiveShadows = false;
    rendererY.castShadows = false;
    rendererY.mesh = this._referenceLineMeshY;
    rendererY.setMaterial(this._referenceLineMaterialY);
    
    const rendererZ = this._referenceLineEntityZ.addComponent(MeshRenderer);
    rendererZ.receiveShadows = false;
    rendererZ.castShadows = false;
    rendererZ.mesh = this._referenceLineMeshZ;
    rendererZ.setMaterial(this._referenceLineMaterialZ);
  }
  
  private _createGradientLineShader(): void {
    const vertexSource = `
      #include <common>
      #include <common_vert>
      
      uniform mat4 u_MVPMat;
      
      attribute vec3 a_Position;
      
      varying float v_Distance;
      
      void main() {
        gl_Position = u_MVPMat * vec4(a_Position, 1.0);
        v_Distance = length(a_Position);
      }
    `;
    
    const fragmentSource = `
      #include <common>
      
      uniform vec4 u_LineColor;
      uniform float u_MaxDistance;
      
      varying float v_Distance;
      
      void main() {
        float normalizedDistance = v_Distance / u_MaxDistance;
        float alpha = max(0.0, 1.0 - normalizedDistance);
        gl_FragColor = vec4(u_LineColor.rgb, u_LineColor.a * alpha);
      }
    `;
    
    Shader.create("gradientLine", vertexSource, fragmentSource);
  }
  
  private _createGradientMaterial(color: Color): UnlitMaterial {
    const material = new UnlitMaterial(this.engine);
    // material.shader = Shader.find("gradientLine")

    material.isTransparent = true;
    material.renderState.depthState.enabled = false;
    
    material.shaderData.setColor("u_LineColor", color);
    material.shaderData.setFloat("u_MaxDistance", 50.0);
    
    return material;
  }
  
  private _showReferenceLine(axisName: string): void {
    // Hide all reference lines first
    this._referenceLineEntityX.isActive = false;
    this._referenceLineEntityY.isActive = false;
    this._referenceLineEntityZ.isActive = false;
    
    // Show the appropriate reference line based on the axis
    let referenceLine: Entity;
    switch (axisName) {
      case "x":
        referenceLine = this._referenceLineEntityX;
        break;
      case "y":
        referenceLine = this._referenceLineEntityY;
        break;
      case "z":
        referenceLine = this._referenceLineEntityZ;
        break;
      default:
        return; // No reference line for plane controls
    }
    
    if (referenceLine) {
      // Show the reference line
      referenceLine.isActive = true;
      
      // Update the scale to match the current gizmo scale
      referenceLine.transform.scale.set(this._tempScale, this._tempScale, this._tempScale);
      
      // Update the position to match the current gizmo position
      referenceLine.transform.worldMatrix = this.gizmoEntity.transform.worldMatrix.clone();
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
    
    // Update reference lines if any are active
    if (this._referenceLineEntityX.isActive) {
      this._referenceLineEntityX.transform.scale.set(this._tempScale, this._tempScale, this._tempScale);
      this._referenceLineEntityX.transform.worldMatrix = _tempMat.clone();
    }
    if (this._referenceLineEntityY.isActive) {
      this._referenceLineEntityY.transform.scale.set(this._tempScale, this._tempScale, this._tempScale);
      this._referenceLineEntityY.transform.worldMatrix = _tempMat.clone();
    }
    if (this._referenceLineEntityZ.isActive) {
      this._referenceLineEntityZ.transform.scale.set(this._tempScale, this._tempScale, this._tempScale);
      this._referenceLineEntityZ.transform.worldMatrix = _tempMat.clone();
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
