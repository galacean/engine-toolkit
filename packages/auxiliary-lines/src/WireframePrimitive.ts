import { MathUtil, Vector3 } from "oasis-engine";

/**
 * Wireframe primitive.
 */
export class WireframePrimitive {
  /** global settings for vertex count */
  static vertexCount = 40;

  /**
   * Get cuboid wire frame indices count
   */
  static get cuboidIndicesCount(): number {
    return 48;
  }

  /**
   * Get sphere wire frame indices count
   */
  static get sphereIndicesCount(): number {
    return WireframePrimitive.circleIndicesCount * 3;
  }

  /**
   * Get cone wire frame indices count
   */
  static get coneIndicesCount(): number {
    return WireframePrimitive.circleIndicesCount + 8;
  }

  /**
   * Get unbound cylinder wire frame indices count
   */
  static get unboundCylinderIndicesCount(): number {
    return WireframePrimitive.circleIndicesCount + 16;
  }

  /**
   * Get capsule wire frame indices count
   */
  static get capsuleIndicesCount(): number {
    return (WireframePrimitive.circleIndicesCount + WireframePrimitive.ellipticIndicesCount) * 2;
  }

  /**
   * Get circle wire frame indices count
   */
  static get circleIndicesCount(): number {
    return WireframePrimitive.vertexCount * 2;
  }

  /**
   * Get elliptic wire frame indices count
   */
  static get ellipticIndicesCount(): number {
    return WireframePrimitive.vertexCount * 2;
  }

  /**
   * Store cuboid wireframe mesh data.
   * The origin located in center of cuboid.
   * @param width - Cuboid width
   * @param height - Cuboid height
   * @param depth - Cuboid depth
   * @param vertexBegin - The min of index list
   * @param positions - position array
   * @param indices - index array
   * @param indicesOffset - index array offset
   */
  static createCuboidWireframe(
    width: number,
    height: number,
    depth: number,
    vertexBegin: number,
    positions: Vector3[],
    indices: Uint16Array | Uint32Array,
    indicesOffset: number
  ): void {
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
    indices[indicesOffset++] = vertexBegin;
    indices[indicesOffset++] = vertexBegin + 1;
    indices[indicesOffset++] = vertexBegin + 1;
    indices[indicesOffset++] = vertexBegin + 2;
    indices[indicesOffset++] = vertexBegin + 2;
    indices[indicesOffset++] = vertexBegin + 3;
    indices[indicesOffset++] = vertexBegin + 3;
    indices[indicesOffset++] = vertexBegin;

    // Down
    indices[indicesOffset++] = vertexBegin + 4;
    indices[indicesOffset++] = vertexBegin + 5;
    indices[indicesOffset++] = vertexBegin + 5;
    indices[indicesOffset++] = vertexBegin + 6;
    indices[indicesOffset++] = vertexBegin + 6;
    indices[indicesOffset++] = vertexBegin + 7;
    indices[indicesOffset++] = vertexBegin + 7;
    indices[indicesOffset++] = vertexBegin + 4;

    // Left
    indices[indicesOffset++] = vertexBegin + 8;
    indices[indicesOffset++] = vertexBegin + 9;
    indices[indicesOffset++] = vertexBegin + 9;
    indices[indicesOffset++] = vertexBegin + 10;
    indices[indicesOffset++] = vertexBegin + 10;
    indices[indicesOffset++] = vertexBegin + 11;
    indices[indicesOffset++] = vertexBegin + 11;
    indices[indicesOffset++] = vertexBegin + 8;

    // Right
    indices[indicesOffset++] = vertexBegin + 12;
    indices[indicesOffset++] = vertexBegin + 13;
    indices[indicesOffset++] = vertexBegin + 13;
    indices[indicesOffset++] = vertexBegin + 14;
    indices[indicesOffset++] = vertexBegin + 14;
    indices[indicesOffset++] = vertexBegin + 15;
    indices[indicesOffset++] = vertexBegin + 15;
    indices[indicesOffset++] = vertexBegin + 12;

    // Front
    indices[indicesOffset++] = vertexBegin + 16;
    indices[indicesOffset++] = vertexBegin + 17;
    indices[indicesOffset++] = vertexBegin + 17;
    indices[indicesOffset++] = vertexBegin + 18;
    indices[indicesOffset++] = vertexBegin + 18;
    indices[indicesOffset++] = vertexBegin + 19;
    indices[indicesOffset++] = vertexBegin + 19;
    indices[indicesOffset++] = vertexBegin + 16;

    // Back
    indices[indicesOffset++] = vertexBegin + 20;
    indices[indicesOffset++] = vertexBegin + 21;
    indices[indicesOffset++] = vertexBegin + 21;
    indices[indicesOffset++] = vertexBegin + 22;
    indices[indicesOffset++] = vertexBegin + 22;
    indices[indicesOffset++] = vertexBegin + 23;
    indices[indicesOffset++] = vertexBegin + 23;
    indices[indicesOffset++] = vertexBegin + 20;
  }

