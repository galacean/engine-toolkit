import {
  BaseMaterial,
  Engine,
  IndexBufferBinding,
  IndexFormat,
  Matrix,
  ModelMesh,
  RenderFace,
  Shader,
  Texture2D,
  TextureFilterMode,
  TextureFormat,
  VertexBufferBinding,
  VertexElement
} from "oasis-engine";

Shader.create(
  "normalShader",
  `
   uniform sampler2D u_verticesSampler;
   uniform float u_verticesTextureWidth;
   uniform float u_verticesTextureHeight;
   
   uniform sampler2D u_indicesSampler;
   uniform float u_indicesTextureWidth;
   uniform float u_indicesTextureHeight;
   
   uniform float u_lineScale;
   uniform mat4 u_VPMat;
   uniform mat4 u_worldMatrix;
   
#ifdef O3_HAS_SKIN
#ifdef O3_USE_JOINT_TEXTURE
    uniform sampler2D u_jointSampler;
    uniform float u_jointCount;

    mat4 getJointMatrix(sampler2D smp, float index) {
        float base = index / u_jointCount;
        float hf = 0.5 / u_jointCount;
        float v = base + hf;

        vec4 m0 = texture2D(smp, vec2(0.125, v ));
        vec4 m1 = texture2D(smp, vec2(0.375, v ));
        vec4 m2 = texture2D(smp, vec2(0.625, v ));
        vec4 m3 = texture2D(smp, vec2(0.875, v ));

        return mat4(m0, m1, m2, m3);
    }
#else
    uniform mat4 u_jointMatrix[ O3_JOINTS_NUM ];
#endif
#endif

uniform mat4 u_localMat;
uniform mat4 u_modelMat;
uniform mat4 u_viewMat;
uniform mat4 u_projMat;
uniform mat4 u_MVMat;
uniform mat4 u_MVPMat;
uniform mat4 u_normalMat;
uniform vec3 u_cameraPos;
uniform vec4 u_tilingOffset;
#include <normal_share>
   
   vec4 getVertexElement(float row, float col) {
        return texture2D(u_verticesSampler, vec2((col + 0.5) / u_verticesTextureWidth, (row + 0.5) / u_verticesTextureHeight));
   }
   
   vec3 getIndicesElement(float row, float col) {
        return texture2D(u_indicesSampler, vec2((col + 0.5) / u_indicesTextureWidth, (row + 0.5) / u_indicesTextureHeight )).xyz;
   }
   
   vec2 getVec2(inout vec4[ELEMENT_COUNT] rows, inout int row_index, inout int value_index) {
        row_index += (value_index+1)/4;
        value_index = (value_index+1)%4;
        float x = rows[row_index][value_index];
        
        row_index += (value_index+1)/4;
        value_index = (value_index+1)%4;
        float y = rows[row_index][value_index];
        
        return vec2(x, y);
   }
   
   vec3 getVec3(inout vec4[ELEMENT_COUNT] rows, inout int row_index, inout int value_index) {
        row_index += (value_index+1)/4;
        value_index = (value_index+1)%4;
        float x = rows[row_index][value_index];
        
        row_index += (value_index+1)/4;
        value_index = (value_index+1)%4;
        float y = rows[row_index][value_index];
        
        row_index += (value_index+1)/4;
        value_index = (value_index+1)%4;
        float z = rows[row_index][value_index];
        return vec3(x, y, z);
   }
   
   vec4 getVec4(inout vec4[ELEMENT_COUNT] rows, inout int row_index, inout int value_index) {
        row_index += (value_index+1)/4;
        value_index = (value_index+1)%4;
        float x = rows[row_index][value_index];
        
        row_index += (value_index+1)/4;
        value_index = (value_index+1)%4;
        float y = rows[row_index][value_index];
        
        row_index += (value_index+1)/4;
        value_index = (value_index+1)%4;
        float z = rows[row_index][value_index];
        
        row_index += (value_index+1)/4;
        value_index = (value_index+1)%4;
        float w = rows[row_index][value_index];
        return vec4(x, y, z, w);
   }
   
#ifdef WIREFRAME_MODE
    varying vec3 v_baryCenter;
#endif
   
   void main() {
#ifdef WIREFRAME_MODE
        int indicesIndex = gl_VertexID / 3;
        int indicesRow = indicesIndex / int(u_indicesTextureWidth);
        int indicesCol = indicesIndex % int(u_indicesTextureWidth);
        vec3 triangleIndices = getIndicesElement(float(indicesRow), float(indicesCol));
        int subIndex = gl_VertexID % 3;
        v_baryCenter = vec3(0.0);
        v_baryCenter[subIndex] = 1.0;
        
        int pointIndex = int(triangleIndices[subIndex]);
#else
        int pointIndex = gl_VertexID / 2;
#endif
        int row = pointIndex * ELEMENT_COUNT / int(u_verticesTextureWidth);
        int col = pointIndex * ELEMENT_COUNT % int(u_verticesTextureWidth);
        
        vec4 rows[ELEMENT_COUNT];
        for( int i = 0; i < ELEMENT_COUNT; i++ ) {
            rows[i] = getVertexElement(float(row), float(col + i));
        }
        
        vec3 POSITION = vec3(rows[0].x, rows[0].y, rows[0].z);        
        int row_index = 0;
        int value_index = 2;
#ifdef O3_HAS_NORMAL 
        vec3 NORMAL = getVec3(rows, row_index, value_index);
#endif

#ifdef O3_HAS_VERTEXCOLOR
        vec4 COLOR_0 = getVec4(rows, row_index, value_index);
#endif

#ifdef O3_HAS_WEIGHT
        vec4 WEIGHTS_0 = getVec4(rows, row_index, value_index);
#endif

#ifdef O3_HAS_JOINT
        vec4 JOINTS_0 = getVec4(rows, row_index, value_index);
#endif

#ifdef O3_HAS_TANGENT
        vec4 TANGENT = getVec4(rows, row_index, value_index);
#endif

#ifdef O3_HAS_UV
        vec2 TEXCOORD_0 = getVec2(rows, row_index, value_index);
#endif

    #include <begin_position_vert>
    #include <begin_normal_vert>
    #include <skinning_vert>
    #include <normal_vert>
    
#ifndef WIREFRAME_MODE
        if (gl_VertexID % 2 == 1) {
            position.xyz += v_normal * u_lineScale;
        }
#endif

        gl_Position = position;
        #ifndef O3_HAS_SKIN
            gl_Position = u_worldMatrix * gl_Position; 
        #endif
        gl_Position = u_VPMat * gl_Position; 
   }
   
    `,
  `
#ifdef WIREFRAME_MODE
    varying vec3 v_baryCenter;
    
    float edgeFactor(){
        vec3 d = fwidth(v_baryCenter);
        vec3 a3 = smoothstep(vec3(0.0), d * 1.5, v_baryCenter);
        return min(min(a3.x, a3.y), a3.z);
    }
#endif
    void main() {
#ifdef WIREFRAME_MODE
    if (gl_FrontFacing) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0 - edgeFactor());
    } else {
        // 淡化背面
        gl_FragColor = vec4(0.0, 0.0, 0.0, (1.0 - edgeFactor()) * 0.3);
    }
#else
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
#endif
    }
    `
);

