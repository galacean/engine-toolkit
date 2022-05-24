import { Vector3 } from "oasis-engine";

export class WireFramePrimitive {
  static createCuboidWireFrame(width: number, height: number, depth: number, positions: Vector3[], indices: number[]) {
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
    indices.push(0, 1, 1, 2, 2, 3, 3, 0);
    // Down
    indices.push(4, 5, 5, 6, 6, 7, 7, 4);
    // Left
    indices.push(8, 9, 9, 10, 10, 11, 11, 8);
    // Right
    indices.push(12, 13, 13, 14, 14, 15, 15, 12);
    // Front
    indices.push(16, 17, 17, 18, 18, 19, 19, 16);
    // Back
    indices.push(20, 21, 21, 22, 22, 23, 23, 20);
  }

  static createSphereWireFrame(radius: number, positions: Vector3[], indices: number[]) {
    const vertexCount = 40;
    const shift = new Vector3();

    // X
    WireFramePrimitive.createCircleWireFrame(radius, 0, shift, vertexCount, positions, indices);

    // Y
    WireFramePrimitive.createCircleWireFrame(radius, 1, shift, vertexCount, positions, indices);

    // Z
    WireFramePrimitive.createCircleWireFrame(radius, 2, shift, vertexCount, positions, indices);
  }

  static createCapsuleWireFrame(radius: number, height: number, positions: Vector3[], indices: number[]) {
    const vertexCount = 40;
    const shift = new Vector3();
    const halfHeight = height / 2;

    // Y-Top
    shift.y = halfHeight;
    WireFramePrimitive.createCircleWireFrame(radius, 1, shift, vertexCount, positions, indices);

    // Y-Bottom
    shift.y = -halfHeight;
    WireFramePrimitive.createCircleWireFrame(radius, 1, shift, vertexCount, positions, indices);

    // X-Elliptic
    WireFramePrimitive.createEllipticWireFrame(radius, halfHeight, 2, vertexCount, positions, indices);

    // Z-Elliptic
    WireFramePrimitive.createEllipticWireFrame(radius, halfHeight, 0, vertexCount, positions, indices);
  }

  static createCircleWireFrame(
    radius: number,
    axis: number,
    shift: Vector3,
    vertexCount: number,
    positions: Vector3[],
    indices: number[]
  ) {
    const vertexBegin = positions.length;
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
    vertexCount: number,
    positions: Vector3[],
    indices: number[]
  ) {
    const vertexBegin = positions.length;
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
