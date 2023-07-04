import { CollisionUtil, MathUtil, Matrix, Plane, Quaternion, Script, Transform, Vector3 } from "@galacean/engine";
import { DynamicBoneColliderBase } from "./DynamicBoneColliderBase";
import { MathCommon } from "./MathCommon";

export enum UpdateMode {
  Normal,
  AnimatePhysics,
  UnscaledTime,
  Default
}

export enum FreezeAxis {
  None = 0,
  X = 1,
  Y = 2,
  Z = 3
}

export class DynamicBone extends Script {
  private static _tempVec1 = new Vector3();
  private static _tempVec2 = new Vector3();
  private static _tempVec3 = new Vector3();
  private static _tempQuat = new Quaternion();
  private static _tempMatrix = new Matrix();
  private static _tempPlane = new Plane();

  private static _updateCount: number = 0;
  private static _prepareFrame: number = 0;

  /// The roots of the transform hierarchy to apply physics.
  public root: Transform = null;
  public roots: Transform[] = [];

  /// Internal physics simulation rate.
  public updateRate: number = 60.0;

  public updateMode = UpdateMode.Default;

  /// How much the bones slowed down.
  public damping: number = 0.1;

  /// How much the force applied to return each bone to original orientation.
  public elasticity: number = 0.1;

  /// How much bone's original orientation are preserved.
  public stiffness: number = 0.1;

  /// How much character's position change is ignored in physics simulation.
  public inert: number = 0;

  /// How much the bones slowed down when collided.
  public friction: number = 0;

  /// Each bone can be a sphere to collide with colliders. Radius describe sphere's size.
  public radius: number = 0;

  /// If End Length is not zero, an extra bone is generated at the end of transform hierarchy.
  public endLength: number = 0;

  /// If End Offset is not zero, an extra bone is generated at the end of transform hierarchy.
  public endOffset = new Vector3();

  /// The force apply to bones. Partial force apply to character's initial pose is cancelled out.
  public gravity = new Vector3();

  /// The force apply to bones.
  public force = new Vector3();

  /// Control how physics blends with existing animation.
  public blendWeight: number = 1.0;

  /// Collider objects interact with the bones.
  public colliders: DynamicBoneColliderBase[] = [];

  /// Bones exclude from physics simulation.
  public exclusions: Transform[] = [];

  /// Constrain bones to move on specified plane.
  public freezeAxis = FreezeAxis.None;

  /// Disable physics simulation automatically if character is far from camera or player.
  public distantDisable = false;
  public referenceObject: Transform = null;
  public distanceToObject: number = 20;

  private _objectMove = new Vector3();
  private _objectPrevPosition = new Vector3();
  private _objectScale: number = 0;

  private _time: number = 0;
  private _weight: number = 1.0;
  private _distantDisabled: boolean = false;
  private _preUpdateCount: number = 0;

  private _particleTrees: ParticleTree[] = [];

  // prepare data
  private _deltaTime: number = 0;
  private _effectiveColliders: DynamicBoneColliderBase[] = [];

  public setWeight(w: number): void {
    if (this._weight != w) {
      if (w == 0) {
        this._initTransforms();
      } else if (this._weight == 0) {
        this._resetParticlesPosition();
      }
      this._weight = w;
      this.blendWeight = w;
    }
  }

  public getWeight(): number {
    return this._weight;
  }

  /**
   * @internal
   */
  override onStart(): void {
    this._setupParticles();
  }

  /**
   * @internal
   */
  override onEnable(): void {
    this._resetParticlesPosition();
  }

  /**
   * @internal
   */
  override onDisable(): void {
    this._initTransforms();
  }

  /**
   * @internal
   */
  override onPhysicsUpdate(): void {
    if (this.updateMode == UpdateMode.AnimatePhysics) {
      this._preUpdate();
    }
  }

  /**
   * @internal
   */
  override onUpdate(deltaTime: number): void {
    if (this.updateMode != UpdateMode.AnimatePhysics) {
      this._preUpdate();
    }
    DynamicBone._updateCount += 1;
  }

