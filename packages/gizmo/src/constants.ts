import { Color, Vector3, UnlitMaterial, Engine, CullMode, ModelMesh, PrimitiveMesh } from "@galacean/engine";
import { State } from "./enums/GizmoState";
import { GizmoMesh } from "./GizmoMesh";

/**
 * Constants for Gizmo materials, sizes, and positions
 */

// Base colors
export const RED_COLOR = new Color(1.0, 0.0, 0.0, 1.0);
export const GREEN_COLOR = new Color(0.0, 1.0, 0.0, 1.0);
export const BLUE_COLOR = new Color(0.0, 0.0, 1.0, 1.0);
export const LIGHT_RED_COLOR = new Color(1.0, 0.0, 0.0, 0.9);
export const LIGHT_GREEN_COLOR = new Color(0.0, 1.0, 0.0, 0.9);
export const LIGHT_BLUE_COLOR = new Color(0.0, 0.0, 1.0, 0.9);
export const INVISIBLE_COLOR = new Color(0.0, 0.0, 0.0, 0.0);

// Composite colors
export const XY_COLOR = Color.lerp(RED_COLOR, GREEN_COLOR, 0.5, new Color());
export const XZ_COLOR = Color.lerp(RED_COLOR, BLUE_COLOR, 0.5, new Color());
export const YZ_COLOR = Color.lerp(GREEN_COLOR, BLUE_COLOR, 0.5, new Color());
export const XYZ_COLOR = Color.lerp(Color.lerp(RED_COLOR, GREEN_COLOR, 0.5, new Color()), BLUE_COLOR, 0.5, new Color());
export const YELLOW_COLOR = Color.lerp(RED_COLOR, GREEN_COLOR, 0.5, new Color())
export const GREY_COLOR = new Color(0.5225215539683921, 0.5225215539683921, 0.5225215539683921, 1.0);
export const LIGHT_GREY_COLOR = new Color(0.44798841244188325, 0.44798841244188325, 0.44798841244188325, 1.0);
export const RECT_COLOR = new Color(0.3662525955988395, 0.4072402119017367, 0.45641102318040466, 1.0);
export const ROTATE_PLANE_COLOR = new Color(1.0, 0.8900054069935289, 0.0, 0.2);

// Sizes
export const ROTATE_CIRCLE_RADIUS = 1.6;
export const RECT_FACTOR = 0.05;

// Line sizes
export const LINE_RADIUS = 0.005;
export const LINE_LENGTH = 1.5;
export const LINE_LENGTH_SHORT = 1.3;

// Arrow sizes
export const ARROW_RADIUS = 0.05;
export const ARROW_HEIGHT = 0.4;
export const ARROW_SEGMENTS = 8;

// Plane sizes
export const PLANE_SIZE = 0.5;
export const HELPER_PLANE_SIZE = 0.75;

// Cube sizes
export const CUBE_SIZE = 0.32;
export const END_CUBE_SIZE = 0.25;

// Sphere and torus sizes
export const SPHERE_RADIUS = 1.8;
export const SPHERE_SEGMENTS = 48;
export const TORUS_RADIUS = 1.6;
export const TORUS_TUBE_RADIUS = 0.02;
export const HELPER_TORUS_TUBE_RADIUS = 0.24;
export const XYZ_TORUS_RADIUS = 1.8;

// Helper sizes
export const HELPER_LINE_RADIUS = 0.15;
export const HELPER_LINE_LENGTH = 1.75;

// Positions and directions
export const X_AXIS_POSITIVE = new Vector3(-1, 0, 0);
export const Y_AXIS_POSITIVE = new Vector3(0, -1, 0);
export const Z_AXIS_POSITIVE = new Vector3(0, 0, -1);

// Translations
export const LINE_TRANSLATION = new Vector3(0.75, 0, 0);
export const END_TRANSLATION = new Vector3(1.5, 0, 0);
export const PLANE_TRANSLATION = new Vector3(0.25, 0.25, 0);

// Rotations
export const X_AXIS_ROTATION = new Vector3(0, 0, -90);
export const Y_AXIS_ROTATION = new Vector3(0, 90, 0);
export const Z_AXIS_ROTATION = new Vector3(0, 90, 90);
export const XY_PLANE_ROTATION = new Vector3(0, 90, 90);
export const YZ_PLANE_ROTATION = new Vector3(90, 90, 0);
export const XZ_PLANE_ROTATION = new Vector3(0, 0, 0);

