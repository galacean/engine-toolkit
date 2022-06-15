import {
  Color,
  Engine,
  Entity,
  Layer,
  Material,
  Matrix,
  MeshRenderer,
  ModelMesh,
  PrimitiveMesh,
  Quaternion,
  RenderQueueType,
  Shader,
  SkinnedMeshRenderer,
  Vector3
} from "oasis-engine";
let skeletonMaterial: Material = null;

export class SkeletonViewer {
  engine: Engine;
  debugMesh: MeshRenderer[] = [];
  skin: SkinnedMeshRenderer;

  // Config
  midStep: number = 0.2;
  midWidthScale: number = 0.1;
  ballSize: number = 0.25;
  scaleFactor: number = 0.85;
  colorMin: Color = new Color(0.35, 0.35, 0.35, 1);
  colorMax: Color = new Color(0.7, 0.7, 0.7, 1);

  constructor(engine: Engine, skin: SkinnedMeshRenderer) {
    this.engine = engine;
    this.skin = skin;
    if (!skeletonMaterial) {
      skeletonMaterial = this._createSkeletonMaterial(engine);
    }
    if (!this.skin.jointNodes) {
      this.skin.update(0);
    }
  }

  update(): void {
    this.destroy();
    this._showSkeleton();
  }

  destroy(): void {
    for (let i = 0, length = this.debugMesh.length; i < length; i++) {
      this.debugMesh[i].destroy();
    }
    this.debugMesh.length = 0;
  }

