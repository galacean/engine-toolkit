import { BoundingBox, Renderer, Vector3, Matrix, Entity, ListenerUpdateFlag } from "oasis-engine";

export enum AnchorType {
  Pivot,
  Center
}

export enum CoordinateType {
  Local,
  Global
}

/**
 * 组.
 * todo: 增加对子节点世界坐标改变的监听
 */
export class Group {
  // 临时变量
  private static _tempVec30: Vector3 = new Vector3();
  private static _tempMat0: Matrix = new Matrix();
  private static _tempMat1: Matrix = new Matrix();
  private static _tempBoundBox: BoundingBox = new BoundingBox();

  // @internal
  _gizmoTransformDirty: boolean = true;

  // Group 内 Entity 数组
  private _entities: Entity[] = [];
  private _listeners: ListenerUpdateFlag[] = [];
  // Group 的世界矩阵
  private _worldMatrix: Matrix = new Matrix();
  // 锚点类(Pivot, Center)
  private _anchorType: AnchorType = AnchorType.Pivot;
  // 坐标系类型(Local, Global)
  private _coordinateType: CoordinateType = CoordinateType.Local;
  private _dirtyFlag: GroupDirtyFlag = GroupDirtyFlag.All;

  /**
   * 获取锚点类型
   */
  public get anchorType(): AnchorType {
    return this._anchorType;
  }

  public set anchorType(value: AnchorType) {
    if (this._anchorType !== value) {
      this._anchorType = value;
      this.setDirtyFlagTrue(GroupDirtyFlag.AnchorDirty);
    }
  }

  /**
   * 获取坐标系类型
   */
  public get coordinateType(): CoordinateType {
    return this._coordinateType;
  }

  public set coordinateType(value: CoordinateType) {
    if (this._coordinateType !== value) {
      this._coordinateType = value;
      this.setDirtyFlagTrue(GroupDirtyFlag.CoordinateDirty);
    }
  }

  /**
   * 强制更新某个标记
   */
  public forceUpdate(flag: GroupDirtyFlag) {
    this._dirtyFlag |= flag;
  }

  /**
   * 获取 group 在世界空间的位姿
   * @param out
   * @returns
   */
  public getWorldMatrix(out?: Matrix): Boolean {
    if (this._entities.length <= 0) {
      return false;
    } else {
      /** Update anchor. */
      this._updateAnchor();
      /** Update coordinate. */
      this._updateCoordinate();
      out && out.copyFrom(this._worldMatrix);
      return true;
    }
  }

  /**
   * 获取 group 在世界空间的位置
   * @param out
   * @returns
   */
  public getWorldPosition(out?: Vector3): void {
    if (this.getWorldMatrix()) {
      const { elements: ele } = this._worldMatrix;
      out.set(ele[12], ele[13], ele[14]);
    }
  }

  /**
   * 设置 group 在世界空间中的位姿
   * @param value
   */
  public setWorldMatrix(value: Matrix) {
    if (this.getWorldMatrix()) {
      const { _worldMatrix: worldMatrix } = this;
      if (!Matrix.equals(worldMatrix, value)) {
        // Old worldMatrix.
        const { _tempMat0: groupWorldInvMat, _tempMat1: nodeMat } = Group;
        Matrix.invert(worldMatrix, groupWorldInvMat);
        // New worldMatrix.
        worldMatrix.copyFrom(value);
        const { _entities: entities } = this;
        // 更新 entities 内所有物体的坐标
        for (let i = entities.length - 1; i >= 0; i--) {
          const nodeTrans = entities[i].transform;
          // Get entity's localMatrix.
          Matrix.multiply(groupWorldInvMat, nodeTrans.worldMatrix, nodeMat);
          // Update entity's worldMatrix.
          Matrix.multiply(worldMatrix, nodeMat, nodeMat);
          nodeTrans.worldMatrix = nodeMat;
        }
      }
      /** 主动设置的时候，清理脏标记 */
      this._dirtyFlag = GroupDirtyFlag.None;
    }
  }

