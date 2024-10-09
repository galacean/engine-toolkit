import { BlinnPhongMaterial, Camera, MeshRenderer, PrimitiveMesh, Vector3, WebGLEngine } from "@galacean/engine";
import { Gizmo, Group, State } from "@galacean/engine-toolkit";
import { PhysXPhysics } from "@galacean/engine-physics-physx";

document.addEventListener("pointerdown", (e) => {
  console.log("pointer down", e);
});

document.addEventListener("pointermove", (e) => {
  console.log("pointer move", e);
});

WebGLEngine.create({ canvas: "canvas", physics: new PhysXPhysics() }).then((engine) => {
  engine.canvas.resizeByClientSize();
  const scene = engine.sceneManager.activeScene;
  const rootEntity = scene.createRootEntity();

  // init camera
  const cameraEntity = rootEntity.createChild("camera");
  const camera = cameraEntity.addComponent(Camera);
  const pos = cameraEntity.transform.position;
  pos.set(10, 10, 10);
  cameraEntity.transform.position = pos;
  cameraEntity.transform.lookAt(new Vector3(0, 0, 0));

  // Initialize group for selection
  const group = new Group();

  // add gizmo
  const gizmoEntity = rootEntity.createChild("editor-gizmo");
  const gizmo = gizmoEntity.addComponent(Gizmo);
  gizmo.init(camera, group);
  gizmo.state = State.translate;

  // init light
  scene.ambientLight.diffuseSolidColor.set(1, 1, 1, 1);
  scene.ambientLight.diffuseIntensity = 1.2;

  // init cube
  const cubeEntity = rootEntity.createChild("cube");
  const renderer = cubeEntity.addComponent(MeshRenderer);
  const mtl = new BlinnPhongMaterial(engine);
  const color = mtl.baseColor;
  color.r = 0.0;
  color.g = 0.8;
  color.b = 0.5;
  color.a = 1.0;
  renderer.mesh = PrimitiveMesh.createCuboid(engine);
  renderer.setMaterial(mtl);
  group.addEntity(cubeEntity);

  engine.run();
});
