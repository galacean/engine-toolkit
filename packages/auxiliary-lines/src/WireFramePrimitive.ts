import { Vector3 } from "oasis-engine";

export class WireFramePrimitive {
  static createCuboidWireFrame(
    width: number,
    height: number,
    depth: number,
    vertexBegin: number,
    positions: Vector3[],
    indices: number[]
  ) {
    const halfWidth: number = width / 2;
    const halfHeight: number = height / 2;
    const halfDepth: number = depth / 2;

    // Up
    positions.push(new Vector3(-halfWidth, halfHeight, -halfDepth));
    positions.push(new Vector3(halfWidth, halfHeight, -halfDepth));
    positions.push(new Vector3(halfWidth, halfHeight, halfDepth));
    positions.push(new Vector3(-halfWidth, halfHeight, halfDepth));

    // Down
    positions.push(new Vector3(-halfWidth, -halfHeight, -halfDepth));
    positions.push(new Vector3(halfWidth, -halfHeight, -halfDepth));
    positions.push(new Vector3(halfWidth, -halfHeight, halfDepth));
    positions.push(new Vector3(-halfWidth, -halfHeight, halfDepth));

    // Left
    positions.push(new Vector3(-halfWidth, halfHeight, -halfDepth));
    positions.push(new Vector3(-halfWidth, halfHeight, halfDepth));
    positions.push(new Vector3(-halfWidth, -halfHeight, halfDepth));
    positions.push(new Vector3(-halfWidth, -halfHeight, -halfDepth));

    // Right
    positions.push(new Vector3(halfWidth, halfHeight, -halfDepth));
    positions.push(new Vector3(halfWidth, halfHeight, halfDepth));
    positions.push(new Vector3(halfWidth, -halfHeight, halfDepth));
    positions.push(new Vector3(halfWidth, -halfHeight, -halfDepth));

    // Front
    positions.push(new Vector3(-halfWidth, halfHeight, halfDepth));
    positions.push(new Vector3(halfWidth, halfHeight, halfDepth));
    positions.push(new Vector3(halfWidth, -halfHeight, halfDepth));
    positions.push(new Vector3(-halfWidth, -halfHeight, halfDepth));

    // Back
    positions.push(new Vector3(-halfWidth, halfHeight, -halfDepth));
    positions.push(new Vector3(halfWidth, halfHeight, -halfDepth));
    positions.push(new Vector3(halfWidth, -halfHeight, -halfDepth));
    positions.push(new Vector3(-halfWidth, -halfHeight, -halfDepth));

    // Up
    indices.push(
      vertexBegin,
      1 + vertexBegin,
      1 + vertexBegin,
      2 + vertexBegin,
      2 + vertexBegin,
      3 + vertexBegin,
      3 + vertexBegin,
      vertexBegin
    );
    // Down
    indices.push(
      4 + vertexBegin,
      5 + vertexBegin,
      5 + vertexBegin,
      6 + vertexBegin,
      6 + vertexBegin,
      7 + vertexBegin,
      7 + vertexBegin,
      4 + vertexBegin
    );
    // Left
    indices.push(
      8 + vertexBegin,
      9 + vertexBegin,
      9 + vertexBegin,
      10 + vertexBegin,
      10 + vertexBegin,
      11 + vertexBegin,
      11 + vertexBegin,
      8 + vertexBegin
    );
    // Right
    indices.push(
      12 + vertexBegin,
      13 + vertexBegin,
      13 + vertexBegin,
      14 + vertexBegin,
      14 + vertexBegin,
      15 + vertexBegin,
      15 + vertexBegin,
      12 + vertexBegin
    );
    // Front
    indices.push(
      16 + vertexBegin,
      17 + vertexBegin,
      17 + vertexBegin,
      18 + vertexBegin,
      18 + vertexBegin,
      19 + vertexBegin,
      19 + vertexBegin,
      16 + vertexBegin
    );
    // Back
    indices.push(
      20 + vertexBegin,
      21 + vertexBegin,
      21 + vertexBegin,
      22 + vertexBegin,
      22 + vertexBegin,
      23 + vertexBegin,
      23 + vertexBegin,
      20 + vertexBegin
    );
  }