  /**
   * Store sphere wireframe mesh data.
   * The origin located in center of sphere.
   * @param radius - Sphere radius
   * @param vertexBegin - The min of index list
   * @param positions - position array
   * @param indices - index array
   * @param indicesOffset - index array offset
   */
  static createSphereWireframe(
    radius: number,
    vertexBegin: number,
    positions: Vector3[],
    indices: Uint16Array | Uint32Array,
    indicesOffset: number
  ): void {
    const shift = new Vector3();

    // X
    WireframePrimitive.createCircleWireframe(radius, 0, shift, vertexBegin, positions, indices, indicesOffset);

    // Y
    WireframePrimitive.createCircleWireframe(
      radius,
      1,
      shift,
      vertexBegin + WireframePrimitive.vertexCount,
      positions,
      indices,
      indicesOffset + WireframePrimitive.circleIndicesCount
    );

    // Z
    WireframePrimitive.createCircleWireframe(
      radius,
      2,
      shift,
      vertexBegin + WireframePrimitive.vertexCount * 2,
      positions,
      indices,
      indicesOffset + WireframePrimitive.circleIndicesCount * 2
    );
  }

  /**
   * Store cone wireframe mesh data.
   * The origin located in top of cone.
   * @param radius - The radius of cap
   * @param height - The height of cone
   * @param vertexBegin - The min of index list
   * @param positions - position array
   * @param indices - index array
   * @param indicesOffset - index array offset
   */
  static createConeWireframe(
    radius: number,
    height: number,
    vertexBegin: number,
    positions: Vector3[],
    indices: Uint16Array | Uint32Array,
    indicesOffset: number
  ): void {
    const shift = new Vector3();

    // Y
    shift.y = -height;
    WireframePrimitive.createCircleWireframe(radius, 1, shift, vertexBegin, positions, indices, indicesOffset);

    positions.push(new Vector3(0, height, 0));
    positions.push(new Vector3(-radius, -height, 0));
    positions.push(new Vector3(radius, -height, 0));
    positions.push(new Vector3(0, -height, radius));
    positions.push(new Vector3(0, -height, -radius));
    const indexBegin = vertexBegin + WireframePrimitive.vertexCount;
    indicesOffset += WireframePrimitive.circleIndicesCount;
    indices[indicesOffset++] = indexBegin;
    indices[indicesOffset++] = indexBegin + 1;
    indices[indicesOffset++] = indexBegin;
    indices[indicesOffset++] = indexBegin + 2;
    indices[indicesOffset++] = indexBegin;
    indices[indicesOffset++] = indexBegin + 3;
    indices[indicesOffset++] = indexBegin;
    indices[indicesOffset++] = indexBegin + 4;
  }

  /**
   * Store unbound cylinder wireframe mesh data.
   * The origin located in center of sphere.
   * @param radius - The radius
   * @param vertexBegin - The min of index list
   * @param positions - position array
   * @param indices - index array
   * @param indicesOffset - index array offset
   */
  static createUnboundCylinderWireframe(
    radius: number,
    vertexBegin: number,
    positions: Vector3[],
    indices: Uint16Array | Uint32Array,
    indicesOffset: number
  ): void {
    const height = 5;
    const shift = new Vector3();

    // Y
    WireframePrimitive.createCircleWireframe(radius, 1, shift, vertexBegin, positions, indices, indicesOffset);

    const indexBegin = vertexBegin + WireframePrimitive.vertexCount;
    indicesOffset += WireframePrimitive.circleIndicesCount;
    for (let i = 0; i < 8; i++) {
      let radian = MathUtil.degreeToRadian(45 * i);
      positions.push(new Vector3(radius * Math.cos(radian), 0, radius * Math.sin(radian)));
      positions.push(new Vector3(radius * Math.cos(radian), -height, radius * Math.sin(radian)));

      indices[indicesOffset + i * 2] = indexBegin + 2 * i;
      indices[indicesOffset + i * 2 + 1] = indexBegin + 2 * i + 1;
    }
  }