  /**
   * 添加节点
   * @param addEntities
   */
  public addEntity(addEntities: Entity[]): void {
    const { _entities: entities } = this;
    for (let i = addEntities.length - 1; i >= 0; i--) {
      // 1.不存在已有的组内
      // 2.不是任意点的子节点
      // 3.需要删除他的子节点
      const entity = addEntities[i];
      let canAdd: boolean = true;
      // 1.不存在已有的组内
      for (let j = entities.length - 1; j >= 0; j--) {
        const compareEntity = entities[j];
        if (compareEntity === entity) {
          // 完全相等
          canAdd = false;
          break;
        } else if (this._hasRelationship(compareEntity, entity)) {
          // 如果希望添加的 entity 是已有节点的子节点，那么就没有必要加进这个 group
          canAdd = false;
          break;
        } else {
          // 如果希望添加的 entity 是已有节点的子节点
          // 1. 删除已有节点
          // 2. 还要继续判断是否有其他子节点
          this._applyDel(j);
        }
      }
      if (canAdd) {
        this._applyAdd(entity);
      }
    }
  }

  public setDirtyFlagTrue(flag: GroupDirtyFlag) {
    this._dirtyFlag |= flag;
    this._gizmoTransformDirty = true;
  }

  /** 添加一个节点的连锁操作 */
  private _applyAdd(entity: Entity) {
    this._entities.push(entity);
    const listener = entity.transform._registerWorldChangeListener();
    this._listeners.push(listener);
    const fun = this._onEntityWorldTransformChange(entity);
    listener.listener = fun;
    // 第一次加入的时候，会调用一次
    fun();
  }

  /** 移除一个节点的连锁操作 */
  private _applyDel(value: Entity | number) {
    const index = typeof value === "number" ? value : this._entities.indexOf(value);
    if (index === 0) {
      if (this._coordinateType === CoordinateType.Local) {
        // Local 模式下需要更新旋转，缩放和位移
        this.setDirtyFlagTrue(GroupDirtyFlag.All);
      } else {
        this.setDirtyFlagTrue(GroupDirtyFlag.AnchorDirty);
      }
      this._entities.splice(index, 1);
      this._listeners[index].destroy();
      this._listeners.splice(index, 1);
    } else if (index > 0) {
      if (this._anchorType === AnchorType.Center) {
        this.setDirtyFlagTrue(GroupDirtyFlag.AnchorDirty);
      }
      this._entities.splice(index, 1);
      this._listeners[index].destroy();
      this._listeners.splice(index, 1);
    }
  }

  /**
   * 监听的子节点全局坐标发生改变
   */
  private _onEntityWorldTransformChange(entity: Entity): () => void {
    return () => {
      if (this._entities.indexOf(entity) === 0) {
        // 如果这个 entity 是参考节点
        if (this._coordinateType === CoordinateType.Local) {
          // Local 模式下需要更新旋转，缩放和位移
          this.setDirtyFlagTrue(GroupDirtyFlag.All);
        } else {
          this.setDirtyFlagTrue(GroupDirtyFlag.AnchorDirty);
        }
      } else {
        if (this._anchorType === AnchorType.Center) {
          this.setDirtyFlagTrue(GroupDirtyFlag.AnchorDirty);
        }
      }
    };
  }

  /**
   * 移除 group 中的 entity
   * @param delEntities
   */
  public delEntity(delEntities: Entity[]): void {
    for (let i = delEntities.length - 1; i >= 0; i--) {
      this._applyDel(delEntities[i]);
    }
  }

  /**
   * 解散组
   */
  public reset() {
    this._entities.length = 0;
    const { _listeners: listeners } = this;
    for (let i = listeners.length - 1; i >= 0; i--) {
      listeners[i].destroy();
    }
    listeners.length = 0;
    this._dirtyFlag = GroupDirtyFlag.All;
  }