  /**
   * @internal
   */
  override onLateUpdate(deltaTime: number): void {
    if (this._preUpdateCount == 0) {
      return;
    }

    if (DynamicBone._updateCount > 0) {
      DynamicBone._updateCount = 0;
      DynamicBone._prepareFrame += 1;
    }

    this.setWeight(this.blendWeight);

    this._checkDistance();
    if (this._isNeedUpdate()) {
      this._prepare();
      this._updateParticles();
      this._applyParticlesToTransforms();
    }
    this._preUpdateCount = 0;
  }

  private _prepare(): void {
    this._deltaTime = this.engine.time.deltaTime;

    const transform = this.entity.transform!;
    this._objectScale = Math.abs(transform.lossyWorldScale.x);
    Vector3.subtract(transform.worldPosition, this._objectPrevPosition, this._objectMove);
    this._objectPrevPosition.copyFrom(transform.worldPosition);

    for (let i = 0; i < this._particleTrees.length; i++) {
      const pt = this._particleTrees[i];
      Vector3.transformToVec3(pt._localGravity, pt._root!.worldMatrix, pt._restGravity);

      for (let j = 0; j < pt._particles.length; j++) {
        const p = pt._particles[j];
        const transform = p._transform;
        if (transform != null) {
          p._transformPosition.copyFrom(transform.worldPosition);
          p._transformLocalPosition.copyFrom(transform.position);
          p._transformLocalToWorldMatrix.copyFrom(transform.worldMatrix);
        }
      }
    }

    this._effectiveColliders.length = 0;

    for (let i = 0; i < this.colliders.length; i++) {
      const c = this.colliders[i];
      if (c.enabled) {
        this._effectiveColliders.length = 0;
        this._effectiveColliders.push(c);

        if (c.prepareFrame != DynamicBone._prepareFrame) {
          // colliders used by many dynamic bones only prepares once
          c.prepare();
          c.prepareFrame = DynamicBone._prepareFrame;
        }
      }
    }
  }

  private _updateParticles(): void {
    if (this._particleTrees.length <= 0) {
      return;
    }

    let loop = 1;
    let timeVar: number = 1;
    const dt = this._deltaTime;

    if (this.updateMode == UpdateMode.Default) {
      if (this.updateRate > 0) {
        timeVar = dt * this.updateRate;
      }
    } else {
      if (this.updateRate > 0) {
        const frameTime = 1.0 / this.updateRate;
        this._time += dt;
        loop = 0;

        while (this._time >= frameTime) {
          this._time -= frameTime;
          loop += 1;
          if (loop >= 3) {
            this._time = 0;
            break;
          }
        }
      }
    }

    if (loop > 0) {
      for (let i = 0; i < loop; i++) {
        this._updateParticles1(timeVar, i);
        this._updateParticles2(timeVar);
      }
    } else {
      this._skipUpdateParticles();
    }
  }

  private _setupParticles(): void {
    this._particleTrees.length = 0;

    if (this.root != null) {
      this._appendParticleTree(this.root);
    }

    if (this.roots.length != 0) {
      for (let i = 0; i < this.roots.length; i++) {
        const root = this.roots[i];
        const result = this._particleTrees.find((value, index, obj) => {
          return value._root === root;
        });

        if (result !== undefined) {
          continue;
        }
        this._appendParticleTree(root);
      }
    }

    const transform = this.entity.transform!;
    this._objectScale = Math.abs(transform.lossyWorldScale.x);
    this._objectPrevPosition.copyFrom(transform.worldPosition);
    this._objectMove.set(0, 0, 0);

    for (let i = 0; i < this._particleTrees.length; i++) {
      const pt = this._particleTrees[i];
      this._appendParticles(pt, pt._root, -1, 0);
    }
    this._updateParameters();
  }

  private _updateParameters(): void {
    this.setWeight(this.blendWeight);

    for (let i = 0; i < this._particleTrees.length; i++) {
      this._updateSingleParameters(this._particleTrees[i]);
    }
  }