export class GeometryMaterial extends BaseMaterial {
  private static _uvMacro = Shader.getMacroByName("O3_HAS_UV");
  private static _uv1Macro = Shader.getMacroByName("O3_HAS_UV1");
  private static _normalMacro = Shader.getMacroByName("O3_HAS_NORMAL");
  private static _tangentMacro = Shader.getMacroByName("O3_HAS_TANGENT");
  private static _weightMacro = Shader.getMacroByName("O3_HAS_WEIGHT");
  private static _jointMacro = Shader.getMacroByName("O3_HAS_JOINT");
  private static _vertexColorMacro = Shader.getMacroByName("O3_HAS_VERTEXCOLOR");

  private static _MAX_TEXTURE_ROWS = 512;
  private static _jointIndexBegin = -1;

  private static _verticesSamplerProp = Shader.getPropertyByName("u_verticesSampler");
  private static _verticesTextureHeightProp = Shader.getPropertyByName("u_verticesTextureHeight");
  private static _verticesTextureWidthProp = Shader.getPropertyByName("u_verticesTextureWidth");

  private static _indicesSamplerProp = Shader.getPropertyByName("u_indicesSampler");
  private static _indicesTextureHeightProp = Shader.getPropertyByName("u_indicesTextureHeight");
  private static _indicesTextureWidthProp = Shader.getPropertyByName("u_indicesTextureWidth");

  private static _lineScaleProp = Shader.getPropertyByName("u_lineScale");
  private static _worldMatrixProp = Shader.getPropertyByName("u_worldMatrix");

  private _modelMesh: ModelMesh;
  private _verticesTexture: Texture2D;
  private _indicesTexture: Texture2D;

  set worldMatrix(value: Matrix) {
    this.shaderData.setMatrix(GeometryMaterial._worldMatrixProp, value);
  }

  set scale(value: number) {
    this.shaderData.setFloat(GeometryMaterial._lineScaleProp, value);
  }

  set mesh(value: ModelMesh) {
    this._modelMesh = value;
    this._uploadVerticesBuffer(value);
    this._uploadIndicesBuffer(value);
  }

