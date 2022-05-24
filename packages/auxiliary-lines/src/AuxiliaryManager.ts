import {
  BoxColliderShape,
  CapsuleColliderShape,
  SphereColliderShape,
  Engine,
  GLCapabilityType,
  MeshRenderer,
  MeshTopology,
  ModelMesh,
  Script,
  UnlitMaterial,
  Vector3,
  Transform
} from "oasis-engine";
import { WireFramePrimitive } from "./WireFramePrimitive";

export class AuxiliaryManager extends Script {
  private static positionPool_: Vector3[] = [];

  private isLocalDirty_: boolean = true;
  private localPositions_: Vector3[] = [];
  private globalPositions_: Vector3[] = [];
  private indices_: number[] = [];
  private indicesArray_: Uint16Array | Uint32Array = null;

  private transforms_: Transform[] = [];
  private transformRanges_: number[] = [];
  private renderer_: MeshRenderer;
  private material_: UnlitMaterial;
  private mesh_: ModelMesh;

  public needUpdate: boolean = false;

  onAwake() {
    this.material_ = new UnlitMaterial(this.engine);
    this.renderer_ = this.entity.addComponent(MeshRenderer);
    this.renderer_.setMaterial(this.material_);
  }

  onEnable() {
    this.renderer_._onEnable();
  }

  onDisable() {
    this.renderer_._onDisable();
  }

  onUpdate(deltaTime: number) {
    if (this.isLocalDirty_) {
      const indices = this.indices_;
      this.indicesArray_ = AuxiliaryManager._generateIndices(this.engine, this.localPositions_.length, indices.length);
      const indicesArray = this.indicesArray_;
      for (let i = 0; i < indices.length; i++) {
        indicesArray[i] = indices[i];
      }
    }

    if (this.isLocalDirty_ || this.needUpdate) {
      this.mesh_ && this.mesh_.destroy();
      this.mesh_ = new ModelMesh(this.engine);
      const mesh = this.mesh_;

      const localPositions = this.localPositions_;
      this.globalPositions_.length = localPositions.length;
      const globalPositions = this.globalPositions_;
      const transforms = this.transforms_;
      let positionIndex = 0;
      for (let i = 0, n = transforms.length; i < n; i++) {
        const transform = transforms[i];
        const worldMatrix = transform.worldMatrix;
        const beginIndex = this.transformRanges_[i];
        let endIndex = globalPositions.length;
        if (i != n - 1) {
          endIndex = this.transformRanges_[i + 1];
        }

        for (let j = beginIndex; j < endIndex; j++) {
          const localPosition = localPositions[positionIndex];
          let globalPosition: Vector3;
          if (positionIndex < AuxiliaryManager.positionPool_.length) {
            globalPosition = AuxiliaryManager.positionPool_[positionIndex];
          } else {
            globalPosition = new Vector3();
            AuxiliaryManager.positionPool_.push(globalPosition);
          }
          Vector3.transformCoordinate(localPosition, worldMatrix, globalPosition);
          globalPositions[positionIndex] = globalPosition;
          positionIndex++;
        }
      }

      mesh.setPositions(globalPositions);
      mesh.setIndices(this.indicesArray_);
      mesh.uploadData(true);
      mesh.addSubMesh(0, this.indices_.length, MeshTopology.Lines);
      this.renderer_.mesh = mesh;
    }
    this.isLocalDirty_ = false;
  }

  clear() {
    this.transforms_.length = 0;
    this.transformRanges_.length = 0;

    this.localPositions_.length = 0;
    this.globalPositions_.length = 0;
    this.indices_.length = 0;
    this.indicesArray_ = null;
    this.isLocalDirty_ = true;
  }

  addBoxColliderShapeAuxiliary(shape: BoxColliderShape) {
    const transform = shape.collider.entity.transform;
    this.transforms_.push(transform);
    const worldScale = transform.lossyWorldScale;
    const size = shape.size;

    const localPositions = this.localPositions_;
    const OldPositionsLength = localPositions.length;
    this.transformRanges_.push(OldPositionsLength);
    WireFramePrimitive.createCuboidWireFrame(
      worldScale.x * size.x,
      worldScale.y * size.y,
      worldScale.z * size.z,
      OldPositionsLength,
      localPositions,
      this.indices_
    );
    this.isLocalDirty_ = true;
  }

  addSphereColliderShapeAuxiliary(shape: SphereColliderShape) {
    const transform = shape.collider.entity.transform;
    this.transforms_.push(transform);
    const worldScale = transform.lossyWorldScale;
    const radius = shape.radius;

    const localPositions = this.localPositions_;
    const OldPositionsLength = localPositions.length;
    this.transformRanges_.push(OldPositionsLength);
    WireFramePrimitive.createSphereWireFrame(
      Math.max(worldScale.x, worldScale.y, worldScale.z) * radius,
      OldPositionsLength,
      localPositions,
      this.indices_
    );
    this.isLocalDirty_ = true;
  }

  addCapsuleColliderShapeAuxiliary(shape: CapsuleColliderShape) {
    const transform = shape.collider.entity.transform;
    this.transforms_.push(transform);
    const worldScale = transform.lossyWorldScale;
    const maxScale = Math.max(worldScale.x, worldScale.y, worldScale.z);
    const radius = shape.radius;
    const height = shape.height;

    const localPositions = this.localPositions_;
    const OldPositionsLength = localPositions.length;
    this.transformRanges_.push(OldPositionsLength);
    WireFramePrimitive.createCapsuleWireFrame(
      maxScale * radius,
      maxScale * height,
      OldPositionsLength,
      localPositions,
      this.indices_
    );
    this.isLocalDirty_ = true;
  }

  private static _generateIndices(engine: Engine, vertexCount: number, indexCount: number): Uint16Array | Uint32Array {
    let indices: Uint16Array | Uint32Array = null;
    if (vertexCount > 65535) {
      if (engine._hardwareRenderer.canIUse(GLCapabilityType.elementIndexUint)) {
        indices = new Uint32Array(indexCount);
      } else {
        throw Error("The vertex count is over limit.");
      }
    } else {
      indices = new Uint16Array(indexCount);
    }
    return indices;
  }
}
