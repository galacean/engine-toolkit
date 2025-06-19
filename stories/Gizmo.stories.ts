
import {
  Camera,
  MeshRenderer,
  PrimitiveMesh,
  Vector3,
  WebGLEngine,
  DirectLight,
  BlinnPhongMaterial,
  Color,
  Layer
} from "@galacean/engine";
import { Gizmo, Group, State } from "../packages/gizmo/src";
import { OrbitControl } from "../packages/controls/src";
import { Meta } from "@storybook/html-vite";

export default {
  title: 'Toolkit/Gizmo',
  parameters: {
    canvas: {
      engineOptions: {
        alpha: true,
        antialias: true
      }
    }
  },
  argTypes: {
    gizmoState: {
      control: { type: 'select' },
      options: ['translate', 'rotate', 'scale', 'all'],
      mapping: {
        'translate': State.translate,
        'rotate': State.rotate,
        'scale': State.scale,
        'all': State.all,
        'translateYZ': State.translateYZ
      },
      defaultValue: 'translate'
    },
    gizmoSize: {
      control: { type: 'range', min: 0, max: 2, step: 0.1 },
      defaultValue: 2
    }
  }
} as Meta;

export const GizmoDemo = {
  args: {
    gizmoState: "translate",
    gizmoSize: 2
  },
  render:async (args, context) => {
    const engine: WebGLEngine = await context.getEngine();

    engine.canvas.resizeByClientSize(window.devicePixelRatio)
    
    const scene = engine.sceneManager.activeScene;
    const rootEntity = scene.createRootEntity("root");

    const cameraEntity = rootEntity.createChild("camera");
    cameraEntity.transform.setPosition(4, 4, 4);
    cameraEntity.transform.lookAt(new Vector3(0, 0, 0));
    const camera = cameraEntity.addComponent(Camera);
    camera.enableFrustumCulling = true;

    // const orbitControl = cameraEntity.addComponent(OrbitControl);
    // orbitControl.target = new Vector3(0, 0, 0);
    // orbitControl.minDistance = 2;
    // orbitControl.maxDistance = 50;

    
    const lightEntity = rootEntity.createChild("light");
    lightEntity.transform.setPosition(1, 3, 2);
    lightEntity.transform.lookAt(new Vector3(0, 0, 0));
    const light = lightEntity.addComponent(DirectLight);
    light.color = new Color(1, 1, 1, 1).toLinear(new Color());
    
    const cubeEntity = rootEntity.createChild("cube");
    const renderer = cubeEntity.addComponent(MeshRenderer);
    cubeEntity.layer = Layer.Layer22;
    renderer.mesh = PrimitiveMesh.createCuboid(engine, 1, 1, 1);
    
    const material = new BlinnPhongMaterial(engine);
    material.baseColor = new Color(0.7, 0.3, 0.3, 1.0).toLinear(new Color());
    renderer.setMaterial(material);
    
    const group = new Group();

    
    const gizmoEntity = rootEntity.createChild("editor-gizmo");
    gizmoEntity.layer = Layer.Layer31;

    const gizmo = gizmoEntity.addComponent(Gizmo);

    gizmo.init(camera, group);

    group.addEntity(cubeEntity)
    gizmo.state = args.gizmoState;
    gizmo.size = args.gizmoSize;

    engine.on("gizmo-move-start", (axis) => {
      console.log(`Gizmo move started on axis: ${axis}`);
    });
    
    engine.on("gizmo-move-end", () => {
      console.log("Gizmo move ended");
    });
    
    const updateGizmo = () => {
      gizmo.state = args.gizmoState;
      gizmo.size = args.gizmoSize;
    };
    
    context.watch = (newArgs) => {
      args = newArgs;
      updateGizmo();
    };
    
    engine.run();
    
    return document.createElement('div');
  }
};

