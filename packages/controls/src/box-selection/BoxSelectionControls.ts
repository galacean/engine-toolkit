import {
  BoundingFrustum,
  Vector3,
  Matrix,
  Camera,
  Entity,
  Plane,
  CollisionUtil,
  ContainmentType,
  Script,
  InputManager,
  PointerButton,
  WebGLEngine,
  Vector2
} from "@galacean/engine";
import { BoxSelectionComponent } from "./BoxSelectionComponent";
import { BoxSelectionSSHelper } from "./BoxSelectionSSHelper";
import { IBoxSelectionHelper } from "./types";

const _frustum = new BoundingFrustum();
const _center = new Vector3();
const _tmpPoint = new Vector2();
const _vecNear = new Vector3();
const _vecTopLeft = new Vector3();
const _vecTopRight = new Vector3();
const _vecDownRight = new Vector3();
const _vecDownLeft = new Vector3();
const _vecFarTopLeft = new Vector3();
const _vecFarTopRight = new Vector3();
const _vecFarDownRight = new Vector3();
const _vecFarDownLeft = new Vector3();
const _vectemp1 = new Vector3();
const _vectemp2 = new Vector3();
const _vectemp3 = new Vector3();

const pojectInvertMatrix = new Matrix();
function unproject(vec: Vector3, entity: Entity) {
  Vector3.transformCoordinate(vec, pojectInvertMatrix, vec);
  return Vector3.transformCoordinate(vec, entity.transform.worldMatrix, vec);
}

export class BoxSelectionControls extends Script {
  startPoint: Vector2 = new Vector2();
  endPoint: Vector2 = new Vector2();
  collection: Entity[] = [];
  instances: any = {};
  deep: number = Number.MAX_VALUE;
  camera: Camera;
  selectChildren: false;
  input: InputManager;
  isDeep = true;
  helper: undefined | IBoxSelectionHelper;

  override onAwake(): void {
    const { engine, entity } = this;
    this.camera = entity.getComponent(Camera);
    this.input = engine.inputManager;
    this.helper = new BoxSelectionSSHelper(this.engine as WebGLEngine, this.scene.getRootEntity()!);
  }

  override onUpdate() {
    const p = this.input.pointers[0];
    if (!p) {
      return;
    }
    const canvas = this.engine.canvas;
    if (this.input.isPointerDown(PointerButton.Primary)) {
      const x = (p.position.x / canvas.width) * 2 - 1;
      const y = 1 - (p.position.y / canvas.height) * 2;
      this.startPoint.set(x, y);
      this.helper?.onSelectStart(p.position);
    }
    if (this.input.isPointerUp(PointerButton.Primary)) {
      const x = (p.position.x / canvas.width) * 2 - 1;
      const y = 1 - (p.position.y / canvas.height) * 2;
      this.endPoint.set(x, y);
      this.helper?.onSelectEnd(p.position);
    }
    if (this.input.isPointerHeldDown(PointerButton.Primary)) {
      const x = (p.position.x / canvas.width) * 2 - 1;
      const y = 1 - (p.position.y / canvas.height) * 2;
      this.endPoint.set(x, y);
      this.select();
      this.helper?.onSelecting(p.position);
    }
  }

  select(startPoint?: Vector2, endPoint?: Vector2) {
    this.startPoint = startPoint || this.startPoint;
    this.endPoint = endPoint || this.endPoint;
    this.collection.length = 0;

    pojectInvertMatrix.copyFrom(this.camera.projectionMatrix);
    pojectInvertMatrix.invert();
    this.updateBoundingFrustum(this.startPoint, this.endPoint);
    return this.searchChildInBoundingFrustum(_frustum, this.scene.getRootEntity()!, this.isDeep);
  }