  constructor(engine: Engine) {
    super(engine, Shader.find("normalShader"));
    // todo
    this.isTransparent = true;
    this.renderFace = RenderFace.Double;
  }

  private _uploadIndicesBuffer(value: ModelMesh) {
    //@ts-ignore
    const indexBuffer = (<IndexBufferBinding>value._indexBufferBinding).buffer;
    const byteLength = indexBuffer.byteLength;
    const buffer = new Uint8Array(byteLength);
    indexBuffer.getData(buffer);

    //@ts-ignore
    const indexFormat = <IndexFormat>value._indicesFormat;
    let triangleCount = 0;
    switch (indexFormat) {
      case IndexFormat.UInt8: {
        triangleCount = byteLength / 3;
        const width = Math.min(triangleCount, GeometryMaterial._MAX_TEXTURE_ROWS);
        const height = Math.ceil(triangleCount / GeometryMaterial._MAX_TEXTURE_ROWS);
        this._indicesTexture = new Texture2D(this.engine, width, height, TextureFormat.R32G32B32A32, false);

        const floatBuffer = new Float32Array(width * height * 4);
        for (let i = 0; i < triangleCount; i++) {
          for (let j = 0; j < 3; j++) {
            floatBuffer[i * 4 + j] = buffer[i * 3 + j];
          }
          floatBuffer[i * 4 + 3] = 0;
        }
        this._indicesTexture.setPixelBuffer(floatBuffer);
        this.shaderData.setTexture(GeometryMaterial._indicesSamplerProp, this._indicesTexture);
        this.shaderData.setFloat(GeometryMaterial._indicesTextureWidthProp, width);
        this.shaderData.setFloat(GeometryMaterial._indicesTextureHeightProp, height);
        break;
      }
      case IndexFormat.UInt16: {
        const uint16Buffer = new Uint16Array(buffer.buffer);

        triangleCount = byteLength / 6;
        const width = Math.min(triangleCount, GeometryMaterial._MAX_TEXTURE_ROWS);
        const height = Math.ceil(triangleCount / GeometryMaterial._MAX_TEXTURE_ROWS);
        this._indicesTexture = new Texture2D(this.engine, width, height, TextureFormat.R32G32B32A32, false);

        const floatBuffer = new Float32Array(width * height * 4);
        for (let i = 0; i < triangleCount; i++) {
          for (let j = 0; j < 3; j++) {
            floatBuffer[i * 4 + j] = uint16Buffer[i * 3 + j];
          }
          floatBuffer[i * 4 + 3] = 0;
        }
        this._indicesTexture.setPixelBuffer(floatBuffer);
        this.shaderData.setTexture(GeometryMaterial._indicesSamplerProp, this._indicesTexture);
        this.shaderData.setFloat(GeometryMaterial._indicesTextureWidthProp, width);
        this.shaderData.setFloat(GeometryMaterial._indicesTextureHeightProp, height);
        break;
      }
      case IndexFormat.UInt32: {
        const uint32Buffer = new Uint32Array(buffer.buffer);

        triangleCount = byteLength / 12;
        const width = Math.min(triangleCount, GeometryMaterial._MAX_TEXTURE_ROWS);
        const height = Math.ceil(triangleCount / GeometryMaterial._MAX_TEXTURE_ROWS);
        this._indicesTexture = new Texture2D(this.engine, width, height, TextureFormat.R32G32B32A32, false);

        const floatBuffer = new Float32Array(width * height * 4);
        for (let i = 0; i < triangleCount; i++) {
          for (let j = 0; j < 3; j++) {
            floatBuffer[i * 4 + j] = uint32Buffer[i * 3 + j];
          }
          floatBuffer[i * 4 + 3] = 0;
        }
        this._indicesTexture.setPixelBuffer(floatBuffer);
        this.shaderData.setTexture(GeometryMaterial._indicesSamplerProp, this._indicesTexture);
        this.shaderData.setFloat(GeometryMaterial._indicesTextureWidthProp, width);
        this.shaderData.setFloat(GeometryMaterial._indicesTextureHeightProp, height);
        break;
      }
    }
    this._indicesTexture.filterMode = TextureFilterMode.Point;
  }

