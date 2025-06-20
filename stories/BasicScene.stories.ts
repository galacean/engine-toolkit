import { AmbientLight, AssetType, BackgroundMode, Camera, DirectLight, Entity, MeshRenderer, PBRMaterial, PrimitiveMesh, SkyBoxMaterial, Vector3, WebGLEngine } from "@galacean/engine";
import { OrbitControl } from "../packages/controls/src/OrbitControl";

export default {
  title: 'Basic Scene',
  parameters: {
    canvas: {
      engineOptions: {
        // Custom engine options for this story
      }
    }
  }
};

export const BasicCube = {
  render: async (args, context) => {
    // Get the engine using the convenient getEngine function
    const engine: WebGLEngine = await context.getEngine();
    
    const scene = engine.sceneManager.activeScene;

    const rootEntity = scene.createRootEntity();

    // Create camera
    const cameraNode = rootEntity.createChild("camera_node");
    cameraNode.transform.position = new Vector3(-3, 0, 3);
    cameraNode.addComponent(Camera);
    cameraNode.addComponent(OrbitControl);

    // Create sky
    const sky = scene.background.sky;
    const skyMaterial = new SkyBoxMaterial(engine);
    sky.material = skyMaterial;
    sky.mesh = PrimitiveMesh.createCuboid(engine, 1, 1, 1);

    const lightEntity = rootEntity.createChild();
    lightEntity.transform.setPosition(-5, 5, 5);
    lightEntity.transform.lookAt(new Vector3(0, 0, 0));

    // material ball
    const ball = rootEntity.createChild("ball");
    const ballRender = ball.addComponent(MeshRenderer);
    const material = new PBRMaterial(engine);
    material.metallic = 0;
    material.roughness = 0;
    ballRender.mesh = PrimitiveMesh.createSphere(engine, 1, 128);
    ballRender.setMaterial(material);

    const ambientLight = await engine.resourceManager
      .load<AmbientLight>({
        type: AssetType.Env,
        url: "https://gw.alipayobjects.com/os/bmw-prod/6470ea5e-094b-4a77-a05f-4945bf81e318.bin",
      })
    scene.ambientLight = ambientLight;
    skyMaterial.texture = ambientLight.specularTexture;
    skyMaterial.textureDecodeRGBM = true;

    engine.run();
    
    // Return empty div as the canvas is already in the container
    return document.createElement('div');
  }
};
