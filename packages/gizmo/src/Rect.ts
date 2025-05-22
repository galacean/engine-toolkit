import {
  BoundingBox,
  Camera,
  Entity,
  Matrix,
  MeshRenderer,
  MeshTopology,
  ModelMesh,
  ParticleRenderer,
  Plane,
  Pointer,
  PrimitiveMesh,
  Quaternion,
  Ray,
  Renderer,
  SkinnedMeshRenderer,
  SpriteMask,
  SpriteRenderer,
  SubMesh,
  TextRenderer,
  Transform,
  Vector2,
  Vector3
} from "@galacean/engine";
import { UITransform } from "@galacean/engine-ui";
import { Gizmo } from "./Gizmo";
import { Group } from "./Group";
import { GizmoComponent } from "./Type";
import { Utils } from "./Utils";
import { State } from "./enums/GizmoState";
import { AnchorType, CoordinateType } from "./enums/GroupState";
import { Icon } from "./icon/Icon";

enum CoordinatePlane {
  None,
  XoY,
  XoZ,
  YoZ
}

export class RectControl extends GizmoComponent {
  private static _matrix0: Matrix = new Matrix();
  private static _matrix1: Matrix = new Matrix();
  private static _bounds: BoundingBox = new BoundingBox();
  private static _vec30: Vector3 = new Vector3();
  private static _vec31: Vector3 = new Vector3();
  private static _vec32: Vector3 = new Vector3();
  private static _vec33: Vector3 = new Vector3();

  private _startPriority = 99999999;
  // 当前操作的辅助线
  private _axisName: string = "";
  // 当前操作的平面
  private _mostSuitablePlane: CoordinatePlane = CoordinatePlane.None;
  // 中间层，他的子节点是三个平面（XoY，XoZ，YoZ）
  private _middleEntity: Entity;
  // Vertex 的拾取半径
  private _pickRadius: number = 0.4;
  // 是否锁定平面
  private _lockPlane: boolean = false;
  // 本帧光标格式
  private _cursorType: string = "default";

  private _group: Group;
  private _camera: Camera;
  private _bounds: BoundingBox = new BoundingBox();
  private _tempBounds: BoundingBox = new BoundingBox();
  private _tempMatrix: Matrix = new Matrix();

  // ------- XoY 平面开始 -------
  private _XoY: Entity;
  // 四条边
  private _sideXoYLeft: Entity;
  private _sideXoYTop: Entity;
  private _sideXoYRight: Entity;
  private _sideXoYDown: Entity;
  // 四个点
  private _vertexXoYLeftTop: Entity;
  private _vertexXoYRightTop: Entity;
  private _vertexXoYRightDown: Entity;
  private _vertexXoYLeftDown: Entity;
  // 平面
  private _planeXoY: Entity;
  // 锚点
  private _centerXoY: Entity;
  private _centerXoYPick: MeshRenderer;
  // ------- XoY 平面结束 -------

  // ------- XoZ 平面开始 -------
  private _XoZ: Entity;
  // 四条边
  private _sideXoZLeft: Entity;
  private _sideXoZTop: Entity;
  private _sideXoZRight: Entity;
  private _sideXoZDown: Entity;
  // 四个点
  private _vertexXoZLeftTop: Entity;
  private _vertexXoZRightTop: Entity;
  private _vertexXoZRightDown: Entity;
  private _vertexXoZLeftDown: Entity;
  // 平面
  private _planeXoZ: Entity;
  // 锚点
  private _centerXoZ: Entity;
  private _centerXoZPick: MeshRenderer;
  // ------- XoZ 平面结束 -------

  // ------- YoZ 平面开始 -------
  private _YoZ: Entity;
  // 四条边
  private _sideYoZLeft: Entity;
  private _sideYoZTop: Entity;
  private _sideYoZRight: Entity;
  private _sideYoZDown: Entity;
  // 四个点
  private _vertexYoZLeftTop: Entity;
  private _vertexYoZRightTop: Entity;
  private _vertexYoZRightDown: Entity;
  private _vertexYoZLeftDown: Entity;
  // 平面
  private _planeYoZ: Entity;
  // 锚点
  private _centerYoZ: Entity;
  private _centerYoZPick: MeshRenderer;
  // ------- YoZ 平面结束 -------
  // 判断光标方向
  private _cursorTempVec30: Vector3 = new Vector3();
  private _cursorTempVec31: Vector3 = new Vector3();
  // 计算包围盒的临时矩阵
  private _tempLocalMatrix: Matrix = new Matrix();
  // 点击开始时 Group 的世界矩阵
  private _startWorldMatrix: Matrix = new Matrix();
  // 点击开始时 Group 的世界逆矩阵
  private _startWorldInvMatrix: Matrix = new Matrix();
  // 点击开始时 UIRender 的锚点（仅在移动锚点时生效）
  private _startPivot: Vector2 = new Vector2();
  // 点击开始时 UIRender 的局部位置
  private _startPosition: Vector3 = new Vector3();
  // 局部平面，会随着当前面向的平面发生改变
  private _curLocalPlane: Plane = new Plane(new Vector3(0, 1, 0), 0);
  private _startHitLocalPosition: Vector3 = new Vector3();
  private _curHitLocalPosition: Vector3 = new Vector3();
  // 这个 matrix 是带缩放的
  private _fromMatrix: Matrix = new Matrix();
  private _fromScale: Vector3 = new Vector3();
  private _tempAffineTranslate: Vector3 = new Vector3();
  private _tempAffineQuat: Quaternion = new Quaternion();
  private _tempAffineScale: Vector3 = new Vector3();
  // 计算拖动边和顶点时的临时变量
  private _fixedLocalPoint: Vector3 = new Vector3();
  private _fixedWorldPoint: Vector3 = new Vector3();
  private _tempVec30: Vector3 = new Vector3();
  private _tempVec31: Vector3 = new Vector3();
  private _uiTransformInfoMap = new Map<UITransform, { width: number; height: number }>();
  private _mat0: Matrix = new Matrix();
  private _mat1: Matrix = new Matrix();
  private _mat2: Matrix = new Matrix();
  private _mat3: Matrix = new Matrix();
  private _mat4: Matrix = new Matrix();

  constructor(entity: Entity) {
    super(entity);
    this.type = State.rect;
  }

  /** Get group when init gizmo. */
  init(camera: Camera, group: Group): void {
    this._camera = camera;
    this._group = group;
    this._middleEntity = this.entity.createChild("transitEntity");
    const v = Math.sqrt(2) * this._pickRadius;
    // XoY 平面
    {
      const entityXoY = (this._XoY = this._middleEntity.createChild("XoY"));
      this._sideXoYLeft = this._createSide(entityXoY, "sideXoYLeft", new Vector3(-0.5, 0, 0), new Vector3(0, 0, 0));
      this._sideXoYTop = this._createSide(entityXoY, "sideXoYTop", new Vector3(0, 0.5, 0), new Vector3(0, 0, 90));
      this._sideXoYRight = this._createSide(entityXoY, "sideXoYRight", new Vector3(0.5, 0, 0), new Vector3(0, 0, 0));
      this._sideXoYDown = this._createSide(entityXoY, "sideXoYDown", new Vector3(0, -0.5, 0), new Vector3(0, 0, 90));
      this._vertexXoYLeftTop = this._createVertex(
        entityXoY,
        "vertexXoYLeftTop",
        new Vector3(-0.5, 0.5, 0),
        new Vector3(-v, v, 0)
      );
      this._vertexXoYRightTop = this._createVertex(
        entityXoY,
        "vertexXoYRightTop",
        new Vector3(0.5, 0.5, 0),
        new Vector3(v, v, 0)
      );
      this._vertexXoYRightDown = this._createVertex(
        entityXoY,
        "vertexXoYRightDown",
        new Vector3(0.5, -0.5, 0),
        new Vector3(v, -v, 0)
      );
      this._vertexXoYLeftDown = this._createVertex(
        entityXoY,
        "vertexXoYLeftDown",
        new Vector3(-0.5, -0.5, 0),
        new Vector3(-v, -v, 0)
      );

      this._planeXoY = this._createPlane(entityXoY, "planeXoY", new Vector3(90, 0, 0));
      this._centerXoY = this._createCenter(entityXoY, "centerXoY");
      this._centerXoYPick = this._createCenterPick(this._centerXoY);
    }
    // XoZ 平面
    {
      const entityXoZ = (this._XoZ = this._middleEntity.createChild("XoZ"));
      this._sideXoZLeft = this._createSide(entityXoZ, "sideXoZLeft", new Vector3(-0.5, 0, 0), new Vector3(90, 0, 0));
      this._sideXoZTop = this._createSide(entityXoZ, "sideXoZTop", new Vector3(0, 0, 0.5), new Vector3(0, 0, 90));
      this._sideXoZRight = this._createSide(entityXoZ, "sideXoZRight", new Vector3(0.5, 0, 0), new Vector3(90, 0, 0));
      this._sideXoZDown = this._createSide(entityXoZ, "sideXoZDown", new Vector3(0, 0, -0.5), new Vector3(0, 0, 90));
      this._vertexXoZLeftTop = this._createVertex(
        entityXoZ,
        "vertexXoZLeftTop",
        new Vector3(-0.5, 0, 0.5),
        new Vector3(-v, 0, v)
      );
      this._vertexXoZRightTop = this._createVertex(
        entityXoZ,
        "vertexXoZRightTop",
        new Vector3(0.5, 0, 0.5),
        new Vector3(v, 0, v)
      );
      this._vertexXoZRightDown = this._createVertex(
        entityXoZ,
        "vertexXoZRightDown",
        new Vector3(0.5, 0, -0.5),
        new Vector3(v, 0, -v)
      );
      this._vertexXoZLeftDown = this._createVertex(
        entityXoZ,
        "vertexXoZLeftDown",
        new Vector3(-0.5, 0, -0.5),
        new Vector3(-v, 0, -v)
      );
      this._planeXoZ = this._createPlane(entityXoZ, "planeXoZ", new Vector3(0, 0, 0));
      this._centerXoZ = this._createCenter(entityXoZ, "centerXoZ");
      this._centerXoZPick = this._createCenterPick(this._centerXoZ);
    }
    // YoZ 平面
    {
      const entityYoZ = (this._YoZ = this._middleEntity.createChild("YoZ"));
      this._sideYoZLeft = this._createSide(entityYoZ, "sideYoZLeft", new Vector3(0, -0.5, 0), new Vector3(90, 0, 0));
      this._sideYoZTop = this._createSide(entityYoZ, "sideYoZTop", new Vector3(0, 0, 0.5), new Vector3(0, 0, 0));
      this._sideYoZRight = this._createSide(entityYoZ, "sideYoZRight", new Vector3(0, 0.5, 0), new Vector3(90, 0, 0));
      this._sideYoZDown = this._createSide(entityYoZ, "sideYoZDown", new Vector3(0, 0, -0.5), new Vector3(0, 0, 0));
      this._vertexYoZLeftTop = this._createVertex(
        entityYoZ,
        "vertexYoZLeftTop",
        new Vector3(0, -0.5, 0.5),
        new Vector3(0, -v, v)
      );
      this._vertexYoZRightTop = this._createVertex(
        entityYoZ,
        "vertexYoZRightTop",
        new Vector3(0, 0.5, 0.5),
        new Vector3(0, v, v)
      );
      this._vertexYoZRightDown = this._createVertex(
        entityYoZ,
        "vertexYoZRightDown",
        new Vector3(0, 0.5, -0.5),
        new Vector3(0, v, -v)
      );
      this._vertexYoZLeftDown = this._createVertex(
        entityYoZ,
        "vertexYoZLeftDown",
        new Vector3(0, -0.5, -0.5),
        new Vector3(0, -v, -v)
      );
      this._planeYoZ = this._createPlane(entityYoZ, "planeYoZ", new Vector3(0, 0, 90));
      this._centerYoZ = this._createCenter(entityYoZ, "centerYoZ");
      this._centerYoZPick = this._createCenterPick(this._centerYoZ);
    }
  }