  private _createSpur(direction: Vector3): ModelMesh {
    const mesh = new ModelMesh(this.engine);
    const length = direction.length();
    const midLength = this.midStep * length;
    const midHalfWidth = length * this.midWidthScale;

    const positions: Vector3[] = new Array(24);
    const normals: Vector3[] = new Array(24);

    const matrix = new Matrix();
    const quaternion = new Quaternion();
    Matrix.lookAt(new Vector3(0, 0, 0), direction, new Vector3(0, 1, 0), matrix);
    matrix.getRotation(quaternion).invert();

    const vertex = [
      new Vector3(midHalfWidth, -midHalfWidth, -midLength).transformByQuat(quaternion),
      new Vector3(midHalfWidth, midHalfWidth, -midLength).transformByQuat(quaternion),
      new Vector3(-midHalfWidth, midHalfWidth, -midLength).transformByQuat(quaternion),
      new Vector3(-midHalfWidth, -midHalfWidth, -midLength).transformByQuat(quaternion),
      new Vector3(0, 0, -length).transformByQuat(quaternion),
      new Vector3(0, 0, 0)
    ];

    positions[0] = new Vector3(0, 0, 0);
    positions[1] = vertex[0].clone();
    positions[2] = vertex[1].clone();
    positions[3] = new Vector3(0, 0, 0);
    positions[4] = vertex[1].clone();
    positions[5] = vertex[2].clone();
    positions[6] = new Vector3(0, 0, 0);
    positions[7] = vertex[2].clone();
    positions[8] = vertex[3].clone();
    positions[9] = new Vector3(0, 0, 0);
    positions[10] = vertex[3].clone();
    positions[11] = vertex[0].clone();

    positions[12] = vertex[0].clone();
    positions[13] = vertex[4].clone();
    positions[14] = vertex[1].clone();
    positions[15] = vertex[1].clone();
    positions[16] = vertex[4].clone();
    positions[17] = vertex[2].clone();
    positions[18] = vertex[2].clone();
    positions[19] = vertex[4].clone();
    positions[20] = vertex[3].clone();
    positions[21] = vertex[3].clone();
    positions[22] = vertex[4].clone();
    positions[23] = vertex[0].clone();

    normals[0] = normals[1] = normals[2] = new Vector3(1, 0, 1).transformByQuat(quaternion);
    normals[3] = normals[4] = normals[5] = new Vector3(0, 1, 1).transformByQuat(quaternion);
    normals[6] = normals[7] = normals[8] = new Vector3(-1, 0, 1).transformByQuat(quaternion);
    normals[9] = normals[10] = normals[11] = new Vector3(0, -1, 1).transformByQuat(quaternion);
    normals[12] = normals[13] = normals[14] = new Vector3(1, 0, -1).transformByQuat(quaternion);
    normals[15] = normals[16] = normals[17] = new Vector3(0, 1, -1).transformByQuat(quaternion);
    normals[18] = normals[19] = normals[20] = new Vector3(-1, 0, -1).transformByQuat(quaternion);
    normals[21] = normals[22] = normals[23] = new Vector3(0, -1, -1).transformByQuat(quaternion);

    const { bounds } = mesh;
    const { min, max } = bounds;
    min.setValue(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
    max.setValue(-Number.NEGATIVE_INFINITY, -Number.NEGATIVE_INFINITY, -Number.NEGATIVE_INFINITY);

    for (let i = 0; i < 6; i++) {
      const position = vertex[i];
      Vector3.min(min, position, min);
      Vector3.max(max, position, max);
    }

    mesh.setPositions(positions);
    mesh.setNormals(normals);

    mesh.uploadData(true);
    mesh.addSubMesh(0, 24);
    return mesh;
  }

  private _createSkeletonMaterial(engine: Engine): Material {
    let shader: Shader;
    if (!(shader = Shader.find("skeleton-viewer"))) {
      shader = Shader.create(
        "skeleton-viewer",
        `
        attribute vec3 POSITION;
        attribute vec3 NORMAL;
      
        uniform mat4 u_MVPMat;
        uniform mat4 u_normalMat;
      
        varying vec3 v_normal;
      
        void main(){
            gl_Position = u_MVPMat * vec4( POSITION , 1.0 );;
            v_normal = normalize( mat3(u_normalMat) * NORMAL );
        }`,
        `
            uniform vec3 u_colorMin;
            uniform vec3 u_colorMax;
            varying vec3 v_normal;
      
            void main(){
              float ndl = dot(v_normal, vec3(0,1,0)) * 0.5 + 0.5;
              vec3 diffuse = mix(u_colorMin, u_colorMax, ndl);
              gl_FragColor = vec4(diffuse,1);
            }
            `
      );
    }
    const material = new Material(engine, shader);
    material.renderState.rasterState.depthBias = -100000000;
    material.renderQueueType = RenderQueueType.Transparent + 1;
    material.shaderData.setColor("u_colorMin", this.colorMin);
    material.shaderData.setColor("u_colorMax", this.colorMax);

    return material;
  }

  private _showSkeleton(): void {
    const joints = this.skin.jointNodes;

    const spheres: Entity[][] = [];

    let maxLength = 0;

    for (let i = 0; i < joints.length; i++) {
      const joint = joints[i];
      const anchorPoint = joint.transform.worldPosition;

      // 球
      const entity = joint.createChild();
      const renderer = entity.addComponent(MeshRenderer);
      renderer.mesh = PrimitiveMesh.createSphere(this.engine, this.ballSize, 16);
      renderer.setMaterial(skeletonMaterial);

      spheres.push([entity, joint]);

      // @ts-ignore
      renderer._debug = true;
      this.debugMesh.push(renderer);

      entity.layer = Layer.Layer1;

      // 连接体
      for (let j = 0; j < joint.childCount; j++) {
        const child = joint.children[j];
        const childPoint = child.transform.worldPosition;
        const absoluteDirection = childPoint.clone().subtract(anchorPoint);
        const direction = child.transform.position;
        const distance = absoluteDirection.length();

        if (distance > maxLength) {
          maxLength = distance;
        }

        const entity = joint;
        const renderer = entity.addComponent(MeshRenderer);
        renderer.setMaterial(skeletonMaterial);
        renderer.mesh = this._createSpur(direction);

        entity.layer = Layer.Layer2;

        // @ts-ignore
        renderer._debug = true;
        this.debugMesh.push(renderer);
      }
    }

    // 调整球大小
    for (let i = 0; i < spheres.length; i++) {
      const sphere = spheres[i][0];
      const joint = spheres[i][1];

      let base = joint;
      let count = 0;

      while (base.parent) {
        count++;
        base = base.parent;
      }

      const scale = 0.5 * maxLength * Math.pow(this.scaleFactor, count);
      const worldScale = sphere.transform.lossyWorldScale;
      sphere.transform.setScale(scale / worldScale.x, scale / worldScale.y, scale / worldScale.z);
    }
  }
}
