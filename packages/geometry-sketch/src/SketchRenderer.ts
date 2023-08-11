import {
  Entity,
  IndexFormat,
  Matrix,
  MeshTopology,
  ModelMesh,
  ShaderMacro,
  ShaderProperty,
  SkinnedMeshRenderer,
  SubMesh,
  Texture2D,
  TextureFilterMode,
  TextureFormat
} from "@galacean/engine";
import { SketchMode } from "./SketchMode";
import { BiTangentMaterial, NormalMaterial, TangentMaterial, WireframeMaterial } from "./material";

/**
 * Sketch Renderer
 */
export class SketchRenderer extends SkinnedMeshRenderer {
  private static _weightMacro = ShaderMacro.getByName("RENDERER_HAS_WEIGHT");
  private static _jointMacro = ShaderMacro.getByName("RENDERER_HAS_JOINT");

  private static _MAX_TEXTURE_ROWS = 512;
  private static _jointIndexBegin = -1;
  private static _jointBufferIndex = -1;

  private static _verticesSamplerProp = ShaderProperty.getByName("u_verticesSampler");
  private static _verticesTextureHeightProp = ShaderProperty.getByName("u_verticesTextureHeight");
  private static _verticesTextureWidthProp = ShaderProperty.getByName("u_verticesTextureWidth");

  private static _indicesSamplerProp = ShaderProperty.getByName("u_indicesSampler");
  private static _indicesTextureHeightProp = ShaderProperty.getByName("u_indicesTextureHeight");
  private static _indicesTextureWidthProp = ShaderProperty.getByName("u_indicesTextureWidth");

  private static _lineScaleProp = ShaderProperty.getByName("u_lineScale");
  private static _worldMatrixProp = ShaderProperty.getByName("u_worldMatrix");
  private static _worldNormalProp = ShaderProperty.getByName("u_worldNormal");

  private _worldNormalMatrix = new Matrix();
  private _worldMatrix: Matrix = null;
  private _targetMesh: ModelMesh = null;
  private _verticesTexture: Texture2D = null;
  private _indicesTexture: Texture2D = null;
  private _vertexElementOrder: Array<number | { order: number; idx: number }> = [
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1
  ];

  private _showState = [false, false, false, false];
  private readonly _wireframeMaterial: WireframeMaterial;
  private readonly _normalMaterial: NormalMaterial;
  private readonly _tangentMaterial: TangentMaterial;
  private readonly _biTangentMaterial: BiTangentMaterial;

  private readonly _triangleSubMesh = new SubMesh();
  private readonly _lineSubMesh = new SubMesh(0, 0, MeshTopology.Lines);

  /**
   * Line scale
   */
  get scale(): number {
    return this.shaderData.getFloat(SketchRenderer._lineScaleProp);
  }

  set scale(value: number) {
    this.shaderData.setFloat(SketchRenderer._lineScaleProp, value);
  }

  /**
   * World matrix
   */
  set worldMatrix(value: Matrix) {
    if (value !== this._worldMatrix) {
      this._worldMatrix = value;
      this.shaderData.setMatrix(SketchRenderer._worldMatrixProp, value);
    }
  }

  /**
   * Target mesh
   */
  set targetMesh(value: ModelMesh) {
    if (value !== this._targetMesh) {
      this._destroy();
      this._targetMesh = value;
      this._uploadVerticesBuffer(value);
      this._uploadIndicesBuffer(value);

      this._updateTriangleSubMesh(value);
      this._updateLineSubMesh(value);
      for (let i = 0; i < 4; i++) {
        this.setSketchMode(i, this._showState[i]);
      }
    }
  }

  /**
   * Material for wireframe shading
   */
  get wireframeMaterial(): WireframeMaterial {
    return this._wireframeMaterial;
  }

  /**
   * Material for normal shading
   */
  get normalMaterial(): NormalMaterial {
    return this._normalMaterial;
  }

  /**
   * Material for tangent shading
   */
  get tangentMaterial(): TangentMaterial {
    return this._normalMaterial;
  }

  /**
   * Material for biTangent shading
   */
  get biTangentMaterial(): BiTangentMaterial {
    return this._normalMaterial;
  }