  /** Called when pointer enters gizmo. */
  onHoverStart(axisName: string): void {
    switch (axisName) {
      case "sideXoYLeft":
      case "sideXoYTop":
      case "sideXoYRight":
      case "sideXoYDown":
      case "sideXoZLeft":
      case "sideXoZTop":
      case "sideXoZRight":
      case "sideXoZDown":
      case "sideYoZLeft":
      case "sideYoZTop":
      case "sideYoZRight":
      case "sideYoZDown":
        this._onHoverSideStart(axisName);
        break;
      case "planeXoY":
      case "planeXoZ":
      case "planeYoZ":
        this._onHoverPlaneStart();
        break;
      case "centerXoY":
      case "centerXoZ":
      case "centerYoZ":
        this._onHoverCenterStart();
        break;
      case "vertexXoYRightDown":
      case "vertexXoYRightTop":
      case "vertexXoYLeftDown":
      case "vertexXoYLeftTop":
      case "vertexXoZRightDown":
      case "vertexXoZRightTop":
      case "vertexXoZLeftDown":
      case "vertexXoZLeftTop":
      case "vertexYoZRightDown":
      case "vertexYoZRightTop":
      case "vertexYoZLeftDown":
      case "vertexYoZLeftTop":
        this._onHoverVertexStart(axisName);
        break;
      case "vertexXoYRightDownRotate":
      case "vertexXoYRightTopRotate":
      case "vertexXoYLeftDownRotate":
      case "vertexXoYLeftTopRotate":
      case "vertexXoZRightDownRotate":
      case "vertexXoZRightTopRotate":
      case "vertexXoZLeftDownRotate":
      case "vertexXoZLeftTopRotate":
      case "vertexYoZRightDownRotate":
      case "vertexYoZRightTopRotate":
      case "vertexYoZLeftDownRotate":
      case "vertexYoZLeftTopRotate":
        this._onHoverRotateStart();
        break;
      default:
        break;
    }
    this.engine.dispatch("RectCursorChange", this._cursorType);
  }

  private _onHoverVertexStart(axisName: string): void {
    const { min, max } = this._bounds;
    const point1 = this._cursorTempVec30;
    const point2 = this._cursorTempVec31;
    switch (axisName) {
      case "vertexXoYRightDown":
        point1.set(min.x, max.y, (max.z + min.z) / 2);
        break;
      case "vertexXoYRightTop":
        point1.set(min.x, min.y, (max.z + min.z) / 2);
        break;
      case "vertexXoYLeftDown":
        point1.set(max.x, max.y, (max.z + min.z) / 2);
        break;
      case "vertexXoYLeftTop":
        point1.set(max.x, min.y, (max.z + min.z) / 2);
        break;
      case "vertexXoZRightDown":
        point1.set(min.x, (max.y + min.y) / 2, max.z);
        break;
      case "vertexXoZRightTop":
        point1.set(min.x, (max.y + min.y) / 2, min.z);
        break;
      case "vertexXoZLeftDown":
        point1.set(max.x, (max.y + min.y) / 2, max.z);
        break;
      case "vertexXoZLeftTop":
        point1.set(max.x, (max.y + min.y) / 2, min.z);
        break;
      case "vertexYoZRightDown":
        point1.set((max.x + min.x) / 2, min.y, max.z);
        break;
      case "vertexYoZRightTop":
        point1.set((max.x + min.x) / 2, min.y, min.z);
        break;
      case "vertexYoZLeftDown":
        point1.set((max.x + min.x) / 2, max.y, max.z);
        break;
      case "vertexYoZLeftTop":
        point1.set((max.x + min.x) / 2, max.y, min.z);
        break;
      default:
        break;
    }
    point2.set((max.x + min.x) * 0.5, (max.y + min.y) * 0.5, (max.z + min.z) * 0.5);
    this._changeCursorByPoint(point1, point2);
  }

  private _canMoveCenter(): boolean {
    const entities = this._group.entities;
    let isValid = false;
    let count: number = 0;
    for (let i = 0, n = entities.length; i < n; i++) {
      const entity = entities[i];
      if (!entity.isActiveInHierarchy) continue;
      if (++count > 1) {
        return false;
      }
      if (this._isUITransform(entity)) {
        isValid = true;
      }
    }
    return isValid;
  }

  private _onHoverPlaneStart(): void {
    this._cursorType = "move";
  }

  private _onHoverRotateStart(): void {
    this._cursorType = "alias";
  }

  private _onHoverCenterStart(): void {
    this._cursorType = "cell";
  }

  private _onHoverSideStart(axisName: string): void {
    const { min, max } = this._bounds;
    const point1 = this._cursorTempVec30;
    const point2 = this._cursorTempVec31;
    switch (axisName) {
      case "sideXoYLeft":
      case "sideXoZLeft":
        point1.set(max.x, (max.y + min.y) / 2, (max.z + min.z) / 2);
        break;
      case "sideXoYRight":
      case "sideXoZRight":
        point1.set(min.x, (max.y + min.y) / 2, (max.z + min.z) / 2);
        break;
      case "sideXoYTop":
      case "sideYoZRight":
        point1.set((max.x + min.x) / 2, min.y, (max.z + min.z) / 2);
        break;
      case "sideXoYDown":
      case "sideYoZLeft":
        point1.set((max.x + min.x) / 2, max.y, (max.z + min.z) / 2);
        break;
      case "sideXoZTop":
      case "sideYoZTop":
        point1.set((max.x + min.x) / 2, (max.y + min.y) / 2, min.z);
        break;
      case "sideXoZDown":
      case "sideYoZDown":
        point1.set((max.x + min.x) / 2, (max.y + min.y) / 2, max.z);
        break;
      default:
        break;
    }
    point2.set((max.x + min.x) * 0.5, (max.y + min.y) * 0.5, (max.z + min.z) * 0.5);
    this._changeCursorByPoint(point1, point2);
  }

  private _changeCursorByPoint(point1: Vector3, point2: Vector3): void {
    // 根据两个点的位置，改变鼠标的样式
    const localToWorld = this._startWorldMatrix;
    this._group.getWorldMatrix(localToWorld);
    // 这个在世界中不动的位置
    Vector3.transformCoordinate(point1, localToWorld, point1);
    Vector3.transformCoordinate(point2, localToWorld, point2);
    // 转换成屏幕坐标
    this._camera.worldToScreenPoint(point1, point1);
    this._camera.worldToScreenPoint(point2, point2);
    const value = Math.atan2(point2.y - point1.y, point2.x - point1.x) / Math.PI;
    if (value > 0.94 || value <= -0.94) {
      this._cursorType = "ew-resize";
    } else if (value > -0.94 && value <= -0.56) {
      this._cursorType = "nwse-resize";
    } else if (value > -0.56 && value <= -0.44) {
      this._cursorType = "ns-resize";
    } else if (value > -0.44 && value <= -0.06) {
      this._cursorType = "nesw-resize";
    } else if (value > -0.06 && value <= 0.06) {
      this._cursorType = "ew-resize";
    } else if (value > 0.06 && value <= 0.44) {
      this._cursorType = "nwse-resize";
    } else if (value > 0.44 && value <= 0.56) {
      this._cursorType = "ns-resize";
    } else if (value > 0.56 && value <= 0.94) {
      this._cursorType = "nesw-resize";
    }
  }

