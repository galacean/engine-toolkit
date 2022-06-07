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
  DirectLight,
  Collider,
  Entity,
  DynamicCollider,
  StaticCollider
} from "oasis-engine";
import { WireFramePrimitive } from "./WireFramePrimitive";

class WireframeElement {
  constructor(public transform: Transform, public transformNoScale: boolean, public transformRanges: number) {}
}

/**
 * Auxiliary Manager to draw debug wireframe with automatic dynamic batching.
 */
export class WireFrameManager extends Script {
  private static _positionPool: Vector3[] = [];
  private static _ndcPosition: Vector3[] = [
    new Vector3(-1, 1, 0),
    new Vector3(1, 1, 0),
    new Vector3(1, -1, 0),
    new Vector3(-1, -1, 0)
  ];
  private static _tempMatrix: Matrix = new Matrix();

  private _isLocalDirty: boolean = true;
  private _localPositions: Vector3[] = [];
  private _globalPositions: Vector3[] = [];
  private _indices: number[] = [];
  private _indicesArray: Uint16Array | Uint32Array = null;

  private _wireframeElements: WireframeElement[] = [];
  private _renderer: MeshRenderer;
  private _material: UnlitMaterial;
  private _mesh: ModelMesh;

  /**
   * Force update buffer when state change.
   * reset to false after update buffer.
   */
  public needUpdate: boolean = false;

  /**
   * clear all cache info
   */
  clear() {
    this._wireframeElements.length = 0;

    this._localPositions.length = 0;
    this._globalPositions.length = 0;
    this._indices.length = 0;
    this._indicesArray = null;
    this._isLocalDirty = true;
  }

  /**
   * Create auxiliary mesh for entity.
   * @param entity - The entity
   * @param includeChildren - whether include child entity(default is true)
   */
  addEntityWireframe(entity: Entity, includeChildren: boolean = true) {
    if (includeChildren) {
      const cameras: Camera[] = [];
      entity.getComponentsIncludeChildren(Camera, cameras);
      for (let i = 0, n = cameras.length; i < n; i++) {
        this.addCameraWireframe(cameras[i]);
      }
      const spots: SpotLight[] = [];
      entity.getComponentsIncludeChildren(SpotLight, spots);
      for (let i = 0, n = spots.length; i < n; i++) {
        this.addSpotLightWireframe(spots[i]);
      }
      const directs: DirectLight[] = [];
      entity.getComponentsIncludeChildren(DirectLight, directs);
      for (let i = 0, n = directs.length; i < n; i++) {
        this.addDirectLightWireframe(directs[i]);
      }
      const points: PointLight[] = [];
      entity.getComponentsIncludeChildren(PointLight, points);
      for (let i = 0, n = points.length; i < n; i++) {
        this.addPointLightWireframe(points[i]);
      }
      const dynamics: DynamicCollider[] = [];
      entity.getComponentsIncludeChildren(DynamicCollider, dynamics);
      for (let i = 0, n = dynamics.length; i < n; i++) {
        this.addColliderAuxiliary(dynamics[i]);
      }
      const statics: StaticCollider[] = [];
      entity.getComponentsIncludeChildren(StaticCollider, statics);
      for (let i = 0, n = statics.length; i < n; i++) {
        this.addColliderAuxiliary(statics[i]);
      }
    } else {
      this.addCameraWireframe(entity.getComponent(Camera));
      this.addSpotLightWireframe(entity.getComponent(SpotLight));
      this.addDirectLightWireframe(entity.getComponent(DirectLight));
      this.addPointLightWireframe(entity.getComponent(PointLight));
      this.addColliderAuxiliary(entity.getComponent(DynamicCollider));
      this.addColliderAuxiliary(entity.getComponent(StaticCollider));
    }
  }

