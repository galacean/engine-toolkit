import {
  BoxColliderShape,
  CapsuleColliderShape,
  SphereColliderShape,
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
  dependentComponents
} from "oasis-engine";
import { WireframePrimitive } from "./WireframePrimitive";
import { BoolUpdateFlag } from "@oasis-engine/core/types/BoolUpdateFlag";

class WireframeElement {
  updateFlag: BoolUpdateFlag;

  constructor(public transform: Transform, public transformNoScale: boolean, public transformRanges: number) {
    this.updateFlag = transform.registerWorldChangeFlag();
  }
}

/**
 * Auxiliary Manager to draw debug wireframe with automatic dynamic batching.
 * @decorator `@dependentComponents(MeshRenderer)`
 */
@dependentComponents(MeshRenderer)
export class WireframeManager extends Script {
  private static _positionPool: Vector3[] = [];
  private static _ndcPosition: Vector3[] = [
    new Vector3(-1, 1, 0),
    new Vector3(1, 1, 0),
    new Vector3(1, -1, 0),
    new Vector3(-1, -1, 0)
  ];
  private static _tempMatrix: Matrix = new Matrix();

  private _localPositions: Vector3[] = [];
  private _globalPositions: Vector3[] = [];
  private _indices: Uint16Array | Uint32Array = null;
  private _indicesCount: number = 0;
  private _supportUint32Array: boolean;

  private _wireframeElements: WireframeElement[] = [];
  private _renderer: MeshRenderer;
  private _material: UnlitMaterial;
  private _mesh: ModelMesh;

  /**
   * clear all cache info
   */
  clear() {
    this._wireframeElements.length = 0;

    this._localPositions.length = 0;
    this._globalPositions.length = 0;
    this._indicesCount = 0;
    this._mesh.clearSubMesh();
  }

