/**
 * @file 构建线三角形
 */

import { LineCap, LineJoin } from "../constants";
import wasmString from "./line.wasm";

const wasmBuffer = Uint8Array.from(atob(wasmString), (c) => c.charCodeAt(0));

type LineBuilderResult = {
  vertices: Float32Array;
  indices: Uint16Array;
};

class LineVertexBuilder {
  private memory: ArrayBuffer;
  private heap32: Float32Array;
  private heap16: Int16Array;

  private wasmModule;
  private wasmInitPromise;

  constructor() {
    this.wasmInitPromise = new Promise<void>((resolve) => {
      WebAssembly.instantiate(wasmBuffer, {
        env: {
          consoleLog: function (arg) {
            // console.log('from wasm', arg);
          },
          segfault: (a, b, c) => {
            console.log(a, b, c);
          },
          alignfault: (a, b, c) => {
            console.log(a, b, c);
          }
        }
      }).then((result) => {
        this.memory = (result.instance.exports.memory as WebAssembly.Memory).buffer;
        this.heap32 = new Float32Array(this.memory);
        this.heap16 = new Int16Array(this.memory);
        this.wasmModule = result.instance.exports;
        resolve();
      });
    });
  }

  private getSolidVertexCount(pointCount: number, join: LineJoin) {
    if (join === LineJoin.Round) {
      return pointCount * 5 - 2;
    } else {
      return pointCount * 4;
    }
  }

  private getDashVertexCount(pointCount: number, join: LineJoin) {
    if (join === LineJoin.Bevel) {
      return pointCount * 7 - 6;
    } else {
      return pointCount * 5 - 2;
    }
  }

  public async solidLine(points: number[], join: LineJoin, cap: LineCap, count: number): Promise<LineBuilderResult> {
    await this.wasmInitPromise;
    this.heap32.set(points, 0);
    const vertexCount = this.getSolidVertexCount(points.length / 2, join);
    const indexCount = vertexCount * 3 - 6;
    const verticesStart = points.length * Float32Array.BYTES_PER_ELEMENT;
    const indicesStart = verticesStart + vertexCount * 24;
    const indicesEnd = indicesStart + indexCount * Uint16Array.BYTES_PER_ELEMENT;
    this.wasmModule.build_solid_line(0, points.length / 2, join, cap, count, verticesStart, indicesStart);
    return {
      vertices: new Float32Array(this.memory.slice(verticesStart, indicesStart)),
      indices: new Uint16Array(this.memory.slice(indicesStart, indicesEnd))
    };
  }

  public async dashLine(
    points: number[],
    join: LineJoin,
    cap: LineCap,
    lengthsofar: number,
    count: number
  ): Promise<LineBuilderResult> {
    await this.wasmInitPromise;
    this.heap32.set(points, 0);
    const vertexCount = this.getDashVertexCount(points.length / 2, join);
    const indexCount = vertexCount * 3 - 6;
    const verticesStart = points.length * Float32Array.BYTES_PER_ELEMENT;
    const indicesStart = verticesStart + vertexCount * 24;
    const indicesEnd = indicesStart + indexCount * Uint16Array.BYTES_PER_ELEMENT;
    this.wasmModule.build_dash_line(0, points.length / 2, join, cap, lengthsofar, count, verticesStart, indicesStart);
    return {
      vertices: new Float32Array(this.memory.slice(verticesStart, indicesStart)),
      indices: new Uint16Array(this.memory.slice(indicesStart, indicesEnd))
    };
  }
}

export default new LineVertexBuilder();
