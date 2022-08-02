/**
 * @file 构建线三角形
 */

import { LineCap, LineJoin } from "../constants";
import wasmString from "./line.wasm";

type LineBuilderResult = {
  vertices: Float32Array;
  indices: Uint16Array;
};

class LineVertexBuilder {
  private static _instance: LineVertexBuilder;
  static get instance(): LineVertexBuilder {
    if (!this._instance) {
      this._instance = new LineVertexBuilder();
    }
    return this._instance;
  }

  private _memory: ArrayBuffer;
  private _heap32: Float32Array;
  private _heap16: Int16Array;

  private _wasmModule;
  private _wasmInitPromise;

  constructor() {
    const wasmBuffer = Uint8Array.from(atob(wasmString), (c) => c.charCodeAt(0));

    this._wasmInitPromise = new Promise<void>((resolve) => {
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
        this._memory = (result.instance.exports.memory as WebAssembly.Memory).buffer;
        this._heap32 = new Float32Array(this._memory);
        this._heap16 = new Int16Array(this._memory);
        this._wasmModule = result.instance.exports;
        resolve();
      });
    });
  }

  /**
   * Parse the solid line
   * @param points The points array
   * @param join Line's join property
   * @param cap Line's cap property
   * @param start The start index of the output vertex.
   * @returns The vertex buffer and index buffer.
   */
  public async solidLine(points: number[], join: LineJoin, cap: LineCap, start: number): Promise<LineBuilderResult> {
    await this._wasmInitPromise;
    this._heap32.set(points, 0);
    const vertexCount = this._getSolidVertexCount(points.length / 2, join);
    const indexCount = vertexCount * 3 - 6;
    const verticesStart = points.length * Float32Array.BYTES_PER_ELEMENT;
    const indicesStart = verticesStart + vertexCount * 24;
    const indicesEnd = indicesStart + indexCount * Uint16Array.BYTES_PER_ELEMENT;
    this._wasmModule.build_solid_line(0, points.length / 2, join, cap, start, verticesStart, indicesStart);

    return {
      vertices: new Float32Array(this._memory.slice(verticesStart, indicesStart)),
      indices: new Uint16Array(this._memory.slice(indicesStart, indicesEnd))
    };
  }

  /**
   * Parse the dash line
   * @param points The points array
   * @param join Line's join property
   * @param cap Line's cap property
   * @param lengthsofar Length of all previous lines.
   * @param start The start index of the output vertex.
   * @returns The vertex buffer and index buffer.
   */
  public async dashLine(
    points: number[],
    join: LineJoin,
    cap: LineCap,
    lengthsofar: number,
    start: number
  ): Promise<LineBuilderResult> {
    await this._wasmInitPromise;
    this._heap32.set(points, 0);
    const vertexCount = this._getDashVertexCount(points.length / 2, join);
    const indexCount = vertexCount * 3 - 6;
    const verticesStart = points.length * Float32Array.BYTES_PER_ELEMENT;
    const indicesStart = verticesStart + vertexCount * 24;
    const indicesEnd = indicesStart + indexCount * Uint16Array.BYTES_PER_ELEMENT;
    this._wasmModule.build_dash_line(0, points.length / 2, join, cap, lengthsofar, start, verticesStart, indicesStart);

    return {
      vertices: new Float32Array(this._memory.slice(verticesStart, indicesStart)),
      indices: new Uint16Array(this._memory.slice(indicesStart, indicesEnd))
    };
  }

  private _getSolidVertexCount(pointCount: number, join: LineJoin) {
    if (join === LineJoin.Round) {
      return pointCount * 5 - 2;
    } else {
      return pointCount * 4;
    }
  }

  private _getDashVertexCount(pointCount: number, join: LineJoin) {
    if (join === LineJoin.Bevel) {
      return pointCount * 7 - 6;
    } else {
      return pointCount * 5 - 2;
    }
  }
}

export { LineVertexBuilder };
