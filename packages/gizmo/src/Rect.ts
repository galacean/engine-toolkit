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
  SpriteRenderer,
  SubMesh,
  TextRenderer,
  Vector2,
  Vector3
} from "@galacean/engine";
import { Group } from "./Group";
import { GizmoComponent } from "./Type";
import { Utils } from "./Utils";
import { State } from "./enums/GizmoState";
import { CoordinateType } from "./enums/GroupState";
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

  private _group: Group;
  private _camera: Camera;
  private _bounds: BoundingBox = new BoundingBox();

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
  // ------- YoZ 平面结束 -------

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
    }
  }

  /** Called when pointer enters gizmo. */
  onHoverStart(axisName: string): void {
    console.log("on hover start", axisName);
  }

  /** Called when pointer leaves gizmo. */
  onHoverEnd(): void {
    console.log("on hover end");
  }

  /** Called when gizmo starts to move.*/
  onMoveStart(ray: Ray, axisName: string): void {
    this._axisName = axisName;
    this._lockPlane = true;
    this._onMoveStart(ray);
    console.log("on move start", axisName);
  }

  /** Called when gizmo is moving.*/
  onMove(ray: Ray, pointer?: Pointer): void {
    switch (this._axisName) {
      case "planeXoY":
      case "planeXoZ":
      case "planeYoZ":
        this._onMovePlane(ray);
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
      default:
        break;
    }
  }

  /** Called when gizmo movement ends.*/
  onMoveEnd(): void {
    this._axisName = "";
    this._lockPlane = false;
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
    const bounds = this._updateBounds();
    const { min, max } = bounds;
    const extent = RectControl._vec33;
    length = bounds.getExtent(extent).length();
    if (length <= 0 || length >= Number.MAX_VALUE) {
      return;
    }
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
    const cameraPosition = this._camera.entity.transform.worldPosition;
    const vec3 = RectControl._vec30.set(ele[12], ele[13], ele[14]);
    const scale = Vector3.distance(cameraPosition, vec3) * Utils.rectFactor;
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
          const centerTransform = this._centerXoY.transform;
          centerTransform.position.set((min.x + max.x) / 2, (min.y + max.y) / 2, (min.z + max.z) / 2);
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
          const centerTransform = this._centerXoZ.transform;
          centerTransform.position.set((min.x + max.x) / 2, (min.y + max.y) / 2, (min.z + max.z) / 2);
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
          const centerTransform = this._centerYoZ.transform;
          centerTransform.position.set((min.x + max.x) / 2, (min.y + max.y) / 2, (min.z + max.z) / 2);
          centerTransform.scale.set(scale, scale, scale);
        }
        break;
      default:
        break;
    }
  }

  /** Called when camera switch between ortho and perps.*/
  onSwitch(isModified: boolean): void {
    console.log("on Switch");
  }

  /** Called when axis alpha needs to be modified.*/
  onAlphaChange(axisName: string, value: number): void {}

  /**
   * 当 Group 的 Matrix 发生改变的时候会重新计算包围盒
   * @returns
   */
  private _updateBounds(): BoundingBox {
    const bounds = this._bounds;
    const { min, max } = bounds;
    min.set(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
    max.set(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
    const tempBounds = RectControl._bounds;
    const { min: tempMin, max: tempMax } = tempBounds;
    const group = this._group;
    const { entities, coordinateType } = group;
    // 需要注意的是，Gizmo 的参照坐标系是以 PrimaryEntity 为准，且忽略缩放的
    // @mark：
    // 在 Local 模式下，它可能是个异形的坐标系，即 X Y Z 轴在世界基准下可能并不垂直
    // 我认为，这样的坐标系才是真正的 Local 坐标系，也更加准确
    // **这点和 Unity 不一样**
    const primaryEntity = group.getPrimaryEntity();
    const renderers = [];
    // 计算 Bounds 的 local scale
    const worldMatrix = primaryEntity.transform.worldMatrix;
    const ele = worldMatrix.elements;
    if (coordinateType === CoordinateType.Local) {
      const sx = Math.sqrt(ele[0] ** 2 + ele[1] ** 2 + ele[2] ** 2);
      const sy = Math.sqrt(ele[4] ** 2 + ele[5] ** 2 + ele[6] ** 2);
      const sz = Math.sqrt(ele[8] ** 2 + ele[9] ** 2 + ele[10] ** 2);
      const worldInvMatrix = RectControl._matrix1;
      Matrix.invert(worldMatrix, worldInvMatrix);
      for (let i = 0, n = entities.length; i < n; i++) {
        const entity = entities[i];
        if (!entity.isActiveInHierarchy) continue;
        const isPrimary = entity === primaryEntity;
        entity.getComponentsIncludeChildren(Renderer, renderers);
        for (let j = 0, n = renderers.length; j < n; j++) {
          const renderer = renderers[j];
          if (isPrimary) {
            if (renderer instanceof SkinnedMeshRenderer) {
              tempBounds.copyFrom(renderer.localBounds);
              (tempMin.x *= sx), (tempMin.y *= sy), (tempMin.z *= sz);
              (tempMax.x *= sx), (tempMax.y *= sy), (tempMax.z *= sz);
              BoundingBox.merge(bounds, tempBounds, bounds);
            } else if (renderer instanceof MeshRenderer) {
              tempBounds.copyFrom(renderer.mesh.bounds);
              (tempMin.x *= sx), (tempMin.y *= sy), (tempMin.z *= sz);
              (tempMax.x *= sx), (tempMax.y *= sy), (tempMax.z *= sz);
              BoundingBox.merge(bounds, tempBounds, bounds);
            } else if (renderer instanceof SpriteRenderer) {
              const sprite = renderer.sprite;
              if (sprite) {
                const { width, height } = renderer;
                let { x: pivotX, y: pivotY } = sprite.pivot;
                pivotX = renderer.flipX ? 1 - pivotX : pivotX;
                pivotY = renderer.flipY ? 1 - pivotY : pivotY;
                tempBounds.min.set(-width * pivotX, -height * pivotY, 0);
                tempBounds.max.set(width * (1 - pivotX), height * (1 - pivotY), 0);
              } else {
                tempBounds.min.set(0, 0, 0);
                tempBounds.max.set(0, 0, 0);
              }
              (tempMin.x *= sx), (tempMin.y *= sy), (tempMin.z *= sz);
              (tempMax.x *= sx), (tempMax.y *= sy), (tempMax.z *= sz);
              BoundingBox.merge(bounds, tempBounds, bounds);
            } else if (renderer instanceof TextRenderer) {
              // 需要等 UI 代码合并
              continue;
            } else if (renderer instanceof ParticleRenderer) {
              // 粒子没有包围盒
              continue;
            } else {
              // @Todo：UI
            }
          } else {
            if (renderer instanceof ParticleRenderer) {
              // 粒子没有包围盒
              continue;
            } else {
              tempBounds.copyFrom(renderer.bounds);
              tempBounds.transform(worldInvMatrix);
              BoundingBox.merge(bounds, tempBounds, bounds);
            }
          }
        }
      }
    } else {
      for (let i = 0, n = entities.length; i < n; i++) {
        const entity = entities[i];
        if (!entity.isActiveInHierarchy) continue;
        entity.getComponentsIncludeChildren(Renderer, renderers);
        for (let j = 0, n = renderers.length; j < n; j++) {
          const renderer = renderers[j];
          if (renderer instanceof ParticleRenderer) {
            // 粒子没有包围盒
            continue;
          } else {
            tempBounds.copyFrom(renderer.bounds);
            BoundingBox.merge(bounds, tempBounds, bounds);
          }
        }
      }
      (min.x -= ele[12]), (min.y -= ele[13]), (min.z -= ele[14]);
      (max.x -= ele[12]), (max.y -= ele[13]), (max.z -= ele[14]);
    }
    return bounds;
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
    pickRenderer.priority = 1;
    const pickMesh = PrimitiveMesh.createCylinder(engine, 0.15, 0.15, 1);
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
    pickRenderer.priority = 2;
    const pickMesh = PrimitiveMesh.createSphere(engine, this._pickRadius);
    pickRenderer.mesh = pickMesh;
    pickRenderer.setMaterial(Utils.invisibleMaterialRect);

    // ---------- 这部分是拖拽旋转的 ----------
    const rotateEntity = entity.createChild(name + "Rotate");
    rotateEntity.transform.position = rotatePointerLocalPosition;
    // Invisible Renderer (for pick)
    const rotatePickRenderer = rotateEntity.addComponent(MeshRenderer);
    rotatePickRenderer.priority = 2;
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
    pickRenderer.priority = 1;
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
    pickRenderer.priority = 10;
    const pickMesh = PrimitiveMesh.createSphere(engine, 0.5);
    pickRenderer.mesh = pickMesh;
    pickRenderer.setMaterial(Utils.invisibleMaterialRect);
    return entity;
  }

  // 点击开始时 Group 的世界矩阵
  private _startGroupWorldMatrix: Matrix = new Matrix();
  // 点击开始时 Group 的世界逆矩阵
  private _startGroupWorldInvMatrix: Matrix = new Matrix();
  // 局部平面，会随着当前面向的平面发生改变
  private _curLocalPlane: Plane = new Plane(new Vector3(0, 1, 0), 0);
  private _startHitLocalPosition: Vector3 = new Vector3();
  private _curHitLocalPosition: Vector3 = new Vector3();
  // 这个 matrix 是带缩放的
  private _fromMatrix: Matrix = new Matrix();
  private xSize: number;
  private ySize: number;
  private zSize: number;

  /**
   * 操作位置拖动，会改变 Transform 的 position（基于初始平面的双轴）
   * @param ray
   */
  private _onMovePlane(ray: Ray): void {
    const startHitLocalPosition = this._startHitLocalPosition;
    const curHitLocalPosition = this._curHitLocalPosition;
    const worldToLocal = this._startGroupWorldInvMatrix;
    Vector3.transformCoordinate(ray.origin, worldToLocal, ray.origin);
    Vector3.transformNormal(ray.direction, worldToLocal, ray.direction);

    const startGroupWorldMatrix = this._startGroupWorldMatrix;
    const temp0 = RectControl._vec30;
    const temp1 = RectControl._vec31;
    ray.getPoint(ray.intersectPlane(this._curLocalPlane), temp0);
    Vector3.subtract(temp0, startHitLocalPosition, temp1);
    const fromMatrix = this._fromMatrix;
    const toMatrix = RectControl._matrix1;
    Matrix.affineTransformation(new Vector3(1, 1, 1), new Quaternion(), temp1, toMatrix);
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
    const startGroupWorldMatrix = this._startGroupWorldMatrix;
    const worldToLocal = this._startGroupWorldInvMatrix;
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
        // 绕 - Y 轴旋转
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
   * 操作大小，会改变 Transform 的 scale 或 size（基于初始平面的单轴）
   */
  private _onMoveSide(ray: Ray): void {
    const curHitLocalPosition = this._curHitLocalPosition;
    const worldToLocal = this._startGroupWorldInvMatrix;
    Vector3.transformCoordinate(ray.origin, worldToLocal, ray.origin);
    Vector3.transformNormal(ray.direction, worldToLocal, ray.direction);
    const temp0 = RectControl._vec30;
    ray.getPoint(ray.intersectPlane(this._curLocalPlane), temp0);

    const toMatrix = RectControl._matrix1;
    const scale = new Vector3(1, 1, 1);
    const translate = new Vector3(0, 0, 0);
    switch (this._axisName) {
      case "sideXoYLeft":
      case "sideXoZLeft":
        scale.x = (temp0.x / this._startHitLocalPosition.x + 1) / 2;
        translate.x -= (this.xSize * (scale.x - 1)) / 2;
        break;
      case "sideXoYRight":
      case "sideXoZRight":
        scale.x = (temp0.x / this._startHitLocalPosition.x + 1) / 2;
        translate.x += (this.xSize * (scale.x - 1)) / 2;
        break;
      case "sideYoZLeft":
      case "sideXoYDown":
        scale.y = (temp0.y / this._startHitLocalPosition.y + 1) / 2;
        translate.y -= (this.ySize * (scale.y - 1)) / 2;
        break;
      case "sideYoZRight":
      case "sideXoYTop":
        scale.y = (temp0.y / this._startHitLocalPosition.y + 1) / 2;
        translate.y += (this.ySize * (scale.y - 1)) / 2;
        break;
      case "sideXoZDown":
      case "sideYoZDown":
        scale.z = (temp0.z / this._startHitLocalPosition.z + 1) / 2;
        translate.z -= (this.zSize * (scale.z - 1)) / 2;
        break;
      case "sideXoZTop":
      case "sideYoZTop":
        scale.z = (temp0.z / this._startHitLocalPosition.z + 1) / 2;
        translate.z += (this.zSize * (scale.z - 1)) / 2;
        break;
      default:
        break;
    }
    Matrix.affineTransformation(scale, new Quaternion(), translate, toMatrix);
    const startGroupMatrix = this._startGroupWorldMatrix;
    Matrix.multiply(startGroupMatrix, toMatrix, toMatrix);
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
    const localToWorld = this._startGroupWorldMatrix;
    this._group.getWorldMatrix(localToWorld);
    const worldToLocal = this._startGroupWorldInvMatrix;
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
    this._fromMatrix.copyFrom(localToWorld);
    const { min, max } = this._bounds;
    this.xSize = max.x - min.x;
    this.ySize = max.y - min.y;
    this.zSize = max.z - min.z;
  }

  /**
   * 操作顶点，会改变：
   * - Transform 的缩放（双轴）
   * - UITransform 的尺寸（双轴）
   */
  private _onMoveVertex(ray: Ray): void {
    const curHitLocalPosition = this._curHitLocalPosition;
    const worldToLocal = this._startGroupWorldInvMatrix;
    Vector3.transformCoordinate(ray.origin, worldToLocal, ray.origin);
    Vector3.transformNormal(ray.direction, worldToLocal, ray.direction);
    const temp0 = RectControl._vec30;
    ray.getPoint(ray.intersectPlane(this._curLocalPlane), temp0);

    const toMatrix = RectControl._matrix1;
    const scale = new Vector3(1, 1, 1);
    const translate = new Vector3(0, 0, 0);
    switch (this._axisName) {
      case "vertexXoYLeftTop":
        // X 与 Y 轴同时缩放
        scale.x = (temp0.x / this._startHitLocalPosition.x + 1) / 2;
        scale.y = (temp0.y / this._startHitLocalPosition.y + 1) / 2;
        translate.x -= (this.xSize * (scale.x - 1)) / 2;
        translate.y += (this.ySize * (scale.y - 1)) / 2;
        break;
      case "vertexXoYRightTop":
        // X 与 Y 轴同时缩放
        scale.x = (temp0.x / this._startHitLocalPosition.x + 1) / 2;
        scale.y = (temp0.y / this._startHitLocalPosition.y + 1) / 2;
        translate.x += (this.xSize * (scale.x - 1)) / 2;
        translate.y += (this.ySize * (scale.y - 1)) / 2;
        break;
      case "vertexXoYRightDown":
        // X 与 Y 轴同时缩放
        scale.x = (temp0.x / this._startHitLocalPosition.x + 1) / 2;
        scale.y = (temp0.y / this._startHitLocalPosition.y + 1) / 2;
        translate.x += (this.xSize * (scale.x - 1)) / 2;
        translate.y -= (this.ySize * (scale.y - 1)) / 2;
        break;
      case "vertexXoYLeftDown":
        // X 与 Y 轴同时缩放
        scale.x = (temp0.x / this._startHitLocalPosition.x + 1) / 2;
        scale.y = (temp0.y / this._startHitLocalPosition.y + 1) / 2;
        translate.x -= (this.xSize * (scale.x - 1)) / 2;
        translate.y -= (this.ySize * (scale.y - 1)) / 2;
        break;
      case "vertexXoZLeftTop":
        // X 与 Z 轴同时缩放
        scale.x = (temp0.x / this._startHitLocalPosition.x + 1) / 2;
        scale.z = (temp0.z / this._startHitLocalPosition.z + 1) / 2;
        translate.x -= (this.xSize * (scale.x - 1)) / 2;
        translate.z += (this.zSize * (scale.z - 1)) / 2;
        break;
      case "vertexXoZRightTop":
        // X 与 Z 轴同时缩放
        scale.x = (temp0.x / this._startHitLocalPosition.x + 1) / 2;
        scale.z = (temp0.z / this._startHitLocalPosition.z + 1) / 2;
        translate.x += (this.xSize * (scale.x - 1)) / 2;
        translate.z += (this.zSize * (scale.z - 1)) / 2;
        break;
      case "vertexXoZRightDown":
        // X 与 Z 轴同时缩放
        scale.x = (temp0.x / this._startHitLocalPosition.x + 1) / 2;
        scale.z = (temp0.z / this._startHitLocalPosition.z + 1) / 2;
        translate.x += (this.xSize * (scale.x - 1)) / 2;
        translate.z -= (this.zSize * (scale.z - 1)) / 2;
        break;
      case "vertexXoZLeftDown":
        // X 与 Z 轴同时缩放
        scale.x = (temp0.x / this._startHitLocalPosition.x + 1) / 2;
        scale.z = (temp0.z / this._startHitLocalPosition.z + 1) / 2;
        translate.x -= (this.xSize * (scale.x - 1)) / 2;
        translate.z -= (this.zSize * (scale.z - 1)) / 2;
        break;
      case "vertexYoZLeftTop":
        // Y 与 Z 轴同时缩放
        scale.y = (temp0.y / this._startHitLocalPosition.y + 1) / 2;
        scale.z = (temp0.z / this._startHitLocalPosition.z + 1) / 2;
        translate.y -= (this.ySize * (scale.y - 1)) / 2;
        translate.z += (this.zSize * (scale.z - 1)) / 2;
        break;
      case "vertexYoZRightTop":
        // Y 与 Z 轴同时缩放
        scale.y = (temp0.y / this._startHitLocalPosition.y + 1) / 2;
        scale.z = (temp0.z / this._startHitLocalPosition.z + 1) / 2;
        translate.y += (this.ySize * (scale.y - 1)) / 2;
        translate.z += (this.zSize * (scale.z - 1)) / 2;
        break;
      case "vertexYoZRightDown":
        // Y 与 Z 轴同时缩放
        scale.y = (temp0.y / this._startHitLocalPosition.y + 1) / 2;
        scale.z = (temp0.z / this._startHitLocalPosition.z + 1) / 2;
        translate.y += (this.ySize * (scale.y - 1)) / 2;
        translate.z -= (this.zSize * (scale.z - 1)) / 2;
        break;
      case "vertexYoZLeftDown":
        // Y 与 Z 轴同时缩放
        scale.y = (temp0.y / this._startHitLocalPosition.y + 1) / 2;
        scale.z = (temp0.z / this._startHitLocalPosition.z + 1) / 2;
        translate.y -= (this.ySize * (scale.y - 1)) / 2;
        translate.z -= (this.zSize * (scale.z - 1)) / 2;
        break;
      default:
        break;
    }
    Matrix.affineTransformation(scale, new Quaternion(), translate, toMatrix);
    const startGroupMatrix = this._startGroupWorldMatrix;
    Matrix.multiply(startGroupMatrix, toMatrix, toMatrix);
    const fromMatrix = this._fromMatrix;
    this._group.applyTransform(fromMatrix, toMatrix);
    fromMatrix.copyFrom(toMatrix);
    curHitLocalPosition.copyFrom(temp0);
  }

  /**
   * 操作中心点，会改变 UITransform 的锚点
   */
  private _onMoveCenter(ray: Ray): void {}
}