  private _updateSingleParameters(pt: ParticleTree): void {
    Vector3.transformToVec3(this.gravity, pt._rootWorldToLocalMatrix, pt._localGravity);

    for (let i = 0; i < pt._particles.length; i++) {
      const p = pt._particles[i];
      p._damping = this.damping;
      p._elasticity = this.elasticity;
      p._stiffness = this.stiffness;
      p._inert = this.inert;
      p._friction = this.friction;
      p._radius = this.radius;

      p._damping = MathUtil.clamp(p._damping, 0, 1);
      p._elasticity = MathUtil.clamp(p._elasticity, 0, 1);
      p._stiffness = MathUtil.clamp(p._stiffness, 0, 1);
      p._inert = MathUtil.clamp(p._inert, 0, 1);
      p._friction = MathUtil.clamp(p._friction, 0, 1);
      p._radius = Math.max(p._radius, 0);
    }
  }

  private _appendParticleTree(root: Transform): void {
    const pt = new ParticleTree();
    pt._root = root;
    Matrix.invert(root.worldMatrix, pt._rootWorldToLocalMatrix);
    this._particleTrees.push(pt);
  }

  private _appendParticles(pt: ParticleTree, b: Transform, parentIndex: number, boneLength: number): void {
    const p = new Particle();
    p._transform = b;
    p._parentIndex = parentIndex;

    if (b != null) {
      p._position.copyFrom(b.worldPosition);
      p._prevPosition.copyFrom(b.worldPosition);
      p._initLocalPosition.copyFrom(b.position);
      p._initLocalRotation.copyFrom(b.rotationQuaternion);
    } // end bone
    else {
      const pb = pt._particles[parentIndex]._transform!;
      const invertMat = new Matrix();
      Matrix.invert(pb.worldMatrix, invertMat);
      if (this.endLength > 0) {
        const ppb = pb.entity.parent;
        if (ppb != null) {
          Vector3.scale(pb.worldPosition, 2, DynamicBone._tempVec1);
          Vector3.subtract(DynamicBone._tempVec1, ppb.transform.worldPosition, DynamicBone._tempVec1);
          Vector3.transformCoordinate(DynamicBone._tempVec1, invertMat, p._endOffset);
          p._endOffset.scale(this.endLength);
        } else {
          p._endOffset.set(this.endLength, 0, 0);
        }
      } else {
        const offset = DynamicBone._tempVec1;
        Vector3.transformToVec3(this.endOffset, this.entity.transform.worldMatrix, offset);
        offset.add(pb.worldPosition);
        Vector3.transformCoordinate(offset, invertMat, p._endOffset);
      }
      const offset = DynamicBone._tempVec1;
      Vector3.transformCoordinate(p._endOffset, pb.worldMatrix, offset);
      p._position.copyFrom(offset);
      p._prevPosition.copyFrom(offset);
      p._initLocalPosition.set(0, 0, 0);
      p._initLocalRotation.set(0, 0, 0, 1);
    }

    if (parentIndex >= 0) {
      Vector3.subtract(pt._particles[parentIndex]._transform!.worldPosition, p._position, DynamicBone._tempVec1);
      boneLength += DynamicBone._tempVec1.length();
      p._boneLength = boneLength;
      pt._boneTotalLength = Math.max(pt._boneTotalLength, boneLength);
      pt._particles[parentIndex]._childCount += 1;
    }

    const index = pt._particles.length;
    pt._particles.push(p);

    if (b != null) {
      for (let i = 0; i < b.entity.children.length; i++) {
        const child = b.entity.children[i];
        let exclude = false;
        if (this.exclusions.length != 0) {
          const result = this.exclusions.find((value, index, obj) => {
            return value === child.transform;
          });
          exclude = result != undefined;
        }

        DynamicBone._tempVec1.set(0, 0, 0);
        if (!exclude) {
          this._appendParticles(pt, child.transform, index, boneLength);
        } else if (this.endLength > 0 || !Vector3.equals(this.endOffset, DynamicBone._tempVec1)) {
          this._appendParticles(pt, null, index, boneLength);
        }
      }

      if (
        b.entity.children.length == 0 &&
        (this.endLength > 0 || !Vector3.equals(this.endOffset, DynamicBone._tempVec1))
      ) {
        this._appendParticles(pt, null, index, boneLength);
      }
    }
  }

