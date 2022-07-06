import { Entity, Component, SkinnedMeshRenderer, Shader, Material, RenderQueueType, Color } from "oasis-engine";
import { SkeletonViewer } from "./SkeletonViewer";

Shader.create(
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

export class SkeletonManager extends Component {
  private _skeletonViewer: SkeletonViewer[] = [];
  material: Material;

  // Config
  midStep: number = 0.2;
  midWidthScale: number = 0.1;
  ballSize: number = 0.25;
  scaleFactor: number = 0.85;
  colorMin: Color = new Color(0.35, 0.35, 0.35, 1);
  colorMax: Color = new Color(0.7, 0.7, 0.7, 1);

  constructor(entity: Entity) {
    super(entity);

    const material = new Material(entity.engine, Shader.find("skeleton-viewer"));
    material.renderState.rasterState.depthBias = -100000000;
    material.renderQueueType = RenderQueueType.Transparent;
    material.shaderData.setColor("u_colorMin", this.colorMin);
    material.shaderData.setColor("u_colorMax", this.colorMax);
    this.material = material;
  }

  showSkin(entity: Entity) {
    this.clear();
    const skinnedMeshRenderers = [];
    entity.getComponentsIncludeChildren(SkinnedMeshRenderer, skinnedMeshRenderers);

    for (let i = 0; i < skinnedMeshRenderers.length; i++) {
      const renderer = skinnedMeshRenderers[i];
      if (renderer.skin) {
        const viewer = new SkeletonViewer(this.engine, renderer, this);
        this._skeletonViewer.push(viewer);
        viewer.update();
      }
    }
  }

  clear() {
    for (let i = 0, length = this._skeletonViewer.length; i < length; i++) {
      this._skeletonViewer[i].destroy();
    }
    this._skeletonViewer.length = 0;
  }

  onDestroy() {
    this.clear();
  }
}
