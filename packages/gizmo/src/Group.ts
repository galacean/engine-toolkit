import { BoundingBox, Entity, Matrix, ParticleRenderer, Renderer, Vector3 } from "@galacean/engine";
import { AnchorType, CoordinateType } from "./enums/GroupState";

/**
 * dirty flag for the group
 */
export enum GroupDirtyFlag {
  /**
   * none
   */
  None = 0,
  /**
   * anchor changed
   */
  AnchorDirty = 1,
  /**
   * coordinate changed
   */
  CoordinateDirty = 2,
  /**
   * anchor & coordinate changed
   */
  All = 3
}

/**
 * Group
 */
export class Group {
  private static _tempVec30: Vector3 = new Vector3();
  private static _tempMat0: Matrix = new Matrix();
  private static _tempMat1: Matrix = new Matrix();
  private static _tempBoundBox: BoundingBox = new BoundingBox();

  // @internal
  _gizmoTransformDirty: boolean = true;

  private _entities: Entity[] = [];
  private _listeners: { flagManager; fun: (entity: Entity) => void }[] = [];
  private _worldMatrix: Matrix = new Matrix();
  private _anchorType: AnchorType = AnchorType.Pivot;
  private _coordinateType: CoordinateType = CoordinateType.Local;
  private _dirtyFlag: GroupDirtyFlag = GroupDirtyFlag.All;

  get entities(): Entity[] {
    return this._entities;
  }

  /**
   * get anchor type
   * @return anchor type, pivot or center
   */
  get anchorType(): AnchorType {
    return this._anchorType;
  }

  set anchorType(value: AnchorType) {
    if (this._anchorType !== value) {
      this._anchorType = value;
      this.setDirtyFlagTrue(GroupDirtyFlag.AnchorDirty);
    }
  }

  /**
   * get coordinate type
   * @return coordinate type, world or local
   */
  get coordinateType(): CoordinateType {
    return this._coordinateType;
  }

  set coordinateType(value: CoordinateType) {
    if (this._coordinateType !== value) {
      this._coordinateType = value;
      this.setDirtyFlagTrue(GroupDirtyFlag.CoordinateDirty);
    }
  }
  /**
   * add entity to the group
   * @param addEntity - entity to add
   */
  addEntity(addEntity: Entity): boolean {
    const { _entities: entities } = this;
    let canAdd: boolean = true;
    for (let j = entities.length - 1; j >= 0; j--) {
      const compareEntity = entities[j];
      if (compareEntity === addEntity) {
        canAdd = false;
        break;
      } else if (this._hasRelationship(compareEntity, addEntity)) {
        canAdd = false;
        break;
      } else if (this._hasRelationship(addEntity, compareEntity)) {
        this._applyDel(j);
      }
    }
    if (canAdd) {
      this._applyAdd(addEntity);
    }

    return canAdd;
  }

  /**
   * add entities to the group
   * @param addEntities - entities to add, in array
   */
  addEntities(addEntities: Entity[]): void {
    for (let i = addEntities.length - 1; i >= 0; i--) {
      this.addEntity(addEntities[i]);
    }
  }

  /**
   * remove entity from the group
   * @param delEntity - entity to delete
   */
  deleteEntity(delEntity: Entity): void {
    this._applyDel(delEntity);
  }

  /**
   * remove entities from the group
   * @param delEntities - entities to delete, in array
   */
  deleteEntities(delEntities: Entity[]): void {
    for (let i = delEntities.length - 1; i >= 0; i--) {
      this.deleteEntity(delEntities[i]);
    }
  }

  /**
   * get entity index in group
   * @param entity
   * @return number, -1 if not in group
   */
  getIndexOf(entity: Entity): number {
    const { _entities: entities } = this;
    return entities.findIndex((ele: Entity) => {
      return entity === ele;
    });
  }

  /**
   * clear the group
   */
  reset(): void {
    this._entities.length = 0;
    const { _listeners: listeners } = this;
    for (let i = listeners.length - 1; i >= 0; i--) {
      const listener = listeners[i];
      listener.flagManager.removeListener(listener.fun);
    }
    listeners.length = 0;
    this._dirtyFlag = GroupDirtyFlag.All;
  }

  /**
   * get group's world matrix
   * @param out - updated world matrix for the group
   * @return boolean, true if group's world matrix needs update
   */
  getWorldMatrix(out?: Matrix): Boolean {
    if (this._entities.length <= 0) {
      return false;
    } else {
      this._updateAnchor();
      this._updateCoordinate();
      out && out.copyFrom(this._worldMatrix);
      return true;
    }
  }

  /**
   * get group's world position
   * @param out - updated world position for the group
   */
  getWorldPosition(out?: Vector3): void {
    if (this.getWorldMatrix()) {
      const { elements: ele } = this._worldMatrix;
      out.set(ele[12], ele[13], ele[14]);
    }
  }

  /**
   * 获取主要的 Entity，即第一个选中的 Entity
   * @return Entity
   */
  getPrimaryEntity(): Entity {
    const { _entities: entities } = this;
    return entities.length > 0 ? entities[0] : null;
  }