  constructor(entity: Entity) {
    super(entity);
    const engine = this.engine;
    this.mesh = new ModelMesh(engine);
    this._wireframeMaterial = new WireframeMaterial(engine);
    this._normalMaterial = new NormalMaterial(engine);
    this._tangentMaterial = new TangentMaterial(engine);
    this._biTangentMaterial = new BiTangentMaterial(engine);

    this.mesh.addSubMesh(this._triangleSubMesh); // wireframe
    this.mesh.addSubMesh(this._lineSubMesh); // normal
    this.mesh.addSubMesh(this._lineSubMesh); // tangent
    this.mesh.addSubMesh(this._lineSubMesh); // bi-tangent

    this.scale = 0.1;
  }

  /**
   * Set sketch mode
   * @param mode - The sketch mode
   * @param isShow - whether show the sketch
   */
  setSketchMode(mode: SketchMode, isShow: boolean) {
    switch (mode) {
      case SketchMode.Wireframe:
        if (isShow) {
          this._targetMesh && this.setMaterial(0, this._wireframeMaterial);
          this._showState[0] = true;
        } else {
          this.setMaterial(0, null);
          this._showState[0] = false;
        }
        break;
      case SketchMode.Normal:
        if (isShow) {
          this._targetMesh && this.setMaterial(1, this._normalMaterial);
          this._showState[1] = true;
        } else {
          this.setMaterial(1, null);
          this._showState[1] = false;
        }
        break;
      case SketchMode.Tangent:
        if (isShow) {
          this._targetMesh && this.setMaterial(2, this._tangentMaterial);
          this._showState[2] = true;
        } else {
          this.setMaterial(2, null);
          this._showState[2] = false;
        }
        break;
      case SketchMode.BiTangent:
        if (isShow) {
          this._targetMesh && this.setMaterial(3, this._biTangentMaterial);
          this._showState[3] = true;
        } else {
          this.setMaterial(3, null);
          this._showState[3] = false;
        }
        break;
    }
  }

  clear() {
    this.setMaterial(0, null);
    this.setMaterial(1, null);
    this.setMaterial(2, null);
    this.setMaterial(3, null);
  }

  override update(deltaTime: number) {
    super.update(deltaTime);
    // @ts-ignore
    this.shaderData.enableMacro(SketchRenderer._normalMacro);
    // @ts-ignore
    this.shaderData.enableMacro(SketchRenderer._tangentMacro);

    const worldMatrix = this._worldMatrix;
    if (worldMatrix) {
      const worldNormalMatrix = this._worldNormalMatrix;
      Matrix.invert(worldMatrix, worldNormalMatrix);
      worldNormalMatrix.transpose();
      this.shaderData.setMatrix(SketchRenderer._worldNormalProp, worldNormalMatrix);
    }
  }