  updateBoundingFrustum(startPoint: Vector2, endPoint: Vector2) {
    startPoint = startPoint || this.startPoint;
    endPoint = endPoint || this.endPoint;

    // Avoid invalid BoundingFrustum
    if (startPoint.x === endPoint.x) {
      endPoint.x += Number.EPSILON;
    }

    if (startPoint.y === endPoint.y) {
      endPoint.y += Number.EPSILON;
    }

    if (!this.camera.isOrthographic) {
      _tmpPoint.set(Math.min(startPoint.x, endPoint.x), Math.max(startPoint.y, endPoint.y));
      endPoint.set(Math.max(startPoint.x, endPoint.x), Math.min(startPoint.y, endPoint.y));

      this.entity.transform.worldMatrix.getTranslation(_vecNear);
      _vecTopLeft.set(_tmpPoint.x, _tmpPoint.y, 0.5);
      _vecTopRight.set(endPoint.x, _tmpPoint.y, 0);
      _vecDownRight.set(endPoint.x, endPoint.y, 0.5);
      _vecDownLeft.set(_tmpPoint.x, endPoint.y, 0);

      unproject(_vecTopLeft, this.entity);
      unproject(_vecTopRight, this.entity);
      unproject(_vecDownRight, this.entity);
      unproject(_vecDownLeft, this.entity);

      _vectemp1.copyFrom(_vecTopLeft).subtract(_vecNear);
      _vectemp2.copyFrom(_vecTopRight).subtract(_vecNear);
      _vectemp3.copyFrom(_vecDownRight).subtract(_vecNear);
      _vectemp1.normalize();
      _vectemp2.normalize();
      _vectemp3.normalize();

      _vectemp1.scale(this.deep);
      _vectemp2.scale(this.deep);
      _vectemp3.scale(this.deep);
      _vectemp1.add(_vecNear);
      _vectemp2.add(_vecNear);
      _vectemp3.add(_vecNear);

      Plane.fromPoints(_vecNear, _vecTopLeft, _vecTopRight, _frustum.top);
      Plane.fromPoints(_vecNear, _vecTopRight, _vecDownRight, _frustum.right);
      Plane.fromPoints(_vecDownRight, _vecDownLeft, _vecNear, _frustum.bottom);
      Plane.fromPoints(_vecDownLeft, _vecTopLeft, _vecNear, _frustum.left);
      Plane.fromPoints(_vecTopRight, _vecDownRight, _vecDownLeft, _frustum.near);
      Plane.fromPoints(_vectemp3, _vectemp2, _vectemp1, _frustum.far);
      _frustum.far.normal.scale(-1);
    } else {
      const left = Math.min(startPoint.x, endPoint.x);
      const top = Math.max(startPoint.y, endPoint.y);
      const right = Math.max(startPoint.x, endPoint.x);
      const down = Math.min(startPoint.y, endPoint.y);

      _vecTopLeft.set(left, top, -1);
      _vecTopRight.set(right, top, -1);
      _vecDownRight.set(right, down, -1);
      _vecDownLeft.set(left, down, -1);

      _vecFarTopLeft.set(left, top, 1);
      _vecFarTopRight.set(right, top, 1);
      _vecFarDownRight.set(right, down, 1);
      _vecFarDownLeft.set(left, down, 1);

      unproject(_vecTopLeft, this.entity);
      unproject(_vecTopRight, this.entity);
      unproject(_vecDownRight, this.entity);
      unproject(_vecDownLeft, this.entity);

      unproject(_vecFarTopLeft, this.entity);
      unproject(_vecFarTopRight, this.entity);
      unproject(_vecFarDownRight, this.entity);
      unproject(_vecFarDownLeft, this.entity);

      Plane.fromPoints(_vecTopLeft, _vecFarTopLeft, _vecFarTopRight, _frustum.top);
      Plane.fromPoints(_vecTopRight, _vecFarTopRight, _vecFarDownRight, _frustum.right);
      Plane.fromPoints(_vecFarDownRight, _vecFarDownLeft, _vecDownLeft, _frustum.bottom);
      Plane.fromPoints(_vecFarDownLeft, _vecFarTopLeft, _vecTopLeft, _frustum.left);
      Plane.fromPoints(_vecTopRight, _vecDownRight, _vecDownLeft, _frustum.near);
      Plane.fromPoints(_vecFarDownRight, _vecFarTopRight, _vecFarTopLeft, _frustum.far);
      _frustum.far.normal.scale(-1);
    }
  }

  searchChildInBoundingFrustum(frustum: BoundingFrustum, entity: Entity, isDeep: boolean = false) {
    let c = entity.getComponent(BoxSelectionComponent);
    if (c && c.enabled) {
      _center.copyFrom(entity.transform.worldPosition);
      c.isSelect = CollisionUtil.frustumContainsPoint(frustum, _center) !== ContainmentType.Disjoint;
      if (c.isSelect) {
        this.collection.push(entity);
      }
    }
    const len = entity.children.length;
    if (isDeep && len) {
      for (let x = 0; x < len; x++) {
        this.searchChildInBoundingFrustum(frustum, entity.children[x], isDeep);
      }
    }
    return this.collection;
  }
}
