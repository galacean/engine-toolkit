import { Camera, Entity, MeshRenderer, PrimitiveMesh } from "@galacean/engine";

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
    const engine = await context.getEngine();
    
    const scene = engine.sceneManager.activeScene;
    const rootEntity = scene.createRootEntity();
    
    // Create camera
    const cameraEntity = rootEntity.createChild("camera");
    cameraEntity.transform.setPosition(0, 0, 5);
    const camera = cameraEntity.addComponent(Camera);
    camera.enableFrustumCulling = true;
    
    // Create cube
    const cubeEntity = rootEntity.createChild("cube");
    const renderer = cubeEntity.addComponent(MeshRenderer);
    renderer.mesh = PrimitiveMesh.createCuboid(engine, 1, 1, 1);
    
    // Auto-rotate cube
    engine.run();
    
    // Return empty div as the canvas is already in the container
    return document.createElement('div');
  }
};
