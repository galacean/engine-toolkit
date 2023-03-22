import {
  dependentComponents,
  DependentMode,
  GLCapabilityType,
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

  static drawLine(position1: Vector3, position2: Vector3) {
    LineDrawer._growthPosition(2);
    LineDrawer._growthIndexMemory(2);
    LineDrawer._indices[LineDrawer._indicesCount++] = LineDrawer._positionCount;
    LineDrawer._indices[LineDrawer._indicesCount++] = LineDrawer._positionCount + 1;
    LineDrawer._positions[LineDrawer._positionCount++].copyFrom(position1);
    LineDrawer._positions[LineDrawer._positionCount++].copyFrom(position2);
  }

  static drawSphere(radius: number, position: Vector3) {
    LineDrawer._growthPosition(WireframePrimitive.spherePositionCount);
    LineDrawer._growthIndexMemory(WireframePrimitive.sphereIndexCount);
    WireframePrimitive.createSphereWireframe(
      radius,
      LineDrawer._positions,
      LineDrawer._positionCount,
      LineDrawer._indices,
      LineDrawer._indicesCount
    );
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