  private _uploadVerticesBuffer(value: ModelMesh) {
    //@ts-ignore
    const vertexBufferBinding = <VertexBufferBinding>value._vertexBufferBindings[0];
    const vertexCount = value.vertexCount;
    const elementCount = this._meshElement(value);
    const jointIndexBegin = GeometryMaterial._jointIndexBegin;
    let newElementCount = elementCount;
    if (jointIndexBegin !== -1) {
      newElementCount += 3;
    }

    const buffer = new Float32Array(elementCount * vertexCount);
    vertexBufferBinding.buffer.getData(buffer);
    const uint8Buffer = new Uint8Array(buffer.buffer);

    const alignElementCount = Math.ceil(newElementCount / 4) * 4;
    this.shaderData.enableMacro("ELEMENT_COUNT", (alignElementCount / 4).toString());

    const width = Math.min(vertexCount, GeometryMaterial._MAX_TEXTURE_ROWS) * alignElementCount;
    const height = Math.ceil(vertexCount / GeometryMaterial._MAX_TEXTURE_ROWS);
    const alignBuffer = new Float32Array(width * height);

    for (let i = 0; i < vertexCount; i++) {
      for (let j = 0; j < newElementCount; j++) {
        if (jointIndexBegin !== -1 && j === jointIndexBegin) {
          alignBuffer[i * alignElementCount + j] = uint8Buffer[i * elementCount * 4 + jointIndexBegin * 4];
        } else if (jointIndexBegin !== -1 && j === jointIndexBegin + 1) {
          alignBuffer[i * alignElementCount + j] = uint8Buffer[i * elementCount * 4 + jointIndexBegin * 4 + 1];
        } else if (jointIndexBegin !== -1 && j === jointIndexBegin + 2) {
          alignBuffer[i * alignElementCount + j] = uint8Buffer[i * elementCount * 4 + jointIndexBegin * 4 + 2];
        } else if (jointIndexBegin !== -1 && j === jointIndexBegin + 3) {
          alignBuffer[i * alignElementCount + j] = uint8Buffer[i * elementCount * 4 + jointIndexBegin * 4 + 3];
        } else {
          if (j > jointIndexBegin + 3) {
            alignBuffer[i * alignElementCount + j] = buffer[i * elementCount + j - 3];
          } else {
            alignBuffer[i * alignElementCount + j] = buffer[i * elementCount + j];
          }
        }
      }
    }
    this._createVerticesTexture(alignBuffer, width / 4, height);
    GeometryMaterial._jointIndexBegin = -1;
  }

  private _createVerticesTexture(vertexBuffer: ArrayBufferView, width: number, height: number) {
    this._verticesTexture = new Texture2D(this.engine, width, height, TextureFormat.R32G32B32A32, false);
    this._verticesTexture.filterMode = TextureFilterMode.Point;
    this._verticesTexture.setPixelBuffer(vertexBuffer);

    this.shaderData.setTexture(GeometryMaterial._verticesSamplerProp, this._verticesTexture);
    this.shaderData.setFloat(GeometryMaterial._verticesTextureWidthProp, width);
    this.shaderData.setFloat(GeometryMaterial._verticesTextureHeightProp, height);
  }

  private _meshElement(value: ModelMesh): number {
    const shaderData = this.shaderData;
    let elementCount = 0;
    //@ts-ignore
    const vertexElements = <VertexElement[]>value._vertexElements;
    for (let i = 0, n = vertexElements.length; i < n; i++) {
      const { semantic } = vertexElements[i];
      switch (semantic) {
        case "POSITION":
          elementCount += 3;
          break;
        case "NORMAL":
          elementCount += 3;
          shaderData.enableMacro(GeometryMaterial._normalMacro);
          break;
        case "COLOR_0":
          elementCount += 4;
          shaderData.enableMacro(GeometryMaterial._vertexColorMacro);
          break;
        case "WEIGHTS_0":
          elementCount += 4;
          shaderData.enableMacro(GeometryMaterial._weightMacro);
          break;
        case "JOINTS_0":
          GeometryMaterial._jointIndexBegin = elementCount;
          elementCount += 1;
          shaderData.enableMacro(GeometryMaterial._jointMacro);
          break;
        case "TANGENT":
          shaderData.enableMacro(GeometryMaterial._tangentMacro);
          elementCount += 4;
          break;
        case "TEXCOORD_0":
          shaderData.enableMacro(GeometryMaterial._uvMacro);
          elementCount += 2;
          break;
        case "TEXCOORD_1":
          shaderData.enableMacro(GeometryMaterial._uv1Macro);
          elementCount += 2;
          break;
        case "TEXCOORD_2":
          elementCount += 2;
          break;
        case "TEXCOORD_3":
          elementCount += 2;
          break;
        case "TEXCOORD_4":
          elementCount += 2;
          break;
        case "TEXCOORD_5":
          elementCount += 2;
          break;
        case "TEXCOORD_6":
          elementCount += 2;
          break;
        case "TEXCOORD_7":
          elementCount += 2;
          break;
      }
    }
    return elementCount;
  }
}