  /** Called when pointer leaves gizmo. */
  onHoverEnd(): void {
    // @ts-ignore
    if (!this.entity.parent.getComponent(Gizmo)._isStarted) {
      this._cursorType = "default";
    }
    this.engine.dispatch("RectCursorChange", this._cursorType);
  }

  /** Called when gizmo starts to move.*/
  onMoveStart(ray: Ray, axisName: string): void {
    this._axisName = axisName;
    this._lockPlane = true;
    switch (axisName) {
      case "centerXoY":
      case "centerXoZ":
      case "centerYoZ":
        this._onMoveCenterStart(ray);
        break;
      case "sideXoYLeft":
      case "sideXoYTop":
      case "sideXoYRight":
      case "sideXoYDown":
      case "sideXoZLeft":
      case "sideXoZTop":
      case "sideXoZRight":
      case "sideXoZDown":
      case "sideYoZLeft":
      case "sideYoZTop":
      case "sideYoZRight":
      case "sideYoZDown":
        this._onMoveSideStart(ray);
        break;
      case "vertexXoYRightDown":
      case "vertexXoYRightTop":
      case "vertexXoYLeftDown":
      case "vertexXoYLeftTop":
      case "vertexXoZRightDown":
      case "vertexXoZRightTop":
      case "vertexXoZLeftDown":
      case "vertexXoZLeftTop":
      case "vertexYoZRightDown":
      case "vertexYoZRightTop":
      case "vertexYoZLeftDown":
      case "vertexYoZLeftTop":
        this._onMoveVertexStart(ray);
        break;
      default:
        this._onMoveStart(ray);
        break;
    }
  }

  /** Called when gizmo is moving.*/
  onMove(ray: Ray, pointer?: Pointer): void {
    switch (this._axisName) {
      case "sideXoYLeft":
      case "sideXoYTop":
      case "sideXoYRight":
      case "sideXoYDown":
      case "sideXoZLeft":
      case "sideXoZTop":
      case "sideXoZRight":
      case "sideXoZDown":
      case "sideYoZLeft":
      case "sideYoZTop":
      case "sideYoZRight":
      case "sideYoZDown":
        this._onMoveSide(ray);
        break;
      case "vertexXoYRightDownRotate":
      case "vertexXoYRightTopRotate":
      case "vertexXoYLeftDownRotate":
      case "vertexXoYLeftTopRotate":
      case "vertexXoZRightDownRotate":
      case "vertexXoZRightTopRotate":
      case "vertexXoZLeftDownRotate":
      case "vertexXoZLeftTopRotate":
      case "vertexYoZRightDownRotate":
      case "vertexYoZRightTopRotate":
      case "vertexYoZLeftDownRotate":
      case "vertexYoZLeftTopRotate":
        this._onMoveRotate(ray);
        break;
      case "vertexXoYRightDown":
      case "vertexXoYRightTop":
      case "vertexXoYLeftDown":
      case "vertexXoYLeftTop":
      case "vertexXoZRightDown":
      case "vertexXoZRightTop":
      case "vertexXoZLeftDown":
      case "vertexXoZLeftTop":
      case "vertexYoZRightDown":
      case "vertexYoZRightTop":
      case "vertexYoZLeftDown":
      case "vertexYoZLeftTop":
        this._onMoveVertex(ray);
        break;
      case "centerXoY":
      case "centerXoZ":
      case "centerYoZ":
        this._onMoveCenter(ray);
        break;
      case "planeXoY":
      case "planeXoZ":
      case "planeYoZ":
        this._onMovePlane(ray);
        break;
      default:
        break;
    }
  }

  /** Called when gizmo movement ends.*/
  onMoveEnd(): void {
    this._axisName = "";
    this._lockPlane = false;
    this._uiTransformInfoMap.clear();
  }