  private _isNeedUpdate(): boolean {
    return this._weight > 0 && !(this.distantDisable && this._distantDisabled);
  }

  private _preUpdate(): void {
    if (this._isNeedUpdate()) {
      this._initTransforms();
    }
    this._preUpdateCount += 1;
  }

  private _checkDistance(): void {
    if (!this.distantDisable) {
      return;
    }

    const rt = this.referenceObject;
    if (rt != null) {
      Vector3.subtract(rt.worldPosition, this.entity.transform.worldPosition, DynamicBone._tempVec1);
      const d2 = DynamicBone._tempVec1.lengthSquared();
      const disable = d2 > this.distanceToObject * this.distanceToObject;
      if (disable != this._distantDisabled) {
        if (!disable) {
          this._resetParticlesPosition();
        }
        this._distantDisabled = disable;
      }
    }
  }

  private _initTransforms(): void {
    for (let i = 0; i < this._particleTrees.length; i++) {
      this._initSingleTransforms(this._particleTrees[i]);
    }
  }

  private _initSingleTransforms(pt: ParticleTree): void {
    for (let i = 0; i < pt._particles.length; i++) {
      let p = pt._particles[i];
      let transform = p._transform;
      if (transform != null) {
        transform.position.copyFrom(p._initLocalPosition);
        transform.rotationQuaternion.copyFrom(p._initLocalRotation);
      }
    }
  }

  private _resetParticlesPosition(): void {
    for (let i = 0; i < this._particleTrees.length; i++) {
      this._resetSingleParticlesPosition(this._particleTrees[i]);
    }
    this._objectPrevPosition.copyFrom(this.entity.transform.worldPosition);
  }

  private _resetSingleParticlesPosition(pt: ParticleTree): void {
    for (let i = 0; i < pt._particles.length; i++) {
      let p = pt._particles[i];
      let transform = p._transform;
      if (transform != null) {
        p._position.copyFrom(transform.worldPosition);
        p._prevPosition.copyFrom(transform.worldPosition);
      } // end bone
      else {
        let pb = pt._particles[p._parentIndex]._transform;
        let newPosition = DynamicBone._tempVec1;
        Vector3.transformCoordinate(p._endOffset, pb!.worldMatrix, newPosition);
        p._position.copyFrom(newPosition);
        p._prevPosition.copyFrom(newPosition);
      }
      p._isCollide = false;
    }
  }

  private _updateParticles1(timeVar: number, loopIndex: number): void {
    for (let i = 0; i < this._particleTrees.length; i++) {
      this._updateSingleParticles1(this._particleTrees[i], timeVar, loopIndex);
    }
  }

  private _updateSingleParticles1(pt: ParticleTree, timeVar: number, loopIndex: number): void {
    const force = DynamicBone._tempVec1;
    force.copyFrom(this.gravity);
    const fdir = DynamicBone._tempVec2;
    Vector3.normalize(this.gravity, fdir);
    // project current gravity to rest gravity
    const scale = Math.max(Vector3.dot(pt._restGravity, fdir), 0);
    const pf = DynamicBone._tempVec2;
    Vector3.scale(fdir, scale, pf);
    force.subtract(pf); // remove projected gravity
    force.add(this.force);
    force.scale(this._objectScale * timeVar);

    // only first loop consider object move
    const objectMove = DynamicBone._tempVec3;
    if (loopIndex == 0) {
      objectMove.copyFrom(this._objectMove);
    } else {
      objectMove.set(0, 0, 0);
    }

    for (let i = 0; i < pt._particles.length; i++) {
      const p = pt._particles[i];
      if (p._parentIndex >= 0) {
        // verlet integration
        const v = DynamicBone._tempVec2;
        Vector3.subtract(p._position, p._prevPosition, v);
        objectMove.scale(p._inert);
        const rmove = objectMove;
        Vector3.add(p._position, rmove, p._prevPosition);
        let damping = p._damping;
        if (p._isCollide) {
          damping += p._friction;
          if (damping > 1) {
            damping = 1;
          }
          p._isCollide = false;
        }
        v.scale(1 - damping);
        p._position.add(v);
        p._position.add(force);
        p._position.add(rmove);
      } else {
        p._prevPosition.copyFrom(p._position);
        p._position.copyFrom(p._transformPosition);
      }
    }
  }

