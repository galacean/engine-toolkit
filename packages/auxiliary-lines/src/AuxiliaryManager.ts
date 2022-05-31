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
  Transform,
  PointLight,
  Camera,
  Matrix,
  SpotLight,
  DirectLight
} from "oasis-engine";
import { WireFramePrimitive } from "./WireFramePrimitive";

/**
 * Auxiliary Manager to draw debug wireframe with automatic dynamic batching.
 */
export class AuxiliaryManager extends Script {
  private static positionPool_: Vector3[] = [];
  private static viewportPosition: Vector3[] = [];
  private static tempMatrix: Matrix = new Matrix();

  private isLocalDirty_: boolean = true;
  private localPositions_: Vector3[] = [];
  private globalPositions_: Vector3[] = [];
  private indices_: number[] = [];
  private indicesArray_: Uint16Array | Uint32Array = null;

  private transforms_: Transform[] = [];
  private transformNoScaleFlag: boolean[] = [];
  private transformRanges_: number[] = [];
  private renderer_: MeshRenderer;
  private material_: UnlitMaterial;
  private mesh_: ModelMesh;

  /**
   * Force update buffer when state change.
   * reset to false after update buffer.
   */
  public needUpdate: boolean = false;

  /**
   * clear all cache info
   */
  clear() {
    this.transforms_.length = 0;
    this.transformNoScaleFlag.length = 0;
    this.transformRanges_.length = 0;

    this.localPositions_.length = 0;
    this.globalPositions_.length = 0;
    this.indices_.length = 0;
    this.indicesArray_ = null;
    this.isLocalDirty_ = true;
  }

  /**
   * Create auxiliary mesh for camera.
   * @param camera - The Camera
   */
  addCameraAuxiliary(camera: Camera) {
    const transform = camera.entity.transform;
    this.transforms_.push(transform);
    const inverseProj = camera.projectionMatrix.clone();
    inverseProj.invert();

    const localPositions = this.localPositions_;
    const OldPositionsLength = localPositions.length;
    this.transformRanges_.push(OldPositionsLength);
    this.isLocalDirty_ = true;
    this.transformNoScaleFlag.push(true);

    const viewportPosition = AuxiliaryManager.viewportPosition;
    if (viewportPosition.length == 0) {
      viewportPosition.push(new Vector3(-1, 1, 0));
      viewportPosition.push(new Vector3(1, 1, 0));
      viewportPosition.push(new Vector3(1, -1, 0));
      viewportPosition.push(new Vector3(-1, -1, 0));
    }

    // front
    for (let i = 0; i < 4; i++) {
      const position = viewportPosition[i];
      const newPosition = position.clone();
      newPosition.transformCoordinate(inverseProj);
      localPositions.push(newPosition);
    }

    // back
    for (let i = 0; i < 4; i++) {
      const position = viewportPosition[i];
      const newPosition = position.clone();
      newPosition.z = 1;
      newPosition.transformCoordinate(inverseProj);
      localPositions.push(newPosition);
    }

    const indices = this.indices_;
    indices.push(
      OldPositionsLength,
      1 + OldPositionsLength,
      1 + OldPositionsLength,
      2 + OldPositionsLength,
      2 + OldPositionsLength,
      3 + OldPositionsLength,
      3 + OldPositionsLength,
      OldPositionsLength, // front
      OldPositionsLength,
      4 + OldPositionsLength,
      1 + OldPositionsLength,
      5 + OldPositionsLength,
      2 + OldPositionsLength,
      6 + OldPositionsLength,
      3 + OldPositionsLength,
      7 + OldPositionsLength, // link
      4 + OldPositionsLength,
      5 + OldPositionsLength,
      5 + OldPositionsLength,
      6 + OldPositionsLength,
      6 + OldPositionsLength,
      7 + OldPositionsLength,
      7 + OldPositionsLength,
      4 + OldPositionsLength // back
    );
  }

  /**
   * Create auxiliary mesh for spot light.
   * @param light - The SpotLight
   */
  addSpotLightAuxiliary(light: SpotLight) {
    const transform = light.entity.transform;
    this.transforms_.push(transform);
    const height = light.distance;
    const radius = Math.tan(light.angle) * height;

    const localPositions = this.localPositions_;
    const OldPositionsLength = localPositions.length;
    this.transformRanges_.push(OldPositionsLength);
    WireFramePrimitive.createConeWireFrame(radius, height, OldPositionsLength, localPositions, this.indices_);
    this.isLocalDirty_ = true;
    this.transformNoScaleFlag.push(true);
  }

  /**
   * Create auxiliary mesh for point light.
   * @param light - The PointLight
   */
  addPointLightAuxiliary(light: PointLight) {
    const transform = light.entity.transform;
    this.transforms_.push(transform);
    const distance = light.distance;

    const localPositions = this.localPositions_;
    const OldPositionsLength = localPositions.length;
    this.transformRanges_.push(OldPositionsLength);
    WireFramePrimitive.createSphereWireFrame(distance, OldPositionsLength, localPositions, this.indices_);
    this.isLocalDirty_ = true;
    this.transformNoScaleFlag.push(true);
  }

  /**
   * Create auxiliary mesh for directional light.
   * @param light - The DirectLight
   */
  addDirectLightAuxiliary(light: DirectLight) {
    const transform = light.entity.transform;
    this.transforms_.push(transform);

    const localPositions = this.localPositions_;
    const OldPositionsLength = localPositions.length;
    this.transformRanges_.push(OldPositionsLength);
    WireFramePrimitive.createUnboundCylinderWireFrame(1, OldPositionsLength, localPositions, this.indices_);
    this.isLocalDirty_ = true;
    this.transformNoScaleFlag.push(true);
  }

  /**
   * Create auxiliary mesh for box collider shape.
   * @param shape - The BoxColliderShape
   */
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
    this.transformNoScaleFlag.push(false);
  }

  /**
   * Create auxiliary mesh for sphere collider shape.
   * @param shape - The SphereColliderShape
   */
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
    this.transformNoScaleFlag.push(false);
  }

  /**
   * Create auxiliary mesh for capsule collider shape.
   * @param shape - The CapsuleColliderShape
   */
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
    this.transformNoScaleFlag.push(false);
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

  /**
   * @override
   */
  onAwake() {
    this.material_ = new UnlitMaterial(this.engine);
    this.renderer_ = this.entity.addComponent(MeshRenderer);
    this.renderer_.setMaterial(this.material_);
  }

  /**
   * @override
   */
  onEnable() {
    this.renderer_._onEnable();
  }

  /**
   * @override
   */
  onDisable() {
    this.renderer_._onDisable();
  }

  /**
   * @override
   * @param deltaTime
   */
  onUpdate(deltaTime: number) {
    if (this.isLocalDirty_) {
      const indices = this.indices_;
      const indicesCount = indices.length;
      this.indicesArray_ = AuxiliaryManager._generateIndices(this.engine, this.localPositions_.length, indicesCount);
      const indicesArray = this.indicesArray_;
      for (let i = 0; i < indicesCount; i++) {
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
        let worldMatrix: Matrix;
        if (this.transformNoScaleFlag[i]) {
          worldMatrix = AuxiliaryManager.tempMatrix;
          Matrix.rotationTranslation(transform.worldRotationQuaternion, transform.worldPosition, worldMatrix);
        } else {
          worldMatrix = transform.worldMatrix;
        }

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
    this.needUpdate = false;
    this.isLocalDirty_ = false;
  }
}
