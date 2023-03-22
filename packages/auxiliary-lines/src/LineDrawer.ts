import {
  dependentComponents,
  DependentMode,
  GLCapabilityType,
  Matrix,
  MeshRenderer,
  MeshTopology,
  ModelMesh,
  Script,
  Vector3
} from "oasis-engine";
import { WireframePrimitive } from "./WireframePrimitive";
import { PlainColorMaterial } from "@oasis-engine-toolkit/custom-material";

/**
 * Line Drawer.
 * @decorator `@dependentComponents(MeshRenderer)`
 */
@dependentComponents(DependentMode.CheckOnly, MeshRenderer)
export class LineDrawer extends Script {
  private static _positions: Vector3[];
  private static _positionCount: number = 0;
  private static _indices: Uint16Array | Uint32Array;
  private static _indicesCount: number = 0;
  private static _supportUint32Array: boolean;
  private _renderer: MeshRenderer;
  private _material: PlainColorMaterial;
  private _mesh: ModelMesh;

  /**
   * The LineDrawer.matrix stores the position, rotation and scale of the LineDrawer.
   * By default, LineDrawer always uses world coordinates.
   * The default LineDrawer.matrix transforms the world coordinates using a default identity matrix.
   */
  static matrix: Matrix = null;

  /**
   * Draws a line starting at from towards to.
   * @param from - from position
   * @param to - to position
   */
  static drawLine(from: Vector3, to: Vector3) {
    LineDrawer._growthPosition(2);
    LineDrawer._growthIndexMemory(2);
    LineDrawer._indices[LineDrawer._indicesCount++] = LineDrawer._positionCount;
    LineDrawer._indices[LineDrawer._indicesCount++] = LineDrawer._positionCount + 1;
    if (LineDrawer.matrix == null) {
      LineDrawer._positions[LineDrawer._positionCount++].copyFrom(from);
      LineDrawer._positions[LineDrawer._positionCount++].copyFrom(to);
    } else {
      Vector3.transformCoordinate(from, LineDrawer.matrix, LineDrawer._positions[LineDrawer._positionCount++]);
      Vector3.transformCoordinate(to, LineDrawer.matrix, LineDrawer._positions[LineDrawer._positionCount++]);
    }
  }

  /**
   * Draws a wireframe sphere with center and radius.
   * @param radius - sphere radius
   * @param center - sphere center
   */
  static drawSphere(radius: number, center: Vector3) {
    const positionCount = WireframePrimitive.spherePositionCount;
    const indexCount = WireframePrimitive.sphereIndexCount;
    const globalPosition = LineDrawer._positions;

    LineDrawer._growthPosition(positionCount);
    LineDrawer._growthIndexMemory(indexCount);
    WireframePrimitive.createSphereWireframe(
      radius,
      globalPosition,
      LineDrawer._positionCount,
      LineDrawer._indices,
      LineDrawer._indicesCount
    );
    for (let i = 0; i < positionCount; i++) {
      const pos = globalPosition[LineDrawer._positionCount + i];
      pos.add(center);
      if (LineDrawer.matrix != null) {
        Vector3.transformCoordinate(pos, LineDrawer.matrix, pos);
      }
    }

    LineDrawer._positionCount += positionCount;
    LineDrawer._indicesCount += indexCount;
  }

  /**
   * Draw a wireframe box with center and size.
   * @param width - width
   * @param height - height
   * @param depth - depth
   * @param center - center
   */
  static drawCuboid(width: number, height: number, depth: number, center: Vector3) {
    const positionCount = WireframePrimitive.cuboidPositionCount;
    const indexCount = WireframePrimitive.cuboidIndexCount;
    const globalPosition = LineDrawer._positions;

    LineDrawer._growthPosition(positionCount);
    LineDrawer._growthIndexMemory(indexCount);
    WireframePrimitive.createCuboidWireframe(
      width,
      height,
      depth,
      globalPosition,
      LineDrawer._positionCount,
      LineDrawer._indices,
      LineDrawer._indicesCount
    );
    for (let i = 0; i < positionCount; i++) {
      const pos = globalPosition[LineDrawer._positionCount + i];
      pos.add(center);
      if (LineDrawer.matrix != null) {
        Vector3.transformCoordinate(pos, LineDrawer.matrix, pos);
      }
    }

    LineDrawer._positionCount += positionCount;
    LineDrawer._indicesCount += indexCount;
  }

