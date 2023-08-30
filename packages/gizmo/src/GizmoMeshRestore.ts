import { ContentRestorer, ModelMesh, Vector3 } from "@galacean/engine";
import { GizmoMesh } from "./GizmoMesh";

/**
 * @internal
 */
export class GizmoMeshRestorer extends ContentRestorer<ModelMesh> {
  constructor(resource: ModelMesh, public primitiveInfo: GizmoMeshRestoreInfo) {
    super(resource);
  }

  /**
   * @override
   */
  restoreContent(): void {
    const primitiveInfo = this.primitiveInfo;
    switch (primitiveInfo.type) {
      case GizmoMeshType.Circle:
        const circleInfo = <CircleRestoreInfo>primitiveInfo;
        GizmoMesh.updateCircle(
          this.resource,
          circleInfo.startPoint,
          circleInfo.normal,
          circleInfo.thetaLength,
          circleInfo.center
        );
        break;

      case GizmoMeshType.CircleTube:
        const tubeInfo = <CircleTubeRestoreInfo>primitiveInfo;
        GizmoMesh.updateCircleTube(
          this.resource,
          tubeInfo.arc,
          tubeInfo.radius,
          tubeInfo.tubeRadius,
          tubeInfo.tubularSegments,
          tubeInfo.radialSegments
        );
        break;

      case GizmoMeshType.Line:
        const lineInfo = <LineRestoreInfo>primitiveInfo;
        GizmoMesh.updateLine(this.resource, lineInfo.points);
        break;
    }
  }
}

enum GizmoMeshType {
  Circle,
  Line,
  CircleTube
}

/**
 * @internal
 */
export class GizmoMeshRestoreInfo {
  constructor(public type: GizmoMeshType) {}
}

/**
 * @internal
 */
export class CircleRestoreInfo extends GizmoMeshRestoreInfo {
  constructor(public startPoint: Vector3, public normal: Vector3, public thetaLength: number, public center: Vector3) {
    super(GizmoMeshType.Circle);
  }
}

/**
 * @internal
 */
export class CircleTubeRestoreInfo extends GizmoMeshRestoreInfo {
  constructor(
    public arc: number,
    public radius: number,
    public tubeRadius: number,
    public tubularSegments: number,
    public radialSegments: number
  ) {
    super(GizmoMeshType.CircleTube);
  }
}

/**
 * @internal
 */
export class LineRestoreInfo extends GizmoMeshRestoreInfo {
  constructor(public points: Array<Vector3>) {
    super(GizmoMeshType.Line);
  }
}