  /**
   * 判断节点间的父子关系，在添加节点的时候调用
   * @param parent
   * @param compareChild
   * @returns
   */
  private _hasRelationship(parent: Entity, compareChild: Entity): boolean {
    while (compareChild.parent) {
      if (parent === compareChild.parent) {
        return true;
      } else {
        compareChild = compareChild.parent;
      }
    }
    return false;
  }

  private _updateAnchor() {
    if (this._dirtyFlag & GroupDirtyFlag.AnchorDirty) {
      const { _worldMatrix: worldMatrix } = this;
      const { _tempVec30: tempVec3 } = Group;
      const { elements: e } = worldMatrix;
      // 更新锚点
      switch (this._anchorType) {
        case AnchorType.Center:
          // 计算得到中点的世界坐标
          this._getCenter(tempVec3);
          (e[12] = tempVec3.x), (e[13] = tempVec3.y), (e[14] = tempVec3.z);
          break;
        case AnchorType.Pivot:
          // 与 unity 操作相同，以第一个 entity 为参照
          const worldE = this._entities[0].transform.worldMatrix.elements;
          (e[12] = worldE[12]), (e[13] = worldE[13]), (e[14] = worldE[14]);
        default:
          break;
      }
      this._dirtyFlag &= ~GroupDirtyFlag.AnchorDirty;
    }
  }

  private _updateCoordinate() {
    /** Update coordinate. */
    if (this._dirtyFlag & GroupDirtyFlag.CoordinateDirty) {
      const { elements: e } = this._worldMatrix;
      switch (this._coordinateType) {
        case CoordinateType.Local:
          // 与 unity 操作相同，以第一个 entity 为参照
          const wE = this._entities[0].transform.worldMatrix.elements;
          const sx = 1 / Math.sqrt(wE[0] ** 2 + wE[1] ** 2 + wE[2] ** 2);
          const sy = 1 / Math.sqrt(wE[4] ** 2 + wE[5] ** 2 + wE[6] ** 2);
          const sz = 1 / Math.sqrt(wE[8] ** 2 + wE[9] ** 2 + wE[10] ** 2);
          (e[0] = wE[0] * sx), (e[4] = wE[4] * sy), (e[8] = wE[8] * sz);
          (e[1] = wE[1] * sx), (e[5] = wE[5] * sy), (e[9] = wE[9] * sz);
          (e[2] = wE[2] * sx), (e[6] = wE[6] * sy), (e[10] = wE[10] * sz);
          break;
        case CoordinateType.Global:
          (e[0] = 1), (e[4] = 0), (e[8] = 0);
          (e[1] = 0), (e[5] = 1), (e[9] = 0);
          (e[2] = 0), (e[6] = 0), (e[10] = 1);
          break;
        default:
          break;
      }
      this._dirtyFlag &= ~GroupDirtyFlag.CoordinateDirty;
    }
  }

  private _getCenter(out: Vector3): void {
    // 拿所有 entity 形成的包围盒的中点
    const { _tempBoundBox: tempBoundBox } = Group;
    tempBoundBox.min.set(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
    tempBoundBox.max.set(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
    const { _entities: entities } = this;
    for (let i = entities.length - 1; i >= 0; i--) {
      const entity = entities[i];
      const renderers = entity.getComponentsIncludeChildren(Renderer, []);
      for (let j = renderers.length - 1; j >= 0; j--) {
        const renderer = renderers[j];
        if (renderer.entity.isActiveInHierarchy) {
          BoundingBox.merge(tempBoundBox, renderers[j].bounds, tempBoundBox);
        }
      }
    }
    tempBoundBox.getCenter(out);
  }
}

export enum GroupDirtyFlag {
  None = 0,
  AnchorDirty = 1,
  CoordinateDirty = 2,
  All = 3
}