/**
 * Utility class for Gizmo materials, meshes, and other shared resources
 */
export class GizmoUtils {
  static scaleFactor = 0.05773502691896257;

  // Translate materials
  static redMaterialTrans: UnlitMaterial;
  static greenMaterialTrans: UnlitMaterial;
  static blueMaterialTrans: UnlitMaterial;
  static lightRedMaterial: UnlitMaterial;
  static lightGreenMaterial: UnlitMaterial;
  static lightBlueMaterial: UnlitMaterial;
  static invisibleMaterialTrans: UnlitMaterial;
  static yzMaterial: UnlitMaterial;
  static xzMaterial: UnlitMaterial;
  static xyMaterial: UnlitMaterial;

  // Rotate materials
  static redArcMaterial: UnlitMaterial;
  static greenArcMaterial: UnlitMaterial;
  static blueArcMaterial: UnlitMaterial;
  static yellowMaterial: UnlitMaterial;
  static rotatePlaneMaterial: UnlitMaterial;
  static invisibleMaterialRotate: UnlitMaterial;
  static invisibleMaterialCircle: UnlitMaterial;

  // Scale materials
  static redMaterialScale: UnlitMaterial;
  static greenMaterialScale: UnlitMaterial;
  static blueMaterialScale: UnlitMaterial;
  static greyMaterial: UnlitMaterial;
  static lightMaterial: UnlitMaterial;
  static invisibleMaterialScale: UnlitMaterial;

  // Rect materials
  static visibleMaterialRect: UnlitMaterial;
  static invisibleMaterialRect: UnlitMaterial;

  // Meshes
  static lineMesh: ModelMesh;
  static lineMeshShort: ModelMesh;
  static axisXTorusMesh: ModelMesh;
  static axisYTorusMesh: ModelMesh;
  static axisZTorusMesh: ModelMesh;
  static axisXYZTorusMesh: ModelMesh;
  static axisHelpertorusMesh: ModelMesh;
  static axisHelperLineMesh: ModelMesh;
  static axisHelperPlaneMesh: ModelMesh;
  static axisArrowMesh: ModelMesh;
  static axisPlaneMesh: ModelMesh;
  static axisCubeMesh: ModelMesh;
  static axisSphereMesh: ModelMesh;
  static axisEndCubeMesh: ModelMesh;

  // Axis vectors
  static xAxisPositive: Vector3;
  static yAxisPositive: Vector3;
  static zAxisPositive: Vector3;

  /**
   * Initialize all materials and meshes
   * @param engine - Engine instance
   */
  static init(engine: Engine): void {
    // Initialize materials
    this._initMaterials(engine);
    
    // Initialize meshes
    this._initMeshes(engine);
    
    // Initialize axis vectors
    this.xAxisPositive = X_AXIS_POSITIVE;
    this.yAxisPositive = Y_AXIS_POSITIVE;
    this.zAxisPositive = Z_AXIS_POSITIVE;
  }

  /**
   * Initialize all materials
   * @private
   */
  private static _initMaterials(engine: Engine): void {
    // Translate materials
    this.redMaterialTrans = this._createMaterial(engine, State.translate, RED_COLOR);
    this.greenMaterialTrans = this._createMaterial(engine, State.translate, GREEN_COLOR);
    this.blueMaterialTrans = this._createMaterial(engine, State.translate, BLUE_COLOR);
    this.lightRedMaterial = this._createMaterial(engine, State.translate, LIGHT_RED_COLOR);
    this.lightGreenMaterial = this._createMaterial(engine, State.translate, LIGHT_GREEN_COLOR);
    this.lightBlueMaterial = this._createMaterial(engine, State.translate, LIGHT_BLUE_COLOR);
    this.invisibleMaterialTrans = this._createMaterial(engine, State.translate, INVISIBLE_COLOR);
    
    // Plane materials
    this.yzMaterial = this._createMaterial(engine, State.translate, YZ_COLOR);
    this.xzMaterial = this._createMaterial(engine, State.translate, XZ_COLOR);
    this.xyMaterial = this._createMaterial(engine, State.translate, XY_COLOR);

    // Rotate materials
    this.redArcMaterial = this._createMaterial(engine, State.rotate, RED_COLOR);
    this.greenArcMaterial = this._createMaterial(engine, State.rotate, GREEN_COLOR);
    this.blueArcMaterial = this._createMaterial(engine, State.rotate, BLUE_COLOR);
    this.yellowMaterial = this._createMaterial(engine, State.rotate, YELLOW_COLOR);
    this.rotatePlaneMaterial = this._createMaterial(engine, State.rotate, ROTATE_PLANE_COLOR, true);
    this.invisibleMaterialRotate = this._createMaterial(engine, State.rotate, INVISIBLE_COLOR, true);
    this.invisibleMaterialCircle = this._createMaterial(engine, State.rotate, INVISIBLE_COLOR);

    // Scale materials
    this.redMaterialScale = this._createMaterial(engine, State.scale, RED_COLOR);
    this.greenMaterialScale = this._createMaterial(engine, State.scale, GREEN_COLOR);
    this.blueMaterialScale = this._createMaterial(engine, State.scale, BLUE_COLOR);
    this.greyMaterial = this._createMaterial(engine, State.scale, GREY_COLOR);
    this.lightMaterial = this._createMaterial(engine, State.scale, LIGHT_GREY_COLOR);
    this.invisibleMaterialScale = this._createMaterial(engine, State.scale, INVISIBLE_COLOR);

    // Rect materials
    this.visibleMaterialRect = this._createMaterial(engine, State.rect, RECT_COLOR);
    this.invisibleMaterialRect = this._createMaterial(engine, State.rect, INVISIBLE_COLOR);
  }