  /**
   * Create auxiliary mesh for entity.
   * @param entity - The entity
   * @param includeChildren - whether include child entity(default is true)
   */
  addEntityWireframe(entity: Entity, includeChildren: boolean = true) {
    if (includeChildren) {
      const components = new Array<Camera | SpotLight | DirectLight | PointLight | Collider>();
      entity.getComponentsIncludeChildren(Camera, components);
      for (let i = 0, n = components.length; i < n; i++) {
        this.addCameraWireframe(<Camera>components[i]);
      }
      let componentsOffset = components.length;

      entity.getComponentsIncludeChildren(SpotLight, components);
      for (let i = componentsOffset, n = components.length; i < n; i++) {
        this.addSpotLightWireframe(<SpotLight>components[i]);
      }
      componentsOffset = components.length;

      entity.getComponentsIncludeChildren(DirectLight, components);
      for (let i = componentsOffset, n = components.length; i < n; i++) {
        this.addDirectLightWireframe(<DirectLight>components[i]);
      }
      componentsOffset = components.length;

      entity.getComponentsIncludeChildren(PointLight, components);
      for (let i = componentsOffset, n = components.length; i < n; i++) {
        this.addPointLightWireframe(<PointLight>components[i]);
      }
      componentsOffset = components.length;

      entity.getComponentsIncludeChildren(Collider, components);
      for (let i = componentsOffset, n = components.length; i < n; i++) {
        this.addCollideWireframe(<Collider>components[i]);
      }
    } else {
      const camera = entity.getComponent(Camera);
      camera && this.addCameraWireframe(camera);
      const spotLight = entity.getComponent(SpotLight);
      spotLight && this.addSpotLightWireframe(spotLight);
      const directLight = entity.getComponent(DirectLight);
      directLight && this.addDirectLightWireframe(directLight);
      const pointLight = entity.getComponent(PointLight);
      pointLight && this.addPointLightWireframe(pointLight);
      let collider: Collider = entity.getComponent(Collider);
      collider && this.addCollideWireframe(collider);
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
    const positionsOffset = localPositions.length;
    this._wireframeElements.push(new WireframeElement(transform, true, positionsOffset));

    const ndcPosition = WireframeManager._ndcPosition;
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

    this._growthIndexMemory(24);
    const indicesArray = this._indices;
    indicesArray[this._indicesCount++] = positionsOffset;
    indicesArray[this._indicesCount++] = positionsOffset + 1;
    indicesArray[this._indicesCount++] = positionsOffset + 1;
    indicesArray[this._indicesCount++] = positionsOffset + 2;
    indicesArray[this._indicesCount++] = positionsOffset + 2;
    indicesArray[this._indicesCount++] = positionsOffset + 3;
    indicesArray[this._indicesCount++] = positionsOffset + 3;
    indicesArray[this._indicesCount++] = positionsOffset; // front
    indicesArray[this._indicesCount++] = positionsOffset;
    indicesArray[this._indicesCount++] = positionsOffset + 4;
    indicesArray[this._indicesCount++] = positionsOffset + 1;
    indicesArray[this._indicesCount++] = positionsOffset + 5;
    indicesArray[this._indicesCount++] = positionsOffset + 2;
    indicesArray[this._indicesCount++] = positionsOffset + 6;
    indicesArray[this._indicesCount++] = positionsOffset + 3;
    indicesArray[this._indicesCount++] = positionsOffset + 7; // link
    indicesArray[this._indicesCount++] = positionsOffset + 4;
    indicesArray[this._indicesCount++] = positionsOffset + 5;
    indicesArray[this._indicesCount++] = positionsOffset + 5;
    indicesArray[this._indicesCount++] = positionsOffset + 6;
    indicesArray[this._indicesCount++] = positionsOffset + 6;
    indicesArray[this._indicesCount++] = positionsOffset + 7;
    indicesArray[this._indicesCount++] = positionsOffset + 7;
    indicesArray[this._indicesCount++] = positionsOffset + 4; // back
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
    const positionsOffset = localPositions.length;

    const coneIndicesCount = WireframePrimitive.coneIndicesCount;
    this._growthIndexMemory(coneIndicesCount);
    const indicesArray = this._indices;
    WireframePrimitive.createConeWireframe(
      radius,
      height,
      positionsOffset,
      localPositions,
      indicesArray,
      this._indicesCount
    );
    this._indicesCount += coneIndicesCount;

    this._wireframeElements.push(new WireframeElement(transform, true, positionsOffset));
  }

  /**
   * Create auxiliary mesh for point light.
   * @param light - The PointLight
   */
  addPointLightWireframe(light: PointLight) {
    const transform = light.entity.transform;
    const distance = light.distance;

    const localPositions = this._localPositions;
    const positionsOffset = localPositions.length;

    const sphereIndicesCount = WireframePrimitive.sphereIndicesCount;
    this._growthIndexMemory(sphereIndicesCount);
    const indicesArray = this._indices;
    WireframePrimitive.createSphereWireframe(
      distance,
      positionsOffset,
      localPositions,
      indicesArray,
      this._indicesCount
    );
    this._indicesCount += sphereIndicesCount;

    this._wireframeElements.push(new WireframeElement(transform, true, positionsOffset));
  }

  /**
   * Create auxiliary mesh for directional light.
   * @param light - The DirectLight
   */
  addDirectLightWireframe(light: DirectLight) {
    const transform = light.entity.transform;

    const localPositions = this._localPositions;
    const positionsOffset = localPositions.length;

    const unboundCylinderIndicesCount = WireframePrimitive.unboundCylinderIndicesCount;
    this._growthIndexMemory(unboundCylinderIndicesCount);
    const indicesArray = this._indices;
    WireframePrimitive.createUnboundCylinderWireframe(
      1,
      positionsOffset,
      localPositions,
      indicesArray,
      this._indicesCount
    );
    this._indicesCount += unboundCylinderIndicesCount;

    this._wireframeElements.push(new WireframeElement(transform, true, positionsOffset));
  }

  /**
   * Create auxiliary mesh for collider
   * @param collider - The Collider
   */
  addCollideWireframe(collider: Collider) {
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
    const positionsOffset = localPositions.length;

    const cuboidIndicesCount = WireframePrimitive.cuboidIndicesCount;
    this._growthIndexMemory(cuboidIndicesCount);
    const indicesArray = this._indices;
    WireframePrimitive.createCuboidWireframe(
      worldScale.x * size.x,
      worldScale.y * size.y,
      worldScale.z * size.z,
      positionsOffset,
      localPositions,
      indicesArray,
      this._indicesCount
    );
    this._indicesCount += cuboidIndicesCount;

    this._wireframeElements.push(new WireframeElement(transform, false, positionsOffset));
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
    const positionsOffset = localPositions.length;

    const sphereIndicesCount = WireframePrimitive.sphereIndicesCount;
    this._growthIndexMemory(sphereIndicesCount);
    const indicesArray = this._indices;
    WireframePrimitive.createSphereWireframe(
      Math.max(worldScale.x, worldScale.y, worldScale.z) * radius,
      positionsOffset,
      localPositions,
      indicesArray,
      this._indicesCount
    );
    this._indicesCount += sphereIndicesCount;

    this._wireframeElements.push(new WireframeElement(transform, false, positionsOffset));
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
    const positionsOffset = localPositions.length;

    const capsuleIndicesCount = WireframePrimitive.capsuleIndicesCount;
    this._growthIndexMemory(capsuleIndicesCount);
    const indicesArray = this._indices;
    WireframePrimitive.createCapsuleWireframe(
      maxScale * radius,
      maxScale * height,
      positionsOffset,
      localPositions,
      indicesArray,
      this._indicesCount
    );
    this._indicesCount += capsuleIndicesCount;

    this._wireframeElements.push(new WireframeElement(transform, false, positionsOffset));
  }

  private _growthIndexMemory(length: number) {
    const indicesArray = this._indices;
    const newArrayLength = this._indicesCount + length;
    if (newArrayLength > indicesArray.length) {
      const maxLength = this._supportUint32Array ? 65535 : 4294967295;
      if (newArrayLength > maxLength) {
        throw Error("The vertex count is over limit.");
      }

      const newArray = this._supportUint32Array ? new Uint16Array(newArrayLength) : new Uint32Array(newArrayLength);
      for (let i = 0, n = indicesArray.length; i < n; i++) {
        newArray[i] = indicesArray[i];
      }
      this._indices = newArray;
    }
  }

  private static _getAvailablePosition(positionIndex: number): Vector3 {
    let globalPosition: Vector3;
    if (positionIndex < WireframeManager._positionPool.length) {
      globalPosition = WireframeManager._positionPool[positionIndex];
    } else {
      globalPosition = new Vector3();
      WireframeManager._positionPool.push(globalPosition);
    }
    return globalPosition;
  }

  /**
   * @override
   */
  onAwake() {
    this._supportUint32Array = this.engine._hardwareRenderer.canIUse(GLCapabilityType.elementIndexUint);
    this._indices = this._supportUint32Array ? new Uint32Array(128) : new Uint16Array(128);

    this._mesh = new ModelMesh(this.engine);
    this._material = new UnlitMaterial(this.engine);
    const renderer = this.entity.getComponent(MeshRenderer);
    renderer.setMaterial(this._material);
    renderer.mesh = this._mesh;
    this._renderer = renderer;
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
    const mesh = this._mesh;

    const localPositions = this._localPositions;
    const localPositionLength = localPositions.length;
    this._globalPositions.length = localPositionLength;
    const globalPositions = this._globalPositions;
    const wireframeElements = this._wireframeElements;
    let positionIndex = 0;
    for (let i = 0, n = wireframeElements.length; i < n; i++) {
      const wireframeElement = wireframeElements[i];
      const beginIndex = wireframeElement.transformRanges;
      let endIndex = localPositionLength;
      if (i != n - 1) {
        endIndex = wireframeElements[i + 1].transformRanges;
      }
      if (wireframeElement.updateFlag.flag) {
        const transform = wireframeElement.transform;
        let worldMatrix: Matrix;
        if (wireframeElement.transformNoScale) {
          worldMatrix = WireframeManager._tempMatrix;
          Matrix.rotationTranslation(transform.worldRotationQuaternion, transform.worldPosition, worldMatrix);
        } else {
          worldMatrix = transform.worldMatrix;
        }

        for (let j = beginIndex; j < endIndex; j++) {
          const localPosition = localPositions[positionIndex];
          const globalPosition = WireframeManager._getAvailablePosition(positionIndex);
          Vector3.transformCoordinate(localPosition, worldMatrix, globalPosition);
          globalPositions[positionIndex] = globalPosition;
          positionIndex++;
        }
        wireframeElement.updateFlag.flag = false;
      } else {
        positionIndex += endIndex - beginIndex;
      }
    }

    mesh.setPositions(globalPositions);
    mesh.setIndices(this._indices);
    mesh.uploadData(false);
    mesh.clearSubMesh();
    mesh.addSubMesh(0, this._indicesCount, MeshTopology.Lines);
  }
}