  /**
   * 从上个状态的矩阵变换到目标矩阵
   * from 矩阵计算所有节点的在本次变换中的 local 姿态
   * to 矩阵计算所有节点的在本次变换后的 world 姿态
   * @param from - 初始矩阵
   * @param to - 目标矩阵
   */
  applyTransform(from: Matrix, to: Matrix): void {
    const { _entities: entities } = this;
    if (entities.length <= 0) {
      return;
    }
    if (Matrix.equals(from, to)) {
      return;
    }
    // old worldMatrix.
    const { _tempMat0: groupWorldInvMat, _tempMat1: nodeMat } = Group;
    Matrix.invert(from, groupWorldInvMat);
    // update entities worldMatrix
    for (let i = entities.length - 1; i >= 0; i--) {
      const nodeTrans = entities[i].transform;
      // get entity's localMatrix.
      Matrix.multiply(groupWorldInvMat, nodeTrans.worldMatrix, nodeMat);
      // update entity's worldMatrix.
      Matrix.multiply(to, nodeMat, nodeMat);
      nodeTrans.worldMatrix = nodeMat;
    }
  }

  /**
   * force update group dirty flag
   * @param flag - group dirty flag
   */
  setDirtyFlagTrue(flag: GroupDirtyFlag): void {
    this._dirtyFlag |= flag;
    this._gizmoTransformDirty = true;
  }

  private _applyAdd(entity: Entity): void {
    this._entities.push(entity);
    const fun = this._onEntityWorldTransformChange(entity);
    // @ts-ignore
    const flagManager = entity._updateFlagManager;
    flagManager.addListener(fun);
    this._listeners.push({ flagManager, fun });
    fun();
  }

  private _applyDel(value: Entity | number): void {
    const index = typeof value === "number" ? value : this._entities.indexOf(value);

    if (index === 0) {
      if (this._coordinateType === CoordinateType.Local) {
        this.setDirtyFlagTrue(GroupDirtyFlag.All);
      } else {
        this.setDirtyFlagTrue(GroupDirtyFlag.AnchorDirty);
      }
      this._entities.splice(index, 1);
      const listener = this._listeners[index];
      listener.flagManager.removeListener(listener.fun);
      this._listeners.splice(index, 1);
    } else if (index > 0) {
      if (this._anchorType === AnchorType.Center) {
        this.setDirtyFlagTrue(GroupDirtyFlag.AnchorDirty);
      }
      this._entities.splice(index, 1);
      const listener = this._listeners[index];
      listener.flagManager.removeListener(listener.fun);
      this._listeners.splice(index, 1);
    }
  }

  private _onEntityWorldTransformChange(entity: Entity): () => void {
    return () => {
      if (this._entities.indexOf(entity) === 0) {
        if (this._coordinateType === CoordinateType.Local) {
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

  private _updateAnchor(): void {
    if (this._dirtyFlag & GroupDirtyFlag.AnchorDirty) {
      const { _worldMatrix: worldMatrix } = this;
      const { _tempVec30: tempVec3 } = Group;
      const { elements: e } = worldMatrix;
      switch (this._anchorType) {
        case AnchorType.Center:
          this._getCenter(tempVec3);
          (e[12] = tempVec3.x), (e[13] = tempVec3.y), (e[14] = tempVec3.z);
          break;
        case AnchorType.Pivot:
          // align to the primary entity
          const primaryEntity = this.getPrimaryEntity();
          const worldE = primaryEntity.transform.worldMatrix.elements;
          (e[12] = worldE[12]), (e[13] = worldE[13]), (e[14] = worldE[14]);
          break;
      }
      this._dirtyFlag &= ~GroupDirtyFlag.AnchorDirty;
    }
  }

  private _updateCoordinate(): void {
    if (this._dirtyFlag & GroupDirtyFlag.CoordinateDirty) {
      const { elements: e } = this._worldMatrix;
      switch (this._coordinateType) {
        case CoordinateType.Local:
          // align to the primary entity
          const primaryEntity = this.getPrimaryEntity();
          const wE = primaryEntity.transform.worldMatrix.elements;
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
      }
      this._dirtyFlag &= ~GroupDirtyFlag.CoordinateDirty;
    }
  }

  private _getCenter(out: Vector3): void {
    const { _tempBoundBox: tempBoundBox } = Group;
    tempBoundBox.min.set(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
    tempBoundBox.max.set(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
    const { _entities: entities } = this;
    let isEffective = false;
    const renderers = [];
    for (let i = entities.length - 1; i >= 0; i--) {
      const entity = entities[i];
      entity.getComponentsIncludeChildren(Renderer, renderers);
      for (let j = renderers.length - 1; j >= 0; j--) {
        const renderer = renderers[j];
        if (renderer.entity.isActiveInHierarchy) {
          if (renderer instanceof ParticleRenderer) {
            // Ignore particle bounding box.
            continue;
          } else {
            isEffective = true;
            BoundingBox.merge(tempBoundBox, renderers[j].bounds, tempBoundBox);
          }
        }
      }
    }

    const length = tempBoundBox.getExtent(out).length();
    if (length <= 0 || length >= Number.MAX_VALUE) {
      isEffective = false;
    }
    if (isEffective) {
      tempBoundBox.getCenter(out);
    } else {
      out.set(0, 0, 0);
      for (let i = entities.length - 1; i >= 0; i--) {
        out.add(entities[i].transform.worldPosition);
      }
      out.scale(1 / entities.length);
    }
  }
}