  /**
   * Create auxiliary mesh for camera.
   * @param camera - The Camera
   */
  addCameraWireframe(camera: Camera) {
    const transform = camera.entity.transform;
    const inverseProj = camera.projectionMatrix.clone();
    inverseProj.invert();

    const localPositions = this._localPositions;
    const OldPositionsLength = localPositions.length;
    this._isLocalDirty = true;
    this._wireframeElements.push(new WireframeElement(transform, true, OldPositionsLength));

    const ndcPosition = WireFrameManager._ndcPosition;
    // front
    for (let i = 0; i < 4; i++) {
      const position = ndcPosition[i];
      const newPosition = position.clone();
      newPosition.transformCoordinate(inverseProj);
      localPositions.push(newPosition);
    }

    // back
    for (let i = 0; i < 4; i++) {
      const position = ndcPosition[i];
      const newPosition = position.clone();
      newPosition.z = 1;
      newPosition.transformCoordinate(inverseProj);
      localPositions.push(newPosition);
    }

    const indices = this._indices;
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
  addSpotLightWireframe(light: SpotLight) {
    const transform = light.entity.transform;
    const height = light.distance;
    const radius = Math.tan(light.angle) * height;

    const localPositions = this._localPositions;
    const OldPositionsLength = localPositions.length;
    WireFramePrimitive.createConeWireFrame(radius, height, OldPositionsLength, localPositions, this._indices);
    this._isLocalDirty = true;
    this._wireframeElements.push(new WireframeElement(transform, true, OldPositionsLength));
  }

  /**
   * Create auxiliary mesh for point light.
   * @param light - The PointLight
   */
  addPointLightWireframe(light: PointLight) {
    const transform = light.entity.transform;
    const distance = light.distance;

    const localPositions = this._localPositions;
    const OldPositionsLength = localPositions.length;
    WireFramePrimitive.createSphereWireFrame(distance, OldPositionsLength, localPositions, this._indices);
    this._isLocalDirty = true;
    this._wireframeElements.push(new WireframeElement(transform, true, OldPositionsLength));
  }

  /**
   * Create auxiliary mesh for directional light.
   * @param light - The DirectLight
   */
  addDirectLightWireframe(light: DirectLight) {
    const transform = light.entity.transform;

    const localPositions = this._localPositions;
    const OldPositionsLength = localPositions.length;
    WireFramePrimitive.createUnboundCylinderWireFrame(1, OldPositionsLength, localPositions, this._indices);
    this._isLocalDirty = true;
    this._wireframeElements.push(new WireframeElement(transform, true, OldPositionsLength));
  }

  /**
   * Create auxiliary mesh for collider
   * @param collider - The Collider
   */
  addColliderAuxiliary(collider: Collider) {
    const shapes = collider.shapes;
    for (let i = 0, n = shapes.length; i < n; i++) {
      const shape = shapes[i];
      if (shape instanceof BoxColliderShape) {
        this.addBoxColliderShapeWireframe(shape);
      } else if (shape instanceof SphereColliderShape) {
        this.addSphereColliderShapeWireframe(shape);
      } else if (shape instanceof CapsuleColliderShape) {
        this.addCapsuleColliderShapeWireframe(shape);
      }
    }
  }

  /**
   * Create auxiliary mesh for box collider shape.
   * @param shape - The BoxColliderShape
   */
  addBoxColliderShapeWireframe(shape: BoxColliderShape) {
    const transform = shape.collider.entity.transform;
    const worldScale = transform.lossyWorldScale;
    const size = shape.size;

    const localPositions = this._localPositions;
    const OldPositionsLength = localPositions.length;
    WireFramePrimitive.createCuboidWireFrame(
      worldScale.x * size.x,
      worldScale.y * size.y,
      worldScale.z * size.z,
      OldPositionsLength,
      localPositions,
      this._indices
    );
    this._isLocalDirty = true;
    this._wireframeElements.push(new WireframeElement(transform, false, OldPositionsLength));
  }

  /**
   * Create auxiliary mesh for sphere collider shape.
   * @param shape - The SphereColliderShape
   */
  addSphereColliderShapeWireframe(shape: SphereColliderShape) {
    const transform = shape.collider.entity.transform;
    const worldScale = transform.lossyWorldScale;
    const radius = shape.radius;

    const localPositions = this._localPositions;
    const OldPositionsLength = localPositions.length;
    WireFramePrimitive.createSphereWireFrame(
      Math.max(worldScale.x, worldScale.y, worldScale.z) * radius,
      OldPositionsLength,
      localPositions,
      this._indices
    );
    this._isLocalDirty = true;
    this._wireframeElements.push(new WireframeElement(transform, false, OldPositionsLength));
  }

  /**
   * Create auxiliary mesh for capsule collider shape.
   * @param shape - The CapsuleColliderShape
   */
  addCapsuleColliderShapeWireframe(shape: CapsuleColliderShape) {
    const transform = shape.collider.entity.transform;
    const worldScale = transform.lossyWorldScale;
    const maxScale = Math.max(worldScale.x, worldScale.y, worldScale.z);
    const radius = shape.radius;
    const height = shape.height;

    const localPositions = this._localPositions;
    const OldPositionsLength = localPositions.length;
    WireFramePrimitive.createCapsuleWireFrame(
      maxScale * radius,
      maxScale * height,
      OldPositionsLength,
      localPositions,
      this._indices
    );
    this._isLocalDirty = true;
    this._wireframeElements.push(new WireframeElement(transform, false, OldPositionsLength));
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
    this._material = new UnlitMaterial(this.engine);
    this._renderer = this.entity.addComponent(MeshRenderer);
    this._renderer.setMaterial(this._material);
  }

  /**
   * @override
   */
  onEnable() {
    this._renderer.enabled = true;
  }

  /**
   * @override
   */
  onDisable() {
    this._renderer.enabled = false;
  }

  /**
   * @override
   * @param deltaTime
   */
  onUpdate(deltaTime: number) {
    if (this._isLocalDirty) {
      const indices = this._indices;
      const indicesCount = indices.length;
      this._indicesArray = WireFrameManager._generateIndices(this.engine, this._localPositions.length, indicesCount);
      const indicesArray = this._indicesArray;
      for (let i = 0; i < indicesCount; i++) {
        indicesArray[i] = indices[i];
      }
    }

    if (this._isLocalDirty || this.needUpdate) {
      this._mesh && this._mesh.destroy();
      this._mesh = new ModelMesh(this.engine);
      const mesh = this._mesh;

      const localPositions = this._localPositions;
      const localPositionLength = localPositions.length;
      this._globalPositions.length = localPositionLength;
      const globalPositions = this._globalPositions;
      const wireframeElements = this._wireframeElements;
      let positionIndex = 0;
      for (let i = 0, n = wireframeElements.length; i < n; i++) {
        const wireframeElement = wireframeElements[i];
        const transform = wireframeElement.transform;
        let worldMatrix: Matrix;
        if (wireframeElement.transformNoScale) {
          worldMatrix = WireFrameManager._tempMatrix;
          Matrix.rotationTranslation(transform.worldRotationQuaternion, transform.worldPosition, worldMatrix);
        } else {
          worldMatrix = transform.worldMatrix;
        }

        const beginIndex = wireframeElement.transformRanges;
        let endIndex = localPositionLength;
        if (i != n - 1) {
          endIndex = wireframeElements[i + 1].transformRanges;
        }

        for (let j = beginIndex; j < endIndex; j++) {
          const localPosition = localPositions[positionIndex];
          let globalPosition: Vector3;
          if (positionIndex < WireFrameManager._positionPool.length) {
            globalPosition = WireFrameManager._positionPool[positionIndex];
          } else {
            globalPosition = new Vector3();
            WireFrameManager._positionPool.push(globalPosition);
          }
          Vector3.transformCoordinate(localPosition, worldMatrix, globalPosition);
          globalPositions[positionIndex] = globalPosition;
          positionIndex++;
        }
      }

      mesh.setPositions(globalPositions);
      mesh.setIndices(this._indicesArray);
      mesh.uploadData(true);
      mesh.addSubMesh(0, this._indices.length, MeshTopology.Lines);
      this._renderer.mesh = mesh;
    }
    this.needUpdate = false;
    this._isLocalDirty = false;
  }
}