  /**
   * Initialize all meshes
   * @private
   */
  private static _initMeshes(engine: Engine): void {
    // Line meshes
    this.lineMesh = PrimitiveMesh.createCylinder(engine, LINE_RADIUS, LINE_RADIUS, LINE_LENGTH);
    this.lineMeshShort = PrimitiveMesh.createCylinder(engine, LINE_RADIUS, LINE_RADIUS, LINE_LENGTH_SHORT);
    
    // Arrow mesh
    this.axisArrowMesh = PrimitiveMesh.createCone(engine, ARROW_RADIUS, ARROW_HEIGHT, ARROW_SEGMENTS);
    
    // Plane mesh
    this.axisPlaneMesh = PrimitiveMesh.createPlane(engine, PLANE_SIZE, PLANE_SIZE);
    
    // Cube meshes
    this.axisCubeMesh = PrimitiveMesh.createCuboid(engine, CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);
    this.axisEndCubeMesh = PrimitiveMesh.createCuboid(engine, END_CUBE_SIZE, END_CUBE_SIZE, END_CUBE_SIZE);
    
    // Sphere mesh
    this.axisSphereMesh = PrimitiveMesh.createSphere(engine, SPHERE_RADIUS, SPHERE_SEGMENTS);
    
    // Torus meshes
    this.axisXTorusMesh = GizmoMesh.createCircleTube(engine, Math.PI, TORUS_RADIUS, TORUS_TUBE_RADIUS);
    this.axisYTorusMesh = GizmoMesh.createCircleTube(engine, Math.PI, TORUS_RADIUS, TORUS_TUBE_RADIUS);
    this.axisZTorusMesh = GizmoMesh.createCircleTube(engine, Math.PI, TORUS_RADIUS, TORUS_TUBE_RADIUS);
    this.axisXYZTorusMesh = GizmoMesh.createCircleTube(engine, 2 * Math.PI, XYZ_TORUS_RADIUS, TORUS_TUBE_RADIUS);
    
    // Helper meshes
    this.axisHelperLineMesh = PrimitiveMesh.createCylinder(engine, HELPER_LINE_RADIUS, HELPER_LINE_RADIUS, HELPER_LINE_LENGTH);
    this.axisHelperPlaneMesh = PrimitiveMesh.createPlane(engine, HELPER_PLANE_SIZE, HELPER_PLANE_SIZE);
    this.axisHelpertorusMesh = GizmoMesh.createCircleTube(engine, Math.PI, TORUS_RADIUS, HELPER_TORUS_TUBE_RADIUS);
  }

  /**
   * Creates a material with the specified color and properties
   * @private
   */
  private static _createMaterial(
    engine: Engine,
    name: State,
    color: Color,
    cullOff: boolean = false
  ): UnlitMaterial {
    const material = new UnlitMaterial(engine);
    material.isTransparent = true;
    material.renderState.depthState.enabled = false;
    material.baseColor.copyFrom(color);
    material.name = name.toString();
    
    
    if (cullOff) {
      material.renderState.rasterState.cullMode = CullMode.Off;
    }
    
    return material;
  }
}