  /** Called when gizmo's transform is dirty.*/
  onUpdate(isModified: boolean): void {
    const { _camera: camera, _group: group } = this;
    if (!group || !camera) return;
    // 拿到 group 的世界矩阵
    const groupWorldMatrix = RectControl._matrix0;
    if (!group.getWorldMatrix(groupWorldMatrix)) return;
    const ele = groupWorldMatrix.elements;

    // 获取当前的包围盒
    const bounds = this._bounds;
    if (!this._updateBounds(groupWorldMatrix, bounds)) {
      this._middleEntity.isActive = false;
      return;
    }
    this._middleEntity.isActive = true;
    const { min, max } = bounds;
    let mostSuitablePlane = this._mostSuitablePlane;
    if (!this._lockPlane) {
      // 计算当前最适合展示的平面
      {
        // XoY 平面的法向量
        const normalXoY = RectControl._vec30;
        // XoZ 平面的法向量
        const normalXoZ = RectControl._vec31;
        // YoZ 平面的法向量
        const normalYoZ = RectControl._vec32;
        switch (group.coordinateType) {
          case CoordinateType.Local:
            normalXoY.set(ele[8], ele[9], ele[10]);
            normalXoZ.set(ele[4], ele[5], ele[6]);
            normalYoZ.set(ele[0], ele[1], ele[2]);
            break;
          case CoordinateType.Global:
            normalXoY.set(0, 0, 1);
            normalXoZ.set(0, 1, 0);
            normalYoZ.set(1, 0, 0);
            break;
        }
        // XoY 平面的有效面积
        const areaXoY = (max.x - min.x) * (max.y - min.y);
        // XoZ 平面的有效面积
        const areaXoZ = (max.x - min.x) * (max.z - min.z);
        // YoZ 平面的有效面积
        const areaYoZ = (max.y - min.y) * (max.z - min.z);
        // 相机的 forward 向量
        const cameraWorldForward = camera.entity.transform.worldForward;
        const weightXoY = areaXoY * Math.abs(Vector3.dot(cameraWorldForward, normalXoY));
        const weightXoZ = areaXoZ * Math.abs(Vector3.dot(cameraWorldForward, normalXoZ));
        const weightYoZ = areaYoZ * Math.abs(Vector3.dot(cameraWorldForward, normalYoZ));
        if (weightXoY >= weightXoZ && weightXoY >= weightYoZ) {
          mostSuitablePlane = CoordinatePlane.XoY;
        } else if (weightXoZ >= weightXoY && weightXoZ >= weightYoZ) {
          mostSuitablePlane = CoordinatePlane.XoZ;
        } else {
          mostSuitablePlane = CoordinatePlane.YoZ;
        }
      }
      this._mostSuitablePlane = mostSuitablePlane;
    }

    this._middleEntity.transform.worldMatrix = groupWorldMatrix;
    let scale: number;
    if (this._camera.isOrthographic) {
      scale = isModified
        ? this._camera.orthographicSize * Utils.rectFactor * 3 * 0.8
        : this._camera.orthographicSize * Utils.rectFactor * 3;
    } else {
      const cameraPosition = this._camera.entity.transform.worldPosition;
      const vec3 = RectControl._vec30.set(ele[12], ele[13], ele[14]);
      scale = isModified
        ? Vector3.distance(cameraPosition, vec3) * Utils.rectFactor * 0.8
        : Vector3.distance(cameraPosition, vec3) * Utils.rectFactor;
    }

    const anchorType = group.anchorType;
    switch (mostSuitablePlane) {
      case CoordinatePlane.XoY:
        {
          this._XoY.isActive = true;
          const sideLeftTransform = this._sideXoYLeft.transform;
          sideLeftTransform.position.set(min.x, (min.y + max.y) / 2, (min.z + max.z) / 2);
          sideLeftTransform.scale.set(scale, max.y - min.y, scale);
          const sideTopTransform = this._sideXoYTop.transform;
          sideTopTransform.position.set((min.x + max.x) / 2, max.y, (min.z + max.z) / 2);
          sideTopTransform.scale.set(scale, max.x - min.x, scale);
          const sideRightTransform = this._sideXoYRight.transform;
          sideRightTransform.position.set(max.x, (min.y + max.y) / 2, (min.z + max.z) / 2);
          sideRightTransform.scale.set(scale, max.y - min.y, scale);
          const sideDownTransform = this._sideXoYDown.transform;
          sideDownTransform.position.set((min.x + max.x) / 2, min.y, (min.z + max.z) / 2);
          sideDownTransform.scale.set(scale, max.x - min.x, scale);
          const vertexLeftTopTransform = this._vertexXoYLeftTop.transform;
          vertexLeftTopTransform.position.set(min.x, max.y, (min.z + max.z) / 2);
          vertexLeftTopTransform.scale.set(scale, scale, scale);
          const vertexRightTopTransform = this._vertexXoYRightTop.transform;
          vertexRightTopTransform.position.set(max.x, max.y, (min.z + max.z) / 2);
          vertexRightTopTransform.scale.set(scale, scale, scale);
          const vertexRightDownTransform = this._vertexXoYRightDown.transform;
          vertexRightDownTransform.position.set(max.x, min.y, (min.z + max.z) / 2);
          vertexRightDownTransform.scale.set(scale, scale, scale);
          const vertexLeftDownTransform = this._vertexXoYLeftDown.transform;
          vertexLeftDownTransform.position.set(min.x, min.y, (min.z + max.z) / 2);
          vertexLeftDownTransform.scale.set(scale, scale, scale);
          const planeTransform = this._planeXoY.transform;
          planeTransform.position.set((min.x + max.x) / 2, (min.y + max.y) / 2, (min.z + max.z) / 2);
          planeTransform.scale.set(max.x - min.x, scale, max.y - min.y);
          const centerXoY = this._centerXoY;
          const centerTransform = centerXoY.transform;
          if (anchorType === AnchorType.Center) {
            centerXoY.getComponent(Icon).setGray(true);
            this._centerXoYPick.enabled = false;
            centerTransform.position.set((min.x + max.x) / 2, (min.y + max.y) / 2, (min.z + max.z) / 2);
          } else {
            if (this._canMoveCenter()) {
              centerXoY.getComponent(Icon).setGray(false);
              this._centerXoYPick.enabled = true;
            } else {
              centerXoY.getComponent(Icon).setGray(true);
              this._centerXoYPick.enabled = false;
            }
            centerTransform.position.set(0, 0, 0);
          }
          centerTransform.position.set(0, 0, 0);
          centerTransform.scale.set(scale, scale, scale);
          this._XoZ.isActive = false;
          this._YoZ.isActive = false;
        }
        break;
      case CoordinatePlane.XoZ:
        {
          this._XoY.isActive = false;
          this._XoZ.isActive = true;
          const sideLeftTransform = this._sideXoZLeft.transform;
          sideLeftTransform.position.set(min.x, (min.y + max.y) / 2, (min.z + max.z) / 2);
          sideLeftTransform.scale.set(scale, max.z - min.z, scale);
          const sideTopTransform = this._sideXoZTop.transform;
          sideTopTransform.position.set((min.x + max.x) / 2, (min.y + max.y) / 2, max.z);
          sideTopTransform.scale.set(scale, max.x - min.x, scale);
          const sideRightTransform = this._sideXoZRight.transform;
          sideRightTransform.position.set(max.x, (min.y + max.y) / 2, (min.z + max.z) / 2);
          sideRightTransform.scale.set(scale, max.z - min.z, scale);
          const sideDownTransform = this._sideXoZDown.transform;
          sideDownTransform.position.set((min.x + max.x) / 2, (min.y + max.y) / 2, min.z);
          sideDownTransform.scale.set(scale, max.x - min.x, scale);
          const vertexLeftTopTransform = this._vertexXoZLeftTop.transform;
          vertexLeftTopTransform.position.set(min.x, (min.y + max.y) / 2, max.z);
          vertexLeftTopTransform.scale.set(scale, scale, scale);
          const vertexRightTopTransform = this._vertexXoZRightTop.transform;
          vertexRightTopTransform.position.set(max.x, (min.y + max.y) / 2, max.z);
          vertexRightTopTransform.scale.set(scale, scale, scale);
          const vertexRightDownTransform = this._vertexXoZRightDown.transform;
          vertexRightDownTransform.position.set(max.x, (min.y + max.y) / 2, min.z);
          vertexRightDownTransform.scale.set(scale, scale, scale);
          const vertexLeftDownTransform = this._vertexXoZLeftDown.transform;
          vertexLeftDownTransform.position.set(min.x, (min.y + max.y) / 2, min.z);
          vertexLeftDownTransform.scale.set(scale, scale, scale);
          const planeTransform = this._planeXoZ.transform;
          planeTransform.position.set((min.x + max.x) / 2, (min.y + max.y) / 2, (min.z + max.z) / 2);
          planeTransform.scale.set(max.x - min.x, scale, max.z - min.z);
          const centerXoZ = this._centerXoZ;
          const centerTransform = centerXoZ.transform;
          if (anchorType === AnchorType.Center) {
            centerXoZ.getComponent(Icon).setGray(true);
            this._centerXoZPick.enabled = false;
            centerTransform.position.set((min.x + max.x) / 2, (min.y + max.y) / 2, (min.z + max.z) / 2);
          } else {
            if (this._canMoveCenter()) {
              centerXoZ.getComponent(Icon).setGray(false);
              this._centerXoZPick.enabled = true;
            } else {
              centerXoZ.getComponent(Icon).setGray(true);
              this._centerXoZPick.enabled = false;
            }
            centerTransform.position.set(0, 0, 0);
          }
          centerTransform.scale.set(scale, scale, scale);
          this._YoZ.isActive = false;
        }
        break;
      case CoordinatePlane.YoZ:
        {
          this._XoY.isActive = false;
          this._XoZ.isActive = false;
          this._YoZ.isActive = true;
          const sideLeftTransform = this._sideYoZLeft.transform;
          sideLeftTransform.position.set((min.x + max.x) / 2, min.y, (min.z + max.z) / 2);
          sideLeftTransform.scale.set(scale, max.z - min.z, scale);
          const sideTopTransform = this._sideYoZTop.transform;
          sideTopTransform.position.set((min.x + max.x) / 2, (min.y + max.y) / 2, max.z);
          sideTopTransform.scale.set(scale, max.y - min.y, scale);
          const sideRightTransform = this._sideYoZRight.transform;
          sideRightTransform.position.set((min.x + max.x) / 2, max.y, (min.z + max.z) / 2);
          sideRightTransform.scale.set(scale, max.z - min.z, scale);
          const sideDownTransform = this._sideYoZDown.transform;
          sideDownTransform.position.set((min.x + max.x) / 2, (min.y + max.y) / 2, min.z);
          sideDownTransform.scale.set(scale, max.y - min.y, scale);
          const vertexLeftTopTransform = this._vertexYoZLeftTop.transform;
          vertexLeftTopTransform.position.set((min.x + max.x) / 2, min.y, max.z);
          vertexLeftTopTransform.scale.set(scale, scale, scale);
          const vertexRightTopTransform = this._vertexYoZRightTop.transform;
          vertexRightTopTransform.position.set((min.x + max.x) / 2, max.y, max.z);
          vertexRightTopTransform.scale.set(scale, scale, scale);
          const vertexRightDownTransform = this._vertexYoZRightDown.transform;
          vertexRightDownTransform.position.set((min.x + max.x) / 2, max.y, min.z);
          vertexRightDownTransform.scale.set(scale, scale, scale);
          const vertexLeftDownTransform = this._vertexYoZLeftDown.transform;
          vertexLeftDownTransform.position.set((min.x + max.x) / 2, min.y, min.z);
          vertexLeftDownTransform.scale.set(scale, scale, scale);
          const planeTransform = this._planeYoZ.transform;
          planeTransform.position.set((min.x + max.x) / 2, (min.y + max.y) / 2, (min.z + max.z) / 2);
          planeTransform.scale.set(max.y - min.y, scale, max.z - min.z);
          const centerYoZ = this._centerYoZ;
          const centerTransform = centerYoZ.transform;
          if (anchorType === AnchorType.Center) {
            centerYoZ.getComponent(Icon).setGray(true);
            this._centerYoZPick.enabled = false;
            centerTransform.position.set((min.x + max.x) / 2, (min.y + max.y) / 2, (min.z + max.z) / 2);
          } else {
            if (this._canMoveCenter()) {
              centerYoZ.getComponent(Icon).setGray(false);
              this._centerYoZPick.enabled = true;
            } else {
              centerYoZ.getComponent(Icon).setGray(true);
              this._centerYoZPick.enabled = false;
            }
            centerTransform.position.set(0, 0, 0);
          }
          centerTransform.scale.set(scale, scale, scale);
        }
        break;
      default:
        break;
    }
  }

  /** Called when camera switch between ortho and perps.*/
  onSwitch(isModified: boolean): void {}

  /** Called when axis alpha needs to be modified.*/
  onAlphaChange(axisName: string, value: number): void {}