  private _uploadIndicesBuffer(value: ModelMesh) {
    //@ts-ignore
    const indexBuffer = value._indexBufferBinding._buffer;
    const byteLength = indexBuffer.byteLength;
    const buffer = new Uint8Array(byteLength);
    indexBuffer.getData(buffer);
    //@ts-ignore
    const indexFormat = <IndexFormat>value._indicesFormat;
    let triangleCount = 0;
    switch (indexFormat) {
      case IndexFormat.UInt8: {
        triangleCount = byteLength / 3;
        const width = Math.min(triangleCount, SketchRenderer._MAX_TEXTURE_ROWS);
        const height = Math.ceil(triangleCount / SketchRenderer._MAX_TEXTURE_ROWS);
        this._indicesTexture = new Texture2D(this.engine, width, height, TextureFormat.R32G32B32A32, false);

        const floatBuffer = new Float32Array(width * height * 4);
        for (let i = 0; i < triangleCount; i++) {
          for (let j = 0; j < 3; j++) {
            floatBuffer[i * 4 + j] = buffer[i * 3 + j];
          }
          floatBuffer[i * 4 + 3] = 0;
        }
        this._indicesTexture.setPixelBuffer(floatBuffer);
        this.shaderData.setTexture(SketchRenderer._indicesSamplerProp, this._indicesTexture);
        this.shaderData.setFloat(SketchRenderer._indicesTextureWidthProp, width);
        this.shaderData.setFloat(SketchRenderer._indicesTextureHeightProp, height);
        break;
      }
      case IndexFormat.UInt16: {
        const uint16Buffer = new Uint16Array(buffer.buffer);

        triangleCount = byteLength / 6;
        const width = Math.min(triangleCount, SketchRenderer._MAX_TEXTURE_ROWS);
        const height = Math.ceil(triangleCount / SketchRenderer._MAX_TEXTURE_ROWS);
        this._indicesTexture = new Texture2D(this.engine, width, height, TextureFormat.R32G32B32A32, false);

        const floatBuffer = new Float32Array(width * height * 4);
        for (let i = 0; i < triangleCount; i++) {
          for (let j = 0; j < 3; j++) {
            floatBuffer[i * 4 + j] = uint16Buffer[i * 3 + j];
          }
          floatBuffer[i * 4 + 3] = 0;
        }
        this._indicesTexture.setPixelBuffer(floatBuffer);
        this.shaderData.setTexture(SketchRenderer._indicesSamplerProp, this._indicesTexture);
        this.shaderData.setFloat(SketchRenderer._indicesTextureWidthProp, width);
        this.shaderData.setFloat(SketchRenderer._indicesTextureHeightProp, height);
        break;
      }
      case IndexFormat.UInt32: {
        const uint32Buffer = new Uint32Array(buffer.buffer);

        triangleCount = byteLength / 12;
        const width = Math.min(triangleCount, SketchRenderer._MAX_TEXTURE_ROWS);
        const height = Math.ceil(triangleCount / SketchRenderer._MAX_TEXTURE_ROWS);
        this._indicesTexture = new Texture2D(this.engine, width, height, TextureFormat.R32G32B32A32, false);

        const floatBuffer = new Float32Array(width * height * 4);
        for (let i = 0; i < triangleCount; i++) {
          for (let j = 0; j < 3; j++) {
            floatBuffer[i * 4 + j] = uint32Buffer[i * 3 + j];
          }
          floatBuffer[i * 4 + 3] = 0;
        }
        this._indicesTexture.setPixelBuffer(floatBuffer);
        this.shaderData.setTexture(SketchRenderer._indicesSamplerProp, this._indicesTexture);
        this.shaderData.setFloat(SketchRenderer._indicesTextureWidthProp, width);
        this.shaderData.setFloat(SketchRenderer._indicesTextureHeightProp, height);
        break;
      }
    }
    this._indicesTexture.filterMode = TextureFilterMode.Point;
  }

  private _uploadVerticesBuffer(value: ModelMesh) {
    let buffers: Array<Float32Array> = [];
    let uint8Buffers: Array<Uint8Array> = [];
    let elementCounts: number[] = [];

    const vertexCount = value.vertexCount;
    const vertexBufferBindings = value.vertexBufferBindings;

    let totalElementCount = 0;
    let totalNewElementCount = 0;

    for (let i = 0; i < vertexBufferBindings.length; i++) {
      const vertexBufferBinding = value.vertexBufferBindings[i];

      const elementCount = this._updateMeshElement(value, i);
      let newElementCount = elementCount;

      const buffer = new Float32Array(elementCount * vertexCount);
      vertexBufferBinding.buffer.getData(buffer);
      const uint8Buffer = new Uint8Array(buffer.buffer);

      buffers.push(buffer);
      uint8Buffers.push(uint8Buffer);
      elementCounts.push(elementCount);
      totalElementCount += elementCount;
      totalNewElementCount += newElementCount;
    }

    for (let i = 0; i < this._vertexElementOrder.length; i++) {
      if (this._vertexElementOrder[i] === -1) {
        this._vertexElementOrder.splice(i, 1);
        i--;
      }
    }

    if (SketchRenderer._jointIndexBegin !== -1) {
      totalNewElementCount += 3;
    }

    const alignElementCount = Math.ceil(totalNewElementCount / 4) * 4;
    this.shaderData.enableMacro("ELEMENT_COUNT", (alignElementCount / 4).toString());

    const width = Math.min(vertexCount, SketchRenderer._MAX_TEXTURE_ROWS) * alignElementCount;
    const height = Math.ceil(vertexCount / SketchRenderer._MAX_TEXTURE_ROWS);
    const alignBuffer = new Float32Array(width * height);

    const { _jointIndexBegin: jointIndexBegin, _jointBufferIndex: jointBufferIndex } = SketchRenderer;

    for (let i = 0; i < vertexCount; i++) {
      for (let j = 0; j < totalElementCount; j++) {
        // @ts-ignore
        const bufferIdx = this._vertexElementOrder[j].idx;
        // @ts-ignore
        const elementIdx = this._vertexElementOrder[j].order;
        const currBuffer = buffers[bufferIdx];
        const currUnit8Buffer = uint8Buffers[bufferIdx];
        const currElementCount = elementCounts[bufferIdx];

        if (bufferIdx === jointBufferIndex && elementIdx === jointIndexBegin) {
          alignBuffer[i * alignElementCount + j] = currUnit8Buffer[i * currElementCount * 4 + jointIndexBegin * 4];
          alignBuffer[i * alignElementCount + j + 1] =
            currUnit8Buffer[i * currElementCount * 4 + jointIndexBegin * 4 + 1];
          alignBuffer[i * alignElementCount + j + 2] =
            currUnit8Buffer[i * currElementCount * 4 + jointIndexBegin * 4 + 2];
          alignBuffer[i * alignElementCount + j + 3] =
            currUnit8Buffer[i * currElementCount * 4 + jointIndexBegin * 4 + 3];
          j = j + 3;
        } else {
          alignBuffer[i * alignElementCount + j] = currBuffer[i * currElementCount + elementIdx];
        }
      }
    }

    this._createVerticesTexture(alignBuffer, width / 4, height);
    SketchRenderer._jointIndexBegin = -1;
    SketchRenderer._jointBufferIndex = -1;
  }