  /**
   * Draw a wireframe capsule with radius, height and center.
   * @param radius - The radius of the two hemispherical ends
   * @param height - The height of the cylindrical part, measured between the centers of the hemispherical ends
   * @param center - The center
   */
  static drawCapsule(radius: number, height: number, center: Vector3) {
    const positionCount = WireframePrimitive.capsulePositionCount;
    const indexCount = WireframePrimitive.capsuleIndexCount;
    const globalPosition = LineDrawer._positions;

    LineDrawer._growthPosition(positionCount);
    LineDrawer._growthIndexMemory(indexCount);
    WireframePrimitive.createCapsuleWireframe(
      radius,
      height,
      globalPosition,
      LineDrawer._positionCount,
      LineDrawer._indices,
      LineDrawer._indicesCount
    );
    for (let i = 0; i < positionCount; i++) {
      const pos = globalPosition[LineDrawer._positionCount + i];
      pos.add(center);
      if (LineDrawer.matrix != null) {
        Vector3.transformCoordinate(pos, LineDrawer.matrix, pos);
      }
    }

    LineDrawer._positionCount += positionCount;
    LineDrawer._indicesCount += indexCount;
  }

  /**
   * Draw a wireframe circle with radius, axis and center.
   * @param radius - The radius
   * @param axis - The axis
   * @param center - The center
   */
  static drawCircle(radius: number, axis: AxisType, center: Vector3) {
    WireframePrimitive._shift.set(0, 0, 0);
    const positionCount = WireframePrimitive.circlePositionCount;
    const indexCount = WireframePrimitive.circleIndexCount;
    const globalPosition = LineDrawer._positions;

    LineDrawer._growthPosition(positionCount);
    LineDrawer._growthIndexMemory(indexCount);
    WireframePrimitive.createCircleWireframe(
      radius,
      axis,
      WireframePrimitive._shift,
      globalPosition,
      LineDrawer._positionCount,
      LineDrawer._indices,
      LineDrawer._indicesCount
    );
    for (let i = 0; i < positionCount; i++) {
      const pos = globalPosition[LineDrawer._positionCount + i];
      pos.add(center);
      if (LineDrawer.matrix != null) {
        Vector3.transformCoordinate(pos, LineDrawer.matrix, pos);
      }
    }

    LineDrawer._positionCount += positionCount;
    LineDrawer._indicesCount += indexCount;
  }

  static flush() {
    LineDrawer._positionCount = 0;
    LineDrawer._indicesCount = 0;
  }

  /**
   * @override
   */
  onAwake(): void {
    const engine = this.engine;
    const mesh = new ModelMesh(engine);
    const material = new PlainColorMaterial(engine);
    const renderer = this.entity.getComponent(MeshRenderer);
    renderer.castShadows = false;
    renderer.receiveShadows = false;
    // @ts-ignore
    const supportUint32Array = engine._hardwareRenderer.canIUse(GLCapabilityType.elementIndexUint);

    // @ts-ignore
    mesh._enableVAO = false;
    mesh.addSubMesh(0, LineDrawer._indicesCount, MeshTopology.Lines);
    renderer.mesh = mesh;
    renderer.setMaterial(material);

    const { bounds } = mesh;
    bounds.min.set(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
    bounds.max.set(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
    this._mesh = mesh;
    this._material = material;
    this._renderer = renderer;
    LineDrawer._indices = supportUint32Array ? new Uint32Array(128) : new Uint16Array(128);
    LineDrawer._supportUint32Array = supportUint32Array;
  }

  onUpdate(deltaTime: number) {
    const { _mesh: mesh } = this;

    if (LineDrawer._positionCount > 0) {
      mesh.setPositions(LineDrawer._positions);
      mesh.setIndices(LineDrawer._indices);
      mesh.uploadData(false);
      mesh.subMesh.count = LineDrawer._indicesCount;
      this._renderer.setMaterial(this._material);
    } else {
      this._renderer.setMaterial(null);
    }

    LineDrawer.flush();
  }

  private static _growthIndexMemory(length: number): void {
    const indices = LineDrawer._indices;
    const neededLength = LineDrawer._indicesCount + length;
    if (neededLength > indices.length) {
      const maxLength = LineDrawer._supportUint32Array ? 4294967295 : 65535;
      if (neededLength > maxLength) {
        throw Error("The vertex count is over limit.");
      }

      const newIndices = LineDrawer._supportUint32Array ? new Uint32Array(neededLength) : new Uint16Array(neededLength);
      newIndices.set(indices);
      LineDrawer._indices = newIndices;
    }
  }

  private static _growthPosition(length: number): void {
    const position = LineDrawer._positions;
    const neededLength = LineDrawer._positionCount + length;
    if (neededLength > position.length) {
      for (let i = 0, n = neededLength - position.length; i < n; i++) {
        position.push(new Vector3());
      }
    }
  }
}

/**
 * Circle Axis.
 */
export enum AxisType {
  X,
  Y,
  Z
}