  private _updateParticles2(timeVar: number): void {
    for (let i = 0; i < this._particleTrees.length; i++) {
      this._updateSingleParticles2(this._particleTrees[i], timeVar);
    }
  }

  private _updateSingleParticles2(pt: ParticleTree, timeVar: number): void {
    const movePlane = DynamicBone._tempPlane;

    for (let i = 1; i < pt._particles.length; i++) {
      const p = pt._particles[i];
      const p0 = pt._particles[p._parentIndex];

      if (p._transform != null) {
        Vector3.subtract(p0._transformPosition, p._transformPosition, DynamicBone._tempVec1);
      } else {
        Vector3.transformToVec3(p._endOffset, p0._transformLocalToWorldMatrix, DynamicBone._tempVec1);
      }
      const restLen = DynamicBone._tempVec1.length();

      // keep shape
      const stiffness = MathCommon.lerp(1.0, p._stiffness, this._weight);
      if (stiffness > 0 || p._elasticity > 0) {
        const m0 = DynamicBone._tempMatrix;
        m0.copyFrom(p0._transformLocalToWorldMatrix);
        m0.elements[12] = p0._position.x;
        m0.elements[13] = p0._position.y;
        m0.elements[14] = p0._position.z;

        const restPos: Vector3 = DynamicBone._tempVec1;
        if (p._transform != null) {
          Vector3.transformToVec3(p._transformLocalPosition, m0, restPos);
        } else {
          Vector3.transformToVec3(p._endOffset, m0, restPos);
        }

        const d = DynamicBone._tempVec2;
        Vector3.subtract(restPos, p._position, d);
        d.scale(p._elasticity * timeVar);
        p._position.add(d);

        if (stiffness > 0) {
          Vector3.subtract(restPos, p._position, d);
          const len = d.length();
          const maxlen = restLen * (1 - stiffness) * 2;
          if (len > maxlen) {
            d.scale((len - maxlen) / len);
            p._position.add(d);
          }
        }
      }

      // collide
      if (this._effectiveColliders.length != 0) {
        const particleRadius = p._radius * this._objectScale;
        for (let j = 0; j < this._effectiveColliders.length; j++) {
          const c = this._effectiveColliders[j];
          p._isCollide = p._isCollide || c.collide(p._position, particleRadius);
        }
      }

      // freeze axis, project to plane
      if (this.freezeAxis != FreezeAxis.None) {
        const planeNormal = DynamicBone._tempVec1;
        const elements = p0._transformLocalToWorldMatrix.elements;
        planeNormal.x = elements[(this.freezeAxis - 1) * 4];
        planeNormal.y = elements[(this.freezeAxis - 1) * 4 + 1];
        planeNormal.z = elements[(this.freezeAxis - 1) * 4 + 2];
        planeNormal.normalize();
        movePlane.normal.copyFrom(planeNormal);
        movePlane.distance = -Vector3.dot(planeNormal, p0._position);
        planeNormal.scale(CollisionUtil.distancePlaneAndPoint(movePlane, p._position));
        p._position.subtract(planeNormal);
      }

      // keep length
      const dd = DynamicBone._tempVec1;
      Vector3.subtract(p0._position, p._position, dd);
      const leng = dd.length();
      if (leng > 0) {
        dd.scale((leng - restLen) / leng);
        p._position.add(dd);
      }
    }
  }

  private _applyParticlesToTransforms(): void {
    for (let i = 0; i < this._particleTrees.length; i++) {
      this._applySingleParticlesToTransforms(this._particleTrees[i]);
    }
  }