  /**
   * Store capsule wireframe mesh data.
   * The origin located in center of capsule.
   * @param radius - The radius of the two hemispherical ends
   * @param height - The height of the cylindrical part, measured between the centers of the hemispherical ends
   * @param vertexBegin - The min of index list
   * @param positions - position array
   * @param indices - index array
   * @param indicesOffset - index array offset
   */
  static createCapsuleWireframe(
    radius: number,
    height: number,
    vertexBegin: number,
    positions: Vector3[],
    indices: Uint16Array | Uint32Array,
    indicesOffset: number
  ): void {
    const circleIndicesCount = WireframePrimitive.circleIndicesCount;
    const vertexCount = WireframePrimitive.vertexCount;
    const shift = new Vector3();
    const halfHeight = height / 2;

    // Y-Top
    shift.y = halfHeight;
    WireframePrimitive.createCircleWireframe(radius, 1, shift, vertexBegin, positions, indices, indicesOffset);

    // Y-Bottom
    shift.y = -halfHeight;
    WireframePrimitive.createCircleWireframe(
      radius,
      1,
      shift,
      vertexBegin + vertexCount,
      positions,
      indices,
      indicesOffset + circleIndicesCount
    );

    // X-Elliptic
    WireframePrimitive.createEllipticWireframe(
      radius,
      halfHeight,
      2,
      vertexBegin + vertexCount * 2,
      positions,
      indices,
      indicesOffset + circleIndicesCount * 2
    );

    // Z-Elliptic
    WireframePrimitive.createEllipticWireframe(
      radius,
      halfHeight,
      0,
      vertexBegin + vertexCount * 3,
      positions,
      indices,
      indicesOffset + circleIndicesCount * 2 + WireframePrimitive.ellipticIndicesCount
    );
  }

  /**
   * Store circle wireframe mesh data.
   * @param radius - The radius
   * @param axis - The default direction
   * @param shift - The default shift
   * @param vertexBegin - The min of index list
   * @param positions - position array
   * @param indices - index array
   * @param indicesOffset - index array offset
   */
  static createCircleWireframe(
    radius: number,
    axis: number,
    shift: Vector3,
    vertexBegin: number,
    positions: Vector3[],
    indices: Uint16Array | Uint32Array,
    indicesOffset: number
  ): void {
    const vertexCount = WireframePrimitive.vertexCount;

    const twoPi = Math.PI * 2;
    const countReciprocal = 1.0 / vertexCount;
    for (let i = 0; i < vertexCount; ++i) {
      const v = i * countReciprocal;
      const thetaDelta = v * twoPi;

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
        indices[indicesOffset + 2 * i] = globalIndex;
        indices[indicesOffset + 2 * i + 1] = globalIndex + 1;
      } else {
        indices[indicesOffset + 2 * i] = globalIndex;
        indices[indicesOffset + 2 * i + 1] = vertexBegin;
      }
    }
  }

  /**
   * Store elliptic wireframe mesh data.
   * @param radius - The radius of the two hemispherical ends
   * @param height - The height of the cylindrical part, measured between the centers of the hemispherical ends
   * @param axis - The default direction
   * @param vertexBegin - The min of index list
   * @param positions - position array
   * @param indices - index array
   * @param indicesOffset - index array offset
   */
  static createEllipticWireframe(
    radius: number,
    height: number,
    axis: number,
    vertexBegin: number,
    positions: Vector3[],
    indices: Uint16Array | Uint32Array,
    indicesOffset: number
  ): void {
    const vertexCount = WireframePrimitive.vertexCount;
    const twoPi = Math.PI * 2;
    const countReciprocal = 1.0 / vertexCount;
    for (let i = 0; i < vertexCount; ++i) {
      const v = i * countReciprocal;
      const thetaDelta = v * twoPi;

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
        indices[indicesOffset + 2 * i] = globalIndex;
        indices[indicesOffset + 2 * i + 1] = globalIndex + 1;
      } else {
        indices[indicesOffset + 2 * i] = globalIndex;
        indices[indicesOffset + 2 * i + 1] = vertexBegin;
      }
    }
  }
}