  /**
   * 当 Group 的 Matrix 发生改变的时候会重新计算包围盒
   * @returns
   */
  private _updateBounds(worldMatrix: Matrix, out: BoundingBox): boolean {
    const { min, max } = out;
    min.set(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
    max.set(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
    const tempBounds = RectControl._bounds;
    const group = this._group;
    const { entities, coordinateType } = group;
    const renderers = [];
    let isValid = false;
    // 计算 Bounds 的 local scale
    const ele = worldMatrix.elements;
    if (coordinateType === CoordinateType.Local) {
      const worldInvMatrix = RectControl._matrix1;
      const tempLocalMatrix = this._tempLocalMatrix;
      Matrix.invert(worldMatrix, worldInvMatrix);
      for (let i = 0, n = entities.length; i < n; i++) {
        const entity = entities[i];
        if (!entity.isActiveInHierarchy) continue;
        if (this._isUITransform(entity)) {
          const transform = entity.transform as UITransform;
          Matrix.multiply(worldInvMatrix, transform.worldMatrix, tempLocalMatrix);
          this._getLocalBoundsByTransform(transform, tempBounds);
          tempBounds.transform(tempLocalMatrix);
          BoundingBox.merge(out, tempBounds, out);
          isValid = true;
        } else {
          entity.getComponents(Renderer, renderers);
          const transform = entity.transform;
          Matrix.multiply(worldInvMatrix, transform.worldMatrix, tempLocalMatrix);
          for (let j = 0, m = renderers.length; j < m; j++) {
            if (this._getLocalBoundsByRenderer(renderers[j], tempBounds)) {
              tempBounds.transform(tempLocalMatrix);
              BoundingBox.merge(out, tempBounds, out);
              isValid = true;
            }
          }
        }
      }
    } else {
      for (let i = 0, n = entities.length; i < n; i++) {
        const entity = entities[i];
        if (!entity.isActiveInHierarchy) continue;
        if (this._isUITransform(entity)) {
          const transform = entity.transform as UITransform;
          this._getLocalBoundsByTransform(transform, tempBounds);
          tempBounds.transform(transform.worldMatrix);
          BoundingBox.merge(out, tempBounds, out);
          isValid = true;
        } else {
          entity.getComponents(Renderer, renderers);
          for (let j = 0, n = renderers.length; j < n; j++) {
            const renderer = renderers[j];
            if (renderer instanceof ParticleRenderer) {
              // 粒子没有包围盒
              continue;
            } else {
              tempBounds.copyFrom(renderer.bounds);
              BoundingBox.merge(out, tempBounds, out);
              isValid = true;
            }
          }
        }
      }
      (min.x -= ele[12]), (min.y -= ele[13]), (min.z -= ele[14]);
      (max.x -= ele[12]), (max.y -= ele[13]), (max.z -= ele[14]);
    }
    return isValid;
  }

  private _createSide(plane: Entity, name: string, position: Vector3, rotation: Vector3): any {
    const engine = this.engine;
    const entity = plane.createChild(name);
    const transform = entity.transform;
    transform.position = position;
    transform.rotation = rotation;
    // Visible Renderer (for display)
    const renderer = entity.addComponent(MeshRenderer);
    const mesh = new ModelMesh(engine);
    mesh.setPositions([new Vector3(0, -0.5), new Vector3(0, 0.5)]);
    mesh.addSubMesh(new SubMesh(0, 2, MeshTopology.Lines));
    const bounds = mesh.bounds;
    bounds.min.set(-0.5, -0.5, 0);
    bounds.max.set(0.5, 0.5, 0);
    mesh.uploadData(true);
    renderer.mesh = mesh;
    renderer.setMaterial(Utils.visibleMaterialRect);
    // Invisible Renderer (for pick)
    const pickRenderer = entity.addComponent(MeshRenderer);
    pickRenderer.priority = 3 + this._startPriority;
    const pickMesh = PrimitiveMesh.createCylinder(engine, 0.2, 0.2, 1);
    pickRenderer.mesh = pickMesh;
    pickRenderer.setMaterial(Utils.invisibleMaterialRect);
    return entity;
  }

  private _createVertex(plane: Entity, name: string, position: Vector3, rotatePointerLocalPosition: Vector3): Entity {
    const engine = this.engine;
    const entity = plane.createChild(name);
    entity.transform.position = position;
    // ---------- 这部分是拖拽移动两条边的 ----------
    // Visible Renderer (for display)
    const icon = entity.addComponent(Icon);
    icon.material.name = State.rect.toString();
    icon.texture = "https://mdn.alipayobjects.com/huamei_yo47yq/afts/img/A*jzkfTY_Kyb8AAAAAAAAAAAAADhuCAQ/original";
    icon.size = new Vector2(20, 20);
    icon.registerIconToViewportCamera(this._camera);
    // Invisible Renderer (for pick)
    const pickRenderer = entity.addComponent(MeshRenderer);
    pickRenderer.priority = 4 + this._startPriority;
    const pickMesh = PrimitiveMesh.createSphere(engine, this._pickRadius);
    pickRenderer.mesh = pickMesh;
    pickRenderer.setMaterial(Utils.invisibleMaterialRect);

    // ---------- 这部分是拖拽旋转的 ----------
    const rotateEntity = entity.createChild(name + "Rotate");
    rotateEntity.transform.position = rotatePointerLocalPosition;
    // Invisible Renderer (for pick)
    const rotatePickRenderer = rotateEntity.addComponent(MeshRenderer);
    rotatePickRenderer.priority = 4 + this._startPriority;
    const rotatePickMesh = PrimitiveMesh.createSphere(engine, this._pickRadius);
    rotatePickRenderer.mesh = rotatePickMesh;
    rotatePickRenderer.setMaterial(Utils.invisibleMaterialRect);
    return entity;
  }

  private _createPlane(plane: Entity, name: string, rotation: Vector3): Entity {
    const entity = plane.createChild(name);
    entity.transform.rotation = rotation;
    // Invisible Renderer (for pick)
    const pickRenderer = entity.addComponent(MeshRenderer);
    const pickMesh = PrimitiveMesh.createPlane(this.engine, 1, 1);
    pickRenderer.priority = 2 + this._startPriority;
    pickRenderer.mesh = pickMesh;
    pickRenderer.setMaterial(Utils.invisibleMaterialRect);
    return entity;
  }

  private _createCenter(plane: Entity, name: string): Entity {
    const engine = this.engine;
    const entity = plane.createChild(name);
    // Visible Renderer (for display)
    const icon = entity.addComponent(Icon);
    icon.material.name = State.rect.toString();
    icon.texture = "https://mdn.alipayobjects.com/huamei_yo47yq/afts/img/A*JsUFRoCbiAUAAAAAAAAAAAAADhuCAQ/original";
    icon.size = new Vector2(25, 25);
    icon.registerIconToViewportCamera(this._camera);
    // Invisible Renderer (for pick)
    const pickRenderer = entity.addComponent(MeshRenderer);
    pickRenderer.priority = 1 + this._startPriority;
    const pickMesh = PrimitiveMesh.createSphere(engine, 0.5);
    pickRenderer.mesh = pickMesh;
    pickRenderer.setMaterial(Utils.invisibleMaterialRect);
    return entity;
  }

  private _createCenterPick(center: Entity): MeshRenderer {
    // Invisible Renderer (for pick)
    const pickRenderer = center.addComponent(MeshRenderer);
    pickRenderer.priority = 10 + this._startPriority;
    const pickMesh = PrimitiveMesh.createSphere(center.engine, 0.5);
    pickRenderer.mesh = pickMesh;
    pickRenderer.setMaterial(Utils.invisibleMaterialRect);
    return pickRenderer;
  }

  /**
   * 操作位置拖动，会改变 Transform 的 position（基于初始平面的双轴）
   * @param ray
   */
  private _onMovePlane(ray: Ray): void {
    const startHitLocalPosition = this._startHitLocalPosition;
    const curHitLocalPosition = this._curHitLocalPosition;
    const worldToLocal = this._startWorldInvMatrix;
    Vector3.transformCoordinate(ray.origin, worldToLocal, ray.origin);
    Vector3.transformNormal(ray.direction, worldToLocal, ray.direction);

    const startGroupWorldMatrix = this._startWorldMatrix;
    const temp0 = RectControl._vec30;
    const temp1 = RectControl._vec31;
    ray.getPoint(ray.intersectPlane(this._curLocalPlane), temp0);
    Vector3.subtract(temp0, startHitLocalPosition, temp1);
    const fromMatrix = this._fromMatrix;
    const toMatrix = RectControl._matrix1;
    const affineTranslate = this._tempAffineTranslate.set(1, 1, 1);
    const affineQuat = this._tempAffineQuat.identity();
    Matrix.affineTransformation(affineTranslate, affineQuat, temp1, toMatrix);
    Matrix.multiply(startGroupWorldMatrix, toMatrix, toMatrix);
    this._group.applyTransform(fromMatrix, toMatrix);
    fromMatrix.copyFrom(toMatrix);
    curHitLocalPosition.copyFrom(temp0);
  }

  /**
   * 操作旋转，会改变 Transform 的 rotate（基于初始平面的单轴）
   */
  private _onMoveRotate(ray: Ray): void {
    const curHitLocalPosition = this._curHitLocalPosition;
    const startGroupWorldMatrix = this._startWorldMatrix;
    const worldToLocal = this._startWorldInvMatrix;
    Vector3.transformCoordinate(ray.origin, worldToLocal, ray.origin);
    Vector3.transformNormal(ray.direction, worldToLocal, ray.direction);
    const temp0 = RectControl._vec30;
    ray.getPoint(ray.intersectPlane(this._curLocalPlane), temp0);
    const normal = RectControl._vec31;
    let preAngle = 0;
    let angle = 0;
    switch (this._axisName) {
      case "vertexXoYRightDownRotate":
      case "vertexXoYRightTopRotate":
      case "vertexXoYLeftDownRotate":
      case "vertexXoYLeftTopRotate":
        // 绕 Z 轴旋转
        normal.set(0, 0, 1);
        preAngle = Math.atan2(this._startHitLocalPosition.y, this._startHitLocalPosition.x);
        angle = Math.atan2(temp0.y, temp0.x) - preAngle;
        break;
      case "vertexXoZRightDownRotate":
      case "vertexXoZRightTopRotate":
      case "vertexXoZLeftDownRotate":
      case "vertexXoZLeftTopRotate":
        // 绕 Y 轴旋转
        normal.set(0, -1, 0);
        preAngle = Math.atan2(this._startHitLocalPosition.z, this._startHitLocalPosition.x);
        angle = Math.atan2(temp0.z, temp0.x) - preAngle;
        break;
      case "vertexYoZRightDownRotate":
      case "vertexYoZRightTopRotate":
      case "vertexYoZLeftDownRotate":
      case "vertexYoZLeftTopRotate":
        // 绕 X 轴旋转
        normal.set(1, 0, 0);
        preAngle = Math.atan2(this._startHitLocalPosition.z, this._startHitLocalPosition.y);
        angle = Math.atan2(temp0.z, temp0.y) - preAngle;
        break;
      default:
        break;
    }
    const toMatrix = RectControl._matrix1;
    Matrix.rotateAxisAngle(startGroupWorldMatrix, normal, angle, toMatrix);
    const fromMatrix = this._fromMatrix;
    this._group.applyTransform(fromMatrix, toMatrix);
    fromMatrix.copyFrom(toMatrix);
    curHitLocalPosition.copyFrom(temp0);
  }

  /**
   * 初始化：
   * - 操作平面的世界矩阵
   * - 操作平面的世界逆矩阵
   * - 操作平面的 plane 对象（局部）
   * - 起始点击位置（局部）
   */
  private _onMoveStart(ray: Ray): void {
    const localToWorld = this._startWorldMatrix;
    this._group.getWorldMatrix(localToWorld);
    const worldToLocal = this._startWorldInvMatrix;
    Matrix.invert(localToWorld, worldToLocal);
    const curLocalPlane = this._curLocalPlane;
    switch (this._mostSuitablePlane) {
      case CoordinatePlane.XoY:
        curLocalPlane.normal.set(0, 0, 1);
        break;
      case CoordinatePlane.XoZ:
        curLocalPlane.normal.set(0, 1, 0);
        break;
      case CoordinatePlane.YoZ:
        curLocalPlane.normal.set(1, 0, 0);
        break;
      default:
        break;
    }
    // 将射线转至局部
    Vector3.transformCoordinate(ray.origin, worldToLocal, ray.origin);
    Vector3.transformNormal(ray.direction, worldToLocal, ray.direction);
    ray.getPoint(ray.intersectPlane(curLocalPlane), this._startHitLocalPosition);
    this._curHitLocalPosition.copyFrom(this._startHitLocalPosition);
    this._fromMatrix.copyFrom(localToWorld);
    this._fromScale.set(1, 1, 1);
  }

  private _onMoveSide(ray: Ray): void {
    const startHitLocalPosition = this._startHitLocalPosition;
    const curHitLocalPosition = this._curHitLocalPosition;
    const localToWorld = this._startWorldMatrix;
    const worldToLocal = this._startWorldInvMatrix;
    const fromMatrix = this._fromMatrix;
    Vector3.transformCoordinate(ray.origin, worldToLocal, ray.origin);
    Vector3.transformNormal(ray.direction, worldToLocal, ray.direction);
    const temp0 = RectControl._vec30;
    ray.getPoint(ray.intersectPlane(this._curLocalPlane), temp0);

    // 1. 找到这个固定的点，他有两个作用
    // - 确定缩放的比例
    // （这时候可不是依据锚点判断）
    // - 在整体的变化中保持位置不变
    // （比如我拖动的是包围盒 XoY 屏幕的左边界，那么他右边界的中心点理论上应该保持不变）
    const fixedLocalPoint = this._fixedLocalPoint;
    const fixedWorldPoint = this._fixedWorldPoint;
    // 缩放因子，如果选中 sideXoYLeft，缩放的是 X 轴
    // 如果选中 sideXoYTop ，缩放的是 Y 轴
    let scaleX = false;
    let scaleY = false;
    let scaleZ = false;
    switch (this._axisName) {
      case "sideXoYLeft":
      case "sideXoZLeft":
      case "sideXoYRight":
      case "sideXoZRight":
        scaleX = true;
        break;
      case "sideXoYTop":
      case "sideYoZRight":
      case "sideXoYDown":
      case "sideYoZLeft":
        scaleY = true;
        break;
      case "sideXoZTop":
      case "sideYoZTop":
      case "sideXoZDown":
      case "sideYoZDown":
        scaleZ = true;
        break;
      default:
        break;
    }
    // 将 fixedPointer 转成 World 坐标
    // 3. 简单来说，这个 fixedPointer 在缩放或者调整 Size 后，保持位置不变
    const quaternion = this._tempAffineQuat.identity();
    const translate = this._tempAffineTranslate.set(0, 0, 0);
    const scale = this._tempAffineScale.set(
      scaleX ? (temp0.x - fixedLocalPoint.x) / (startHitLocalPosition.x - fixedLocalPoint.x) : 1,
      scaleY ? (temp0.y - fixedLocalPoint.y) / (startHitLocalPosition.y - fixedLocalPoint.y) : 1,
      scaleZ ? (temp0.z - fixedLocalPoint.z) / (startHitLocalPosition.z - fixedLocalPoint.z) : 1
    );
    const toMatrix = RectControl._matrix1;
    Matrix.affineTransformation(scale, quaternion, translate, toMatrix);

    const entities = this._group.entities;
    for (let i = 0, n = entities.length; i < n; i++) {
      const entity = entities[i];

      if (this._isUITransform(entity)) {
        // UITransform 修改 size 和 position
        const transform = <UITransform>entity.transform;
        // 当前节点在 group 中的局部矩阵和局部逆矩阵
        const worldMatrix = transform.worldMatrix;
        const localMatrix = this._mat0;
        const localInvMatrix = this._mat1;
        const lossyMatrix = this._mat2;
        Matrix.multiply(worldToLocal, worldMatrix, localMatrix);
        Matrix.invert(localMatrix, localInvMatrix);
        Matrix.multiply(localInvMatrix, toMatrix, lossyMatrix);
        Matrix.multiply(lossyMatrix, localMatrix, lossyMatrix);
        // 计算固定点在当前节点的局部坐标
        const fixedPointInUI = this._tempVec30;
        Vector3.transformCoordinate(fixedLocalPoint, localInvMatrix, fixedPointInUI);
        // 避免分母为 0
        let sizeX = transform.size.x || 0.1;
        let sizeY = transform.size.y || 0.1;
        fixedPointInUI.set(fixedPointInUI.x / sizeX, fixedPointInUI.y / sizeY, fixedPointInUI.z);
        // 计算新的尺寸
        // @remarks: 这里的尺寸是有损的
        // Matrix[scale]*Matrix[local]*Size => Matrix[local]*(MatrixInv[local]*Matrix[scale]*Matrix[local])*Size
        // 当 Matrix[local] 为异形矩阵时，单纯通过修改 scale 是无法满足变形的诉求的
        // 因此此处只能近似通过 e[0] 和 e[5] 来分别计算新的宽度和高度
        const map = this._uiTransformInfoMap;
        let width = map.get(transform).width;
        let height = map.get(transform).height;
        const ele = lossyMatrix.elements;
        const newWidth = ele[0] * width;
        const newHeight = ele[5] * height;
        transform.size.set(newWidth, newHeight);
        // 在确定新的尺寸之后，通过 fixedPointer 来确定此次变化新的世界位移 Tx, Ty, Tz
        const curEle = worldMatrix.elements;
        curEle[12] =
          fixedWorldPoint.x -
          curEle[0] * newWidth * fixedPointInUI.x -
          curEle[4] * newHeight * fixedPointInUI.y -
          curEle[8] * fixedPointInUI.z;
        curEle[13] =
          fixedWorldPoint.y -
          curEle[1] * newWidth * fixedPointInUI.x -
          curEle[5] * newHeight * fixedPointInUI.y -
          curEle[9] * fixedPointInUI.z;
        curEle[14] =
          fixedWorldPoint.z -
          curEle[2] * newWidth * fixedPointInUI.x -
          curEle[6] * newHeight * fixedPointInUI.y -
          curEle[10] * fixedPointInUI.z;
        transform.worldMatrix = worldMatrix;
      } else {
        const transform = <Transform>entity.transform;
        // Transform 修改 scale 和 position
        // 固定的世界节点在当前节点的局部坐标
        const invMatrix = this._mat0;
        const tempVec31 = this._tempVec31;
        Matrix.invert(transform.worldMatrix, invMatrix);
        Vector3.transformCoordinate(fixedWorldPoint, invMatrix, tempVec31);
        // 当前节点在 group 中的局部姿态
        const worldMatrix = transform.worldMatrix;
        Matrix.multiply(localToWorld, fromMatrix, invMatrix);
        Matrix.invert(invMatrix, invMatrix);
        Matrix.multiply(invMatrix, worldMatrix, worldMatrix);
        // 当前新的叠加矩阵
        const curMatrix = this._mat1;
        Matrix.multiply(localToWorld, toMatrix, curMatrix);
        Matrix.multiply(curMatrix, worldMatrix, worldMatrix);
        const curEle = worldMatrix.elements;
        curEle[12] = fixedWorldPoint.x - curEle[0] * tempVec31.x - curEle[4] * tempVec31.y - curEle[8] * tempVec31.z;
        curEle[13] = fixedWorldPoint.y - curEle[1] * tempVec31.x - curEle[5] * tempVec31.y - curEle[9] * tempVec31.z;
        curEle[14] = fixedWorldPoint.z - curEle[2] * tempVec31.x - curEle[6] * tempVec31.y - curEle[10] * tempVec31.z;
        transform.worldMatrix = worldMatrix;
      }
    }
    fromMatrix.copyFrom(toMatrix);
    curHitLocalPosition.copyFrom(temp0);
  }

  private _isUITransform(entity: Entity): boolean {
    const transform = entity.transform;
    // @ts-ignore
    return !!transform.size && !!transform.pivot;
  }

  /**
   * 操作顶点，会改变：
   * - Transform 的缩放（双轴）
   * - UITransform 的尺寸（双轴）
   */
  private _onMoveVertex(ray: Ray): void {
    const startHitLocalPosition = this._startHitLocalPosition;
    const curHitLocalPosition = this._curHitLocalPosition;
    const localToWorld = this._startWorldMatrix;
    const worldToLocal = this._startWorldInvMatrix;
    const fromMatrix = this._fromMatrix;
    Vector3.transformCoordinate(ray.origin, worldToLocal, ray.origin);
    Vector3.transformNormal(ray.direction, worldToLocal, ray.direction);
    const temp0 = RectControl._vec30;
    ray.getPoint(ray.intersectPlane(this._curLocalPlane), temp0);

    // 1. 找到这个固定的点，他有两个作用
    // - 确定缩放的比例
    // （这时候可不是依据锚点判断）
    // - 在整体的变化中保持位置不变
    // （比如我拖动的是包围盒 XoY 屏幕的左边界，那么他右边界的中心点理论上应该保持不变）
    const fixedLocalPoint = this._fixedLocalPoint;
    const fixedWorldPoint = this._fixedWorldPoint;
    // 缩放因子，如果选中 sideXoYLeft，缩放的是 X 轴
    // 如果选中 sideXoYTop ，缩放的是 Y 轴
    let scaleX = false;
    let scaleY = false;
    let scaleZ = false;
    switch (this._axisName) {
      case "vertexXoYRightDown":
      case "vertexXoYRightTop":
      case "vertexXoYLeftDown":
      case "vertexXoYLeftTop":
        scaleX = scaleY = true;
        break;
      case "vertexXoZRightDown":
      case "vertexXoZRightTop":
      case "vertexXoZLeftDown":
      case "vertexXoZLeftTop":
        scaleX = scaleZ = true;
        break;
      case "vertexYoZRightDown":
      case "vertexYoZRightTop":
      case "vertexYoZLeftDown":
      case "vertexYoZLeftTop":
        scaleY = scaleZ = true;
        break;
      default:
        break;
    }
    // 将 fixedPointer 转成 World 坐标
    // 3. 简单来说，这个 fixedPointer 在缩放或者调整 Size 后，保持位置不变
    const quaternion = this._tempAffineQuat.identity();
    const translate = this._tempAffineTranslate.set(0, 0, 0);
    const scale = this._tempAffineScale.set(
      scaleX ? (temp0.x - fixedLocalPoint.x) / (startHitLocalPosition.x - fixedLocalPoint.x) : 1,
      scaleY ? (temp0.y - fixedLocalPoint.y) / (startHitLocalPosition.y - fixedLocalPoint.y) : 1,
      scaleZ ? (temp0.z - fixedLocalPoint.z) / (startHitLocalPosition.z - fixedLocalPoint.z) : 1
    );
    const toMatrix = RectControl._matrix1;
    Matrix.affineTransformation(scale, quaternion, translate, toMatrix);

    const entities = this._group.entities;
    for (let i = 0, n = entities.length; i < n; i++) {
      const entity = entities[i];
      if (this._isUITransform(entity)) {
        // UITransform 修改 size 和 position
        const transform = <UITransform>entity.transform;
        // 当前节点在 group 中的局部矩阵和局部逆矩阵
        const worldMatrix = transform.worldMatrix;
        const localMatrix = this._mat0;
        const localInvMatrix = this._mat1;
        const lossyMatrix = this._mat2;
        Matrix.multiply(worldToLocal, worldMatrix, localMatrix);
        Matrix.invert(localMatrix, localInvMatrix);
        Matrix.multiply(localInvMatrix, toMatrix, lossyMatrix);
        Matrix.multiply(lossyMatrix, localMatrix, lossyMatrix);
        // 计算固定点在当前节点的局部坐标
        const fixedPointInUI = this._tempVec30;
        Vector3.transformCoordinate(fixedLocalPoint, localInvMatrix, fixedPointInUI);
        // 避免分母为 0
        let sizeX = transform.size.x || 0.1;
        let sizeY = transform.size.y || 0.1;
        fixedPointInUI.set(fixedPointInUI.x / sizeX, fixedPointInUI.y / sizeY, fixedPointInUI.z);
        // 计算新的尺寸
        // @remarks: 这里的尺寸是有损的
        // Matrix[scale]*Matrix[local]*Size => Matrix[local]*(MatrixInv[local]*Matrix[scale]*Matrix[local])*Size
        // 当 Matrix[local] 为异形矩阵时，单纯通过修改 scale 是无法满足变形的诉求的
        // 因此此处只能近似通过 e[0] 和 e[5] 来分别计算新的宽度和高度
        const map = this._uiTransformInfoMap;
        let width = map.get(transform).width;
        let height = map.get(transform).height;
        const ele = lossyMatrix.elements;
        const newWidth = ele[0] * width;
        const newHeight = ele[5] * height;
        transform.size.set(newWidth, newHeight);
        // 在确定新的尺寸之后，通过 fixedPointer 来确定此次变化新的世界位移 Tx, Ty, Tz
        const curEle = worldMatrix.elements;
        curEle[12] =
          fixedWorldPoint.x -
          curEle[0] * newWidth * fixedPointInUI.x -
          curEle[4] * newHeight * fixedPointInUI.y -
          curEle[8] * fixedPointInUI.z;
        curEle[13] =
          fixedWorldPoint.y -
          curEle[1] * newWidth * fixedPointInUI.x -
          curEle[5] * newHeight * fixedPointInUI.y -
          curEle[9] * fixedPointInUI.z;
        curEle[14] =
          fixedWorldPoint.z -
          curEle[2] * newWidth * fixedPointInUI.x -
          curEle[6] * newHeight * fixedPointInUI.y -
          curEle[10] * fixedPointInUI.z;
        transform.worldMatrix = worldMatrix;
      } else {
        const transform = <Transform>entity.transform;
        // Transform 修改 scale 和 position
        // 固定的世界节点在当前节点的局部坐标
        const invMatrix = this._mat0;
        const tempVec31 = this._tempVec31;
        Matrix.invert(transform.worldMatrix, invMatrix);
        Vector3.transformCoordinate(fixedWorldPoint, invMatrix, tempVec31);
        // 当前节点在 group 中的局部姿态
        const worldMatrix = transform.worldMatrix;
        Matrix.multiply(localToWorld, fromMatrix, invMatrix);
        Matrix.invert(invMatrix, invMatrix);
        Matrix.multiply(invMatrix, worldMatrix, worldMatrix);
        // 当前新的叠加矩阵
        const curMatrix = this._mat1;
        Matrix.multiply(localToWorld, toMatrix, curMatrix);
        Matrix.multiply(curMatrix, worldMatrix, worldMatrix);
        const curEle = worldMatrix.elements;
        curEle[12] = fixedWorldPoint.x - curEle[0] * tempVec31.x - curEle[4] * tempVec31.y - curEle[8] * tempVec31.z;
        curEle[13] = fixedWorldPoint.y - curEle[1] * tempVec31.x - curEle[5] * tempVec31.y - curEle[9] * tempVec31.z;
        curEle[14] = fixedWorldPoint.z - curEle[2] * tempVec31.x - curEle[6] * tempVec31.y - curEle[10] * tempVec31.z;
        transform.worldMatrix = worldMatrix;
      }
    }
    fromMatrix.copyFrom(toMatrix);
    curHitLocalPosition.copyFrom(temp0);
  }

  private _onMoveVertexStart(ray: Ray): void {
    const localToWorld = this._startWorldMatrix;
    this._group.getWorldMatrix(localToWorld);
    const worldToLocal = this._startWorldInvMatrix;
    Matrix.invert(localToWorld, worldToLocal);
    const curLocalPlane = this._curLocalPlane;
    switch (this._mostSuitablePlane) {
      case CoordinatePlane.XoY:
        curLocalPlane.normal.set(0, 0, 1);
        break;
      case CoordinatePlane.XoZ:
        curLocalPlane.normal.set(0, 1, 0);
        break;
      case CoordinatePlane.YoZ:
        curLocalPlane.normal.set(1, 0, 0);
        break;
      default:
        break;
    }
    // 将射线转至局部
    // @todo：这里如果使用世界平面而非局部平面，性能是否会更好？
    Vector3.transformCoordinate(ray.origin, worldToLocal, ray.origin);
    Vector3.transformNormal(ray.direction, worldToLocal, ray.direction);
    ray.getPoint(ray.intersectPlane(curLocalPlane), this._startHitLocalPosition);
    this._curHitLocalPosition.copyFrom(this._startHitLocalPosition);
    this._fromMatrix.identity();
    const { min, max } = this._bounds;
    this._fromScale.set(1, 1, 1);
    const fixedLocalPoint = this._fixedLocalPoint;
    const fixedWorldPoint = this._fixedWorldPoint;
    switch (this._axisName) {
      case "vertexXoYRightDown":
        fixedLocalPoint.set(min.x, max.y, (max.z + min.z) / 2);
        break;
      case "vertexXoYRightTop":
        fixedLocalPoint.set(min.x, min.y, (max.z + min.z) / 2);
        break;
      case "vertexXoYLeftDown":
        fixedLocalPoint.set(max.x, max.y, (max.z + min.z) / 2);
        break;
      case "vertexXoYLeftTop":
        fixedLocalPoint.set(max.x, min.y, (max.z + min.z) / 2);
        break;
      case "vertexXoZRightDown":
        fixedLocalPoint.set(min.x, (max.y + min.y) / 2, max.z);
        break;
      case "vertexXoZRightTop":
        fixedLocalPoint.set(min.x, (max.y + min.y) / 2, min.z);
        break;
      case "vertexXoZLeftDown":
        fixedLocalPoint.set(max.x, (max.y + min.y) / 2, max.z);
        break;
      case "vertexXoZLeftTop":
        fixedLocalPoint.set(max.x, (max.y + min.y) / 2, min.z);
        break;
      case "vertexYoZRightDown":
        fixedLocalPoint.set((max.x + min.x) / 2, min.y, max.z);
        break;
      case "vertexYoZRightTop":
        fixedLocalPoint.set((max.x + min.x) / 2, min.y, min.z);
        break;
      case "vertexYoZLeftDown":
        fixedLocalPoint.set((max.x + min.x) / 2, max.y, max.z);
        break;
      case "vertexYoZLeftTop":
        fixedLocalPoint.set((max.x + min.x) / 2, max.y, min.z);
        break;
      default:
        break;
    }
    // 这个在世界中不动的位置
    Vector3.transformCoordinate(fixedLocalPoint, localToWorld, fixedWorldPoint);
    const entities = this._group.entities;
    const map = this._uiTransformInfoMap;
    for (let i = 0, n = entities.length; i < n; i++) {
      const entity = entities[i];
      if (this._isUITransform(entity)) {
        const transform = <UITransform>entity.transform;
        const size = transform.size;
        map.set(transform, { width: size.x, height: size.y });
      }
    }
  }

  private _onMoveSideStart(ray: Ray): void {
    const localToWorld = this._startWorldMatrix;
    this._group.getWorldMatrix(localToWorld);
    const worldToLocal = this._startWorldInvMatrix;
    Matrix.invert(localToWorld, worldToLocal);
    const curLocalPlane = this._curLocalPlane;
    switch (this._mostSuitablePlane) {
      case CoordinatePlane.XoY:
        curLocalPlane.normal.set(0, 0, 1);
        break;
      case CoordinatePlane.XoZ:
        curLocalPlane.normal.set(0, 1, 0);
        break;
      case CoordinatePlane.YoZ:
        curLocalPlane.normal.set(1, 0, 0);
        break;
      default:
        break;
    }
    // 将射线转至局部
    // @todo：这里如果使用世界平面而非局部平面，性能是否会更好？
    Vector3.transformCoordinate(ray.origin, worldToLocal, ray.origin);
    Vector3.transformNormal(ray.direction, worldToLocal, ray.direction);
    ray.getPoint(ray.intersectPlane(curLocalPlane), this._startHitLocalPosition);
    this._curHitLocalPosition.copyFrom(this._startHitLocalPosition);
    this._fromMatrix.identity();
    const { min, max } = this._bounds;
    this._fromScale.set(1, 1, 1);
    const fixedLocalPoint = this._fixedLocalPoint;
    const fixedWorldPoint = this._fixedWorldPoint;
    switch (this._axisName) {
      case "sideXoYLeft":
      case "sideXoZLeft":
        fixedLocalPoint.set(max.x, (max.y + min.y) / 2, (max.z + min.z) / 2);
        break;
      case "sideXoYRight":
      case "sideXoZRight":
        fixedLocalPoint.set(min.x, (max.y + min.y) / 2, (max.z + min.z) / 2);
        break;
      case "sideXoYTop":
      case "sideYoZRight":
        fixedLocalPoint.set((max.x + min.x) / 2, min.y, (max.z + min.z) / 2);
        break;
      case "sideXoYDown":
      case "sideYoZLeft":
        fixedLocalPoint.set((max.x + min.x) / 2, max.y, (max.z + min.z) / 2);
        break;
      case "sideXoZTop":
      case "sideYoZTop":
        fixedLocalPoint.set((max.x + min.x) / 2, (max.y + min.y) / 2, min.z);
        break;
      case "sideXoZDown":
      case "sideYoZDown":
        fixedLocalPoint.set((max.x + min.x) / 2, (max.y + min.y) / 2, max.z);
        break;
      default:
        break;
    }
    // 这个在世界中不动的位置
    Vector3.transformCoordinate(fixedLocalPoint, localToWorld, fixedWorldPoint);
    const entities = this._group.entities;
    const map = this._uiTransformInfoMap;
    for (let i = 0, n = entities.length; i < n; i++) {
      const entity = entities[i];
      if (this._isUITransform(entity)) {
        const transform = <UITransform>entity.transform;
        const size = transform.size;
        map.set(transform, { width: size.x, height: size.y });
      }
    }
  }

  private _onMoveCenterStart(ray: Ray): void {
    const group = this._group;
    const entities = group.entities;
    if (entities.length !== 1) return;
    const startPivot = this._startPivot;
    startPivot.copyFrom((<UITransform>entities[0].transform).pivot);
    const localToWorld = this._startWorldMatrix.copyFrom(entities[0].transform.worldMatrix);
    const worldToLocal = this._startWorldInvMatrix;
    Matrix.invert(localToWorld, worldToLocal);
    Vector3.transformCoordinate(ray.origin, worldToLocal, ray.origin);
    Vector3.transformNormal(ray.direction, worldToLocal, ray.direction);
    const curLocalPlane = this._curLocalPlane;
    curLocalPlane.normal.set(0, 0, 1);
    ray.getPoint(ray.intersectPlane(curLocalPlane), this._startHitLocalPosition);
    this._startPosition.copyFrom(entities[0].transform.position);
  }

  /**
   * 操作中心点，会改变 UITransform 的锚点和位置
   */
  private _onMoveCenter(ray: Ray): void {
    // 移动 Pivot 的时刻需要保持世界空间中的姿态不变
    // 因此需要同时调整他的 pivot 和 position
    const group = this._group;
    const entities = group.entities;
    const transform = <UITransform>entities[0].transform;
    // 1.先确定新的 pivot
    // 用世界空间的射线检测开始时的平面，根据 hit 的点计算新的 pivot
    const temp0 = RectControl._vec30;
    const startHitLocalPosition = this._startHitLocalPosition;
    const curHitLocalPosition = this._curHitLocalPosition;
    const worldToLocal = this._startWorldInvMatrix;
    Vector3.transformCoordinate(ray.origin, worldToLocal, ray.origin);
    Vector3.transformNormal(ray.direction, worldToLocal, ray.direction);
    ray.getPoint(ray.intersectPlane(this._curLocalPlane), temp0);
    curHitLocalPosition.copyFrom(temp0);
    const startPivot = this._startPivot;
    const startPosition = this._startPosition;
    const { size } = transform;
    const deltaX = curHitLocalPosition.x - startHitLocalPosition.x;
    const deltaY = curHitLocalPosition.y - startHitLocalPosition.y;
    // 避免分母为 0
    let sizeX = size.x || 0.1;
    let sizeY = size.y || 0.1;
    transform.pivot.x = startPivot.x + deltaX / sizeX;
    transform.pivot.y = startPivot.y + deltaY / sizeY;
    // 2. 根据计算得到的 Pivot 来推导新的 Position
    // 因为姿态不变，那么他的局部包围盒也不会改变
    // 通过左下角的点来锚定他的坐标 [-pivot.x * size.x, -pivot.y * size.y, 0, 1]
    const ele = transform.localMatrix.elements;
    transform.position.set(
      startPosition.x + ele[0] * deltaX + ele[4] * deltaY,
      startPosition.y + ele[1] * deltaX + ele[5] * deltaY,
      startPosition.z + ele[2] * deltaX + ele[6] * deltaY
    );
  }

  private _getLocalBoundsByTransform(transform: UITransform, out: BoundingBox): void {
    const { min: tempMin, max: tempMax } = out;
    const { x: width, y: height } = (<UITransform>transform).size;
    let { x: pivotX, y: pivotY } = (<UITransform>transform).pivot;
    tempMin.set(-width * pivotX, -height * pivotY, 0);
    tempMax.set(width * (1 - pivotX), height * (1 - pivotY), 0);
  }

  private _getLocalBoundsByRenderer(renderer: Renderer, out: BoundingBox): boolean {
    if (renderer instanceof SkinnedMeshRenderer) {
      const rootBone = renderer.rootBone;
      const localBounds = renderer.localBounds;
      if (rootBone) {
        const rootBoneWorldMatrix = rootBone.transform.worldMatrix;
        const tempBounds = this._tempBounds;
        BoundingBox.transform(localBounds, rootBoneWorldMatrix, tempBounds);
        const invMatrix = this._tempMatrix;
        Matrix.invert(renderer.entity.transform.worldMatrix, invMatrix);
        tempBounds.transform(invMatrix);
        out.copyFrom(tempBounds);
      } else {
        out.copyFrom(renderer.localBounds);
      }
      return true;
    } else if (renderer instanceof MeshRenderer) {
      if (renderer.mesh) {
        out.copyFrom(renderer.mesh.bounds);
        return true;
      } else {
        return false;
      }
    } else if (renderer instanceof SpriteRenderer || renderer instanceof SpriteMask) {
      const { min: tempMin, max: tempMax } = out;
      const { width, height } = renderer;
      const sprite = renderer.sprite;
      let pivotX = sprite?.pivot.x ?? 0.5;
      let pivotY = sprite?.pivot.y ?? 0.5;
      tempMin.set(-width * pivotX, -height * pivotY, 0);
      tempMax.set(width * (1 - pivotX), height * (1 - pivotY), 0);
      return true;
    } else if (renderer instanceof TextRenderer) {
      // @ts-ignore
      out.copyFrom(renderer._localBounds);
      return true;
    } else if (renderer instanceof ParticleRenderer) {
      return false;
    }
  }
}