  private _applySingleParticlesToTransforms(pt: ParticleTree): void {
    for (let i = 1; i < pt._particles.length; i++) {
      let p = pt._particles[i];
      let p0 = pt._particles[p._parentIndex];

      // do not modify bone orientation if has more then one child
      if (p0._childCount <= 1) {
        let localPos: Vector3;
        let transform = p._transform;
        if (transform != null) {
          localPos = transform.position;
        } else {
          localPos = p._endOffset;
        }
        let v0 = DynamicBone._tempVec1;
        Vector3.transformToVec3(localPos, p0._transform!.worldMatrix, v0);
        let v1 = DynamicBone._tempVec2;
        Vector3.subtract(p._position, p0._position, v1);
        let rot = DynamicBone._tempQuat;
        MathCommon.shortestRotation(v0, v1, rot);
        Quaternion.multiply(rot, p0._transform!.worldRotationQuaternion, rot);
        p0._transform.worldRotationQuaternion.copyFrom(rot.normalize());
      }

      let transform = p._transform;
      if (transform != null) {
        transform.worldPosition.copyFrom(p._position);
      }
    }
  }

  private _skipUpdateParticles(): void {
    for (let i = 0; i < this._particleTrees.length; i++) {
      this._skipUpdateSingleParticles(this._particleTrees[i]);
    }
  }

  private _skipUpdateSingleParticles(pt: ParticleTree): void {
    for (let i = 0; i < pt._particles.length; i++) {
      let p = pt._particles[i];
      if (p._parentIndex >= 0) {
        p._prevPosition.add(this._objectMove);
        p._position.add(this._objectMove);

        let p0 = pt._particles[p._parentIndex];

        if (p._transform != null) {
          Vector3.subtract(p0._transformPosition, p._transformPosition, DynamicBone._tempVec1);
        } else {
          Vector3.transformToVec3(p._endOffset, p0._transformLocalToWorldMatrix, DynamicBone._tempVec1);
        }
        const restLen = DynamicBone._tempVec1.length();

        // keep shape
        let stiffness = MathCommon.lerp(1.0, p._stiffness, this._weight);
        if (stiffness > 0) {
          let m0 = DynamicBone._tempMatrix;
          m0.copyFrom(p0._transformLocalToWorldMatrix);
          m0.elements[12] = p0._position.x;
          m0.elements[13] = p0._position.y;
          m0.elements[14] = p0._position.z;

          let restPos: Vector3 = DynamicBone._tempVec1;
          if (p._transform != null) {
            Vector3.transformToVec3(p._transformLocalPosition, m0, restPos);
          } else {
            Vector3.transformToVec3(p._endOffset, m0, restPos);
          }

          let d = restPos;
          d.subtract(p._position);
          let len = d.length();
          let maxlen = restLen * (1 - stiffness) * 2;
          if (len > maxlen) {
            d.scale((len - maxlen) / len);
            p._position.add(d);
          }
        }

        // keep length
        let dd = DynamicBone._tempVec1;
        Vector3.subtract(p0._position, p._position, dd);
        let leng = dd.length();
        if (leng > 0) {
          dd.scale((leng - restLen) / leng);
          p._position.add(dd);
        }
      } else {
        p._prevPosition.copyFrom(p._position);
        p._position.copyFrom(p._transformPosition);
      }
    }
  }
}

class Particle {
  _transform: Transform = null;
  _parentIndex: number = 0;
  _childCount: number = 0;
  _damping: number = 0;
  _elasticity: number = 0;
  _stiffness: number = 0;
  _inert: number = 0;
  _friction: number = 0;
  _radius: number = 0;
  _boneLength: number = 0;
  _isCollide: boolean = false;

  _position = new Vector3();
  _prevPosition = new Vector3();
  _endOffset = new Vector3();
  _initLocalPosition = new Vector3();
  _initLocalRotation = new Quaternion();

  // prepare data
  _transformPosition = new Vector3();
  _transformLocalPosition = new Vector3();
  _transformLocalToWorldMatrix = new Matrix();
}

class ParticleTree {
  _root: Transform = null;
  _localGravity = new Vector3();
  _rootWorldToLocalMatrix = new Matrix();
  _boneTotalLength: number = 0;
  _particles: Particle[] = [];

  // prepare data
  _restGravity = new Vector3();
}