  private _createVerticesTexture(vertexBuffer: ArrayBufferView, width: number, height: number) {
    this._verticesTexture = new Texture2D(this.engine, width, height, TextureFormat.R32G32B32A32, false);
    this._verticesTexture.filterMode = TextureFilterMode.Point;
    this._verticesTexture.setPixelBuffer(vertexBuffer);

    this.shaderData.setTexture(SketchRenderer._verticesSamplerProp, this._verticesTexture);
    this.shaderData.setFloat(SketchRenderer._verticesTextureWidthProp, width);
    this.shaderData.setFloat(SketchRenderer._verticesTextureHeightProp, height);
  }

  private _updateMeshElement(value: ModelMesh, idx: number): number {
    const shaderData = this.shaderData;
    //@ts-ignore
    shaderData.disableMacro(SketchRenderer._normalMacro);
    //@ts-ignore
    this.enableVertexColor && shaderData.disableMacro(SketchRenderer._enableVertexColorMacro);
    //@ts-ignore
    shaderData.disableMacro(SketchRenderer._tangentMacro);
    //@ts-ignore
    shaderData.disableMacro(SketchRenderer._uvMacro);
    //@ts-ignore
    shaderData.disableMacro(SketchRenderer._uv1Macro);
    shaderData.disableMacro(SketchRenderer._weightMacro);
    shaderData.disableMacro(SketchRenderer._jointMacro);

    let elementCount = 0;
    //@ts-ignore
    const vertexElements = value.vertexElements;
    const { _vertexElementOrder: elementOrder } = this;
    for (let i = 0, n = vertexElements.length; i < n; i++) {
      const { semantic, offset, bindingIndex } = vertexElements[i];
      if (bindingIndex !== idx) continue;
      switch (semantic) {
        case "POSITION":
          elementCount += 3;
          elementOrder[0] = { idx: bindingIndex, order: offset / 4 };
          elementOrder[1] = { idx: bindingIndex, order: offset / 4 + 1 };
          elementOrder[2] = { idx: bindingIndex, order: offset / 4 + 2 };
          break;
        case "NORMAL":
          elementCount += 3;
          elementOrder[3] = { idx: bindingIndex, order: offset / 4 };
          elementOrder[4] = { idx: bindingIndex, order: offset / 4 + 1 };
          elementOrder[5] = { idx: bindingIndex, order: offset / 4 + 2 };
          //@ts-ignore
          shaderData.enableMacro(SketchRenderer._normalMacro);
          break;
        case "COLOR_0":
          if (this.enableVertexColor) {
            elementCount += 4;
            elementOrder[6] = { idx: bindingIndex, order: offset / 4 };
            elementOrder[7] = { idx: bindingIndex, order: offset / 4 + 1 };
            elementOrder[8] = { idx: bindingIndex, order: offset / 4 + 2 };
            elementOrder[9] = { idx: bindingIndex, order: offset / 4 + 3 };
            //@ts-ignore
            shaderData.enableMacro(SketchRenderer._enableVertexColorMacro);
          }
          break;
        case "WEIGHTS_0":
          elementCount += 4;
          elementOrder[10] = { idx: bindingIndex, order: offset / 4 };
          elementOrder[11] = { idx: bindingIndex, order: offset / 4 + 1 };
          elementOrder[12] = { idx: bindingIndex, order: offset / 4 + 2 };
          elementOrder[13] = { idx: bindingIndex, order: offset / 4 + 3 };
          shaderData.enableMacro(SketchRenderer._weightMacro);
          break;
        case "JOINTS_0":
          SketchRenderer._jointIndexBegin = elementCount;
          SketchRenderer._jointBufferIndex = bindingIndex;
          elementCount += 1;
          elementOrder[14] = { idx: bindingIndex, order: offset / 4 };
          shaderData.enableMacro(SketchRenderer._jointMacro);
          break;
        case "TANGENT":
          //@ts-ignore
          shaderData.enableMacro(SketchRenderer._tangentMacro);
          elementOrder[15] = { idx: bindingIndex, order: offset / 4 };
          elementOrder[16] = { idx: bindingIndex, order: offset / 4 + 1 };
          elementOrder[17] = { idx: bindingIndex, order: offset / 4 + 2 };
          elementOrder[18] = { idx: bindingIndex, order: offset / 4 + 3 };
          elementCount += 4;
          break;
        case "TEXCOORD_0":
          //@ts-ignore
          shaderData.enableMacro(SketchRenderer._uvMacro);
          elementOrder[19] = { idx: bindingIndex, order: offset / 4 };
          elementOrder[20] = { idx: bindingIndex, order: offset / 4 + 1 };
          elementCount += 2;
          break;
        case "TEXCOORD_1":
          //@ts-ignore
          shaderData.enableMacro(SketchRenderer._uv1Macro);
          elementOrder[21] = { idx: bindingIndex, order: offset / 4 };
          elementOrder[22] = { idx: bindingIndex, order: offset / 4 + 1 };
          elementCount += 2;
          break;
        case "TEXCOORD_2":
          elementOrder[23] = { idx: bindingIndex, order: offset / 4 };
          elementOrder[24] = { idx: bindingIndex, order: offset / 4 + 1 };
          elementCount += 2;
          break;
        case "TEXCOORD_3":
          elementOrder[25] = { idx: bindingIndex, order: offset / 4 };
          elementOrder[26] = { idx: bindingIndex, order: offset / 4 + 1 };
          elementCount += 2;
          break;
        case "TEXCOORD_4":
          elementOrder[27] = { idx: bindingIndex, order: offset / 4 };
          elementOrder[28] = { idx: bindingIndex, order: offset / 4 + 1 };
          elementCount += 2;
          break;
        case "TEXCOORD_5":
          elementOrder[29] = { idx: bindingIndex, order: offset / 4 };
          elementOrder[30] = { idx: bindingIndex, order: offset / 4 + 1 };
          elementCount += 2;
          break;
        case "TEXCOORD_6":
          elementOrder[31] = { idx: bindingIndex, order: offset / 4 };
          elementOrder[32] = { idx: bindingIndex, order: offset / 4 + 1 };
          elementCount += 2;
          break;
        case "TEXCOORD_7":
          elementOrder[33] = { idx: bindingIndex, order: offset / 4 };
          elementOrder[34] = { idx: bindingIndex, order: offset / 4 + 1 };
          elementCount += 2;
          break;
      }
    }
    return elementCount;
  }

  private _updateLineSubMesh(mesh: ModelMesh) {
    this._lineSubMesh.count = mesh.vertexCount * 2;
  }

  private _updateTriangleSubMesh(mesh: ModelMesh) {
    let triangleCount = 0;
    const subMeshes = mesh.subMeshes;
    for (let i = 0; i < subMeshes.length; i++) {
      const subMesh = subMeshes[i];
      triangleCount += subMesh.count;
    }
    this._triangleSubMesh.count = triangleCount;
  }

  private _destroy() {
    this._indicesTexture && this._indicesTexture.destroy();
    this._verticesTexture && this._verticesTexture.destroy();
  }
}
