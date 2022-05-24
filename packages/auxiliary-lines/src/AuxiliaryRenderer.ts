import {
  BoxColliderShape, CapsuleColliderShape,
  Engine,
  GLCapabilityType,
  MeshRenderer,
  MeshTopology,
  ModelMesh,
  Script, SphereColliderShape,
  UnlitMaterial,
  Vector3
} from "oasis-engine";
import { WireFramePrimitive } from "./WireFramePrimitive";

export class AuxiliaryRenderer extends Script {
  private positions_: Vector3[] = [];
  private indices_: number[] = [];
  private isDirty_: boolean = true;
  private renderer_: MeshRenderer;
  private material_: UnlitMaterial;
  private mesh_: ModelMesh;

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
    if (this.isDirty_) {
      const indices = this.indices_;
      const indicesArray = AuxiliaryRenderer._generateIndices(this.engine, this.positions_.length, indices.length);
      for (let i = 0; i < indices.length; i++) {
        indicesArray[i] = indices[i];
      }

      this.mesh_ && this.mesh_.destroy();
      this.mesh_ = new ModelMesh(this.engine);
      const mesh = this.mesh_;
      mesh.setPositions(this.positions_);
      mesh.setIndices(indicesArray);
      mesh.uploadData(true);
      mesh.addSubMesh(0, this.indices_.length, MeshTopology.LineLoop);
      this.renderer_.mesh = mesh;
      this.isDirty_ = false;
    }
  }

  clear() {
    this.positions_.length = 0;
    this.indices_.length = 0;
    this.isDirty_ = true;
  }

  addBoxColliderShapeAuxiliary(shape: BoxColliderShape) {
    const size = shape.size;
    const worldScale = shape.collider.entity.transform.lossyWorldScale;

    WireFramePrimitive.createCuboidWireFrame(
      worldScale.x * size.x,
      worldScale.y * size.y,
      worldScale.z * size.z,
      this.positions_,
      this.indices_
    );
    this.isDirty_ = true;
  }

  addSphereColliderShapeAuxiliary(shape: SphereColliderShape) {
    const radius = shape.radius;
    const worldScale = shape.collider.entity.transform.lossyWorldScale;

    WireFramePrimitive.createSphereWireFrame(
      Math.max(worldScale.x, worldScale.y, worldScale.z) * radius,
      this.positions_,
      this.indices_
    );
    this.isDirty_ = true;
  }

  addCapsuleColliderShapeAuxiliary(shape: CapsuleColliderShape) {
    const radius = shape.radius;
    const height = shape.height;
    const worldScale = shape.collider.entity.transform.lossyWorldScale;
    const maxScale = Math.max(worldScale.x, worldScale.y, worldScale.z);

    WireFramePrimitive.createCapsuleWireFrame(maxScale * radius, maxScale * height, this.positions_, this.indices_);
    this.isDirty_ = true;
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