  static createSphereWireFrame(radius: number, vertexBegin: number, positions: Vector3[], indices: number[]) {
    const vertexCount = 40;
    const shift = new Vector3();

    // X
    WireFramePrimitive.createCircleWireFrame(radius, 0, shift, vertexBegin, vertexCount, positions, indices);

    // Y
    WireFramePrimitive.createCircleWireFrame(
      radius,
      1,
      shift,
      vertexBegin + vertexCount,
      vertexCount,
      positions,
      indices
    );

    // Z
    WireFramePrimitive.createCircleWireFrame(
      radius,
      2,
      shift,
      vertexBegin + vertexCount * 2,
      vertexCount,
      positions,
      indices
    );
  }

  static createCapsuleWireFrame(
    radius: number,
    height: number,
    vertexBegin: number,
    positions: Vector3[],
    indices: number[]
  ) {
    const vertexCount = 40;
    const shift = new Vector3();
    const halfHeight = height / 2;

    // Y-Top
    shift.y = halfHeight;
    WireFramePrimitive.createCircleWireFrame(radius, 1, shift, vertexBegin, vertexCount, positions, indices);

    // Y-Bottom
    shift.y = -halfHeight;
    WireFramePrimitive.createCircleWireFrame(
      radius,
      1,
      shift,
      vertexBegin + vertexCount,
      vertexCount,
      positions,
      indices
    );

    // X-Elliptic
    WireFramePrimitive.createEllipticWireFrame(
      radius,
      halfHeight,
      2,
      vertexBegin + vertexCount * 2,
      vertexCount,
      positions,
      indices
    );

    // Z-Elliptic
    WireFramePrimitive.createEllipticWireFrame(
      radius,
      halfHeight,
      0,
      vertexBegin + vertexCount * 3,
      vertexCount,
      positions,
      indices
    );
  }

  static createCircleWireFrame(
    radius: number,
    axis: number,
    shift: Vector3,
    vertexBegin: number,
    vertexCount: number,
    positions: Vector3[],
    indices: number[]
  ) {
    const countReciprocal = 1.0 / vertexCount;
    for (let i = 0; i < vertexCount; ++i) {
      const v = i * countReciprocal;
      const thetaDelta = v * Math.PI * 2;

      switch (axis) {
        case 0:
          positions.push(
            new Vector3(shift.x, radius * Math.cos(thetaDelta) + shift.y, radius * Math.sin(thetaDelta) + shift.z)
          );
          break;
        case 1:
          positions.push(
            new Vector3(radius * Math.cos(thetaDelta) + shift.x, shift.y, radius * Math.sin(thetaDelta) + shift.z)
          );
          break;
        case 2:
          positions.push(
            new Vector3(radius * Math.cos(thetaDelta) + shift.x, radius * Math.sin(thetaDelta) + shift.y, shift.z)
          );
          break;
      }

      const globalIndex = i + vertexBegin;
      if (i < vertexCount - 1) {
        indices.push(globalIndex, globalIndex + 1);
      } else {
        indices.push(globalIndex, vertexBegin);
      }
    }
  }

  static createEllipticWireFrame(
    radius: number,
    height: number,
    axis: number,
    vertexBegin: number,
    vertexCount: number,
    positions: Vector3[],
    indices: number[]
  ) {
    const countReciprocal = 1.0 / vertexCount;
    for (let i = 0; i < vertexCount; ++i) {
      const v = i * countReciprocal;
      const thetaDelta = v * Math.PI * 2;

      switch (axis) {
        case 0:
          positions.push(new Vector3(0, radius * Math.sin(thetaDelta) + height, radius * Math.cos(thetaDelta)));
          break;
        case 1:
          positions.push(new Vector3(radius * Math.cos(thetaDelta), height, radius * Math.sin(thetaDelta)));
          break;
        case 2:
          positions.push(new Vector3(radius * Math.cos(thetaDelta), radius * Math.sin(thetaDelta) + height, 0));
          break;
      }

      if (i == vertexCount / 2) {
        height = -height;
      }

      const globalIndex = i + vertexBegin;
      if (i < vertexCount - 1) {
        indices.push(globalIndex, globalIndex + 1);
      } else {
        indices.push(globalIndex, vertexBegin);
      }
    }
  }
}
