import { BoundingBox, ListenerUpdateFlag, Renderer, Vector3, Quaternion, Matrix, Entity } from "oasis-engine";

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
  private static _tempVec31: Vector3 = new Vector3();
  private static _tempQuat: Quaternion = new Quaternion();
  private static _tempMat: Matrix = new Matrix();
  private static _tempMat1: Matrix = new Matrix();
  private static _tempBoundBox: BoundingBox = new BoundingBox();

  private _anchorType: AnchorType = AnchorType.Pivot;
  private _coordinateType: CoordinateType = CoordinateType.Local;
  private _dirtyFlag: GroupDirtyFlag = GroupDirtyFlag.All;
  // 组内节点数组
  private _entities: Entity[] = [];
  // 组内节点的 local 矩阵映射
  private _localMatrixMap: Record<number, Matrix> = {};
  private _worldDirtyListenerMap: Record<number, ListenerUpdateFlag> = {};
  // 该组的世界矩阵
  private _worldMatrix: Matrix = new Matrix();
  private _worldPosition: Vector3 = new Vector3();

  /**
   * 获取锚点类型
   */
  public get anchorType(): AnchorType {
    return this._anchorType;
  }

  public set anchorType(value: AnchorType) {
    if (this._anchorType !== value) {
      this._anchorType = value;
      this._dirtyFlag |= GroupDirtyFlag.AnchorDirty;
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
      this._dirtyFlag |= GroupDirtyFlag.CoordinateDirty;
    }
  }

  /**
   * 获取组的位姿信息
   */
  public get worldMatrix(): Matrix {
    const { _entities: entities } = this;
    if (entities.length <= 0) {
      return this._worldMatrix;
    } else {
      /** Update anchor. */
      const { _worldMatrix: worldMatrix } = this;
      if (this._dirtyFlag & GroupDirtyFlag.AnchorDirty) {
        const { _tempVec30: tempVec3 } = Group;
        const { elements: e } = worldMatrix;
        // 更新锚点
        switch (this._anchorType) {
          case AnchorType.Center:
            // 计算得到中点的世界坐标
            this.getCenter(tempVec3);
            (e[12] = tempVec3.x), (e[13] = tempVec3.y), (e[14] = tempVec3.z);
            break;
          case AnchorType.Pivot:
            // 与 unity 操作相同，以第一个 entity 为参照
            const worldE = entities[0].transform.worldMatrix.elements;
            (e[12] = worldE[12]), (e[13] = worldE[13]), (e[14] = worldE[14]);
          default:
            break;
        }
      }

      /** Update coordinate. */
      if (this._dirtyFlag & GroupDirtyFlag.CoordinateDirty) {
        const { elements: e } = worldMatrix;
        switch (this._coordinateType) {
          case CoordinateType.Local:
            // 与 unity 操作相同，以第一个 entity 为参照
            const worldE = entities[0].transform.worldMatrix.elements;
            (e[0] = worldE[0]), (e[4] = worldE[4]), (e[8] = worldE[8]);
            (e[1] = worldE[1]), (e[5] = worldE[5]), (e[9] = worldE[9]);
            (e[2] = worldE[2]), (e[6] = worldE[6]), (e[10] = worldE[10]);
            break;
          case CoordinateType.Global:
            (e[0] = 1), (e[4] = 0), (e[8] = 0);
            (e[1] = 0), (e[5] = 1), (e[9] = 0);
            (e[2] = 0), (e[6] = 0), (e[10] = 1);
            break;
          default:
            break;
        }
      }

      /** Update dirty flag. */
      if (this._dirtyFlag !== GroupDirtyFlag.None) {
        const { _tempMat: tempMat } = Group;
        // 世界矩阵的逆，用来求 local 矩阵
        Matrix.invert(worldMatrix, tempMat);
        const { _localMatrixMap: localMatrixMap } = this;
        // 更新 entities 内所有物体的坐标
        for (let i = entities.length - 1; i >= 0; i--) {
          const entity = entities[i];
          const entityInstanceID = entity.instanceId;
          if (!localMatrixMap[entityInstanceID]) {
            localMatrixMap[entityInstanceID] = new Matrix();
          }
          Matrix.multiply(tempMat, entity.transform.worldMatrix, localMatrixMap[entityInstanceID]);
        }
        this._dirtyFlag = GroupDirtyFlag.None;
      }
      return worldMatrix;
    }
  }

  public set worldQuat(value: Quaternion) {
    const { _tempVec30, _tempVec31 } = Group;
    const tempMat = this.worldMatrix.clone();
    tempMat.decompose(_tempVec30, Group._tempQuat, _tempVec31);
    Matrix.affineTransformation(_tempVec31, value, _tempVec30, tempMat);
    this.worldMatrix = tempMat;
  }

  public set worldMatrix(value: Matrix) {
    const { _tempMat: tempMat, _tempMat1: tempMat1 } = Group;
    const { _worldMatrix: worldMatrix } = this;
    if (worldMatrix === value || !Matrix.equals(worldMatrix, value)) {
      if (worldMatrix !== value) {
        worldMatrix.copyFrom(value);
      }

      const { _entities: entities, _localMatrixMap: localMatrixMap } = this;
      // 更新 entities 内所有物体的坐标
      for (let i = entities.length - 1; i >= 0; i--) {
        const entity = entities[i];
        const entityInstanceID = entity.instanceId;
        const localMatrix = localMatrixMap[entityInstanceID];
        if (localMatrix) {
          Matrix.multiply(worldMatrix, localMatrix, tempMat);
          entity.transform.worldMatrix = tempMat;
        } else {
          console.log("Cant find localMatrix.");
        }
      }
    }
    /** 主动设置的时候，清理脏标记 */
    this._dirtyFlag = GroupDirtyFlag.None;
  }

  /**
   * 添加节点
   * @param addEntities
   */
  public addEntity(addEntities: Entity[]): void {
    const { _entities: entities, _localMatrixMap: localMatrixMap } = this;
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
        } else if (this.hasRelationship(compareEntity, entity)) {
          // 如果希望添加的 entity 是已有节点的子节点，那么就没有必要加进这个 group
          canAdd = false;
          break;
        } else {
          // 如果希望添加的 entity 是已有节点的子节点
          // 1. 删除已有节点
          // 2. 还要继续判断是否有其他子节点
          entities.splice(j, 1);
        }
      }
      if (canAdd) {
        entities.push(entity);
        // entity 的坐标发生改变的时候 更新 localMatrix
        const listener = entity.transform._registerWorldChangeListenser();
        listener.listener = () => {
          ((e: Entity) => {
            const entityInstanceID = e.instanceId;
            const localMatrix = localMatrixMap[entityInstanceID];
            if (localMatrix) {
              const { _tempMat: tempMat } = Group;
              Matrix.invert(this.worldMatrix, tempMat);
              Matrix.multiply(tempMat, entity.transform.worldMatrix, localMatrix);
              switch (this._anchorType) {
                case AnchorType.Center:
                  this._dirtyFlag |= GroupDirtyFlag.AnchorDirty;
                  break;
                case AnchorType.Pivot:
                  if (this._entities.indexOf(entity) === 0) {
                    this._dirtyFlag |= GroupDirtyFlag.AnchorDirty;
                  }
                  break;
                default:
                  break;
              }
            }
          })(entity);
        };
        this._worldDirtyListenerMap[entity.instanceId] = listener;
        switch (this._anchorType) {
          case AnchorType.Center:
            this._dirtyFlag |= GroupDirtyFlag.AnchorDirty;
            break;
          case AnchorType.Pivot:
            if (entities.length === 1) {
              this._dirtyFlag |= GroupDirtyFlag.AnchorDirty;
            }
            break;
          default:
            break;
        }
      }
    }
  }

  /**
   * 移除节点
   * @param delEntities
   */
  public delEntity(delEntities: Entity[]): void {
    const { _entities: entities, _worldDirtyListenerMap } = this;
    for (let i = delEntities.length - 1; i >= 0; i--) {
      const delEntity = delEntities[i];
      const index = entities.indexOf(delEntity);
      if (index >= 0) {
        entities.splice(index, 1);
        if (_worldDirtyListenerMap[delEntity.instanceId]) {
          _worldDirtyListenerMap[delEntity.instanceId].destroy();
          delete _worldDirtyListenerMap[delEntity.instanceId];
        }
        switch (this._anchorType) {
          case AnchorType.Center:
            this._dirtyFlag |= GroupDirtyFlag.AnchorDirty;
            break;
          case AnchorType.Pivot:
            if (index === 0) {
              this._dirtyFlag |= GroupDirtyFlag.AnchorDirty;
            }
            break;
          default:
            break;
        }
      }
    }
  }

  public getNormalizedMatrix(out: Matrix, s: number = 1): void {
    const { elements: ele } = this.worldMatrix;
    const { elements: gE } = out;
    let fs = s / Math.sqrt(ele[0] * ele[0] + ele[1] * ele[1] + ele[2] * ele[2]);
    (gE[0] = ele[0] * fs), (gE[1] = ele[1] * fs), (gE[2] = ele[2] * fs);
    fs = s / Math.sqrt(ele[4] * ele[4] + ele[5] * ele[5] + ele[6] * ele[6]);
    (gE[4] = ele[4] * fs), (gE[5] = ele[5] * fs), (gE[6] = ele[6] * fs);
    fs = s / Math.sqrt(ele[8] * ele[8] + ele[9] * ele[9] + ele[10] * ele[10]);
    (gE[8] = ele[8] * fs), (gE[9] = ele[9] * fs), (gE[10] = ele[10] * fs);
    (gE[12] = ele[12]), (gE[13] = ele[13]), (gE[14] = ele[14]);
  }

  /**
   * 获取中点的世界坐标
   * ps: 计算量较大
   * @param out - 中心点的世界坐标
   */
  public getCenter(out: Vector3): void {
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

  /**
   * 获取组的世界坐标
   */
  public get worldPosition(): Vector3 {
    const { _worldPosition: WP } = this;
    const { elements: e } = this.worldMatrix;
    (WP.x = e[12]), (WP.y = e[13]), (WP.z = e[14]);
    return WP;
  }

  /**
   * 解散组
   */
  public reset() {
    this._entities.length = 0;
    this._dirtyFlag = GroupDirtyFlag.All;
  }

  /**
   * 判断节点间的父子关系，在添加节点的时候调用
   * @param parent
   * @param compareChild
   * @returns
   */
  private hasRelationship(parent: Entity, compareChild: Entity): boolean {
    while (compareChild.parent) {
      if (parent === compareChild.parent) {
        return true;
      } else {
        compareChild = compareChild.parent;
      }
    }
    return false;
  }
}

enum GroupDirtyFlag {
  None = 0,
  AnchorDirty = 1,
  CoordinateDirty = 2,
  All = 3
}
