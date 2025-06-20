import {
  Camera,
  WebGLEngine,
  Vector3,
  MeshRenderer,
  PrimitiveMesh,
  PBRMaterial, Color,
  DirectLight, Script
} from "@galacean/engine";
import { OrbitControl } from "../packages/controls/src/OrbitControl";
import { GridControl } from "../packages/custom-material/src/grid/GridControl";
import { Meta } from "@storybook/html-vite";

export default {
  title: 'Toolkit/CustomMaterial',
  parameters: {
    canvas: {
      engineOptions: {
        alpha: true,
        antialias: true
      }
    }
  },
  argTypes: {
    is2DGrid: {
      control: { type: 'boolean' },
      defaultValue: false
    },
    primaryScale: {
      control: { type: 'range', min: 1, max: 20, step: 1 },
      defaultValue: 10
    },
    secondaryScale: {
      control: { type: 'range', min: 0.1, max: 5, step: 0.1 },
      defaultValue: 1
    },
    gridIntensity: {
      control: { type: 'range', min: 0, max: 1, step: 0.05 },
      defaultValue: 0.2
    },
    axisIntensity: {
      control: { type: 'range', min: 0, max: 1, step: 0.05 },
      defaultValue: 0.1
    },
    distance: {
      control: { type: 'range', min: 1, max: 50, step: 1 },
      defaultValue: 8
    }
  }
} as Meta;

/**
 * Custom control script to update grid parameters from Storybook controls
 */
class GridParameterControl extends Script {
  gridControl: GridControl;
  
  override onUpdate(): void {
    if (this.gridControl) {
      // Update grid material parameters from the gridControl
      const material = this.gridControl.material;
      if (material) {
        material.primaryScale = this.gridControl.material.primaryScale;
        material.secondaryScale = this.gridControl.material.secondaryScale;
        material.gridIntensity = this.gridControl.material.gridIntensity;
        material.axisIntensity = this.gridControl.material.axisIntensity;
      }
    }
  }
}

export const InfinityGrid = {
  args: {
    is2DGrid: false,
    primaryScale: 10,
    secondaryScale: 1,
    gridIntensity: 0.2,
    axisIntensity: 0.1,
    distance: 8
  },
  render: async (args, context) => {
    // Get engine from context
    const engine: WebGLEngine = await context.getEngine();
    engine.canvas.resizeByClientSize();
    
    const scene = engine.sceneManager.activeScene;
    const rootEntity = scene.createRootEntity();

    scene.background.solidColor = new Color(0.01, 0.01, 0.01, 1);

    // Create camera
    const cameraEntity = rootEntity.createChild("camera");
    cameraEntity.transform.setPosition(4, 4, 4);
    cameraEntity.transform.lookAt(new Vector3(0, 0, 0));
    const camera = cameraEntity.addComponent(Camera);
    camera.farClipPlane = 100;
    
    // Add OrbitControl to camera
    const orbitControl = cameraEntity.addComponent(OrbitControl);
    orbitControl.target = new Vector3(0, 0, 0);
    orbitControl.minDistance = 2;
    orbitControl.maxDistance = 50;
    
    // Add a light
    const lightEntity = rootEntity.createChild("light");
    lightEntity.transform.position = new Vector3(0, 5, 10);
    lightEntity.transform.lookAt(new Vector3(0, 0, 0));
    const directLight = lightEntity.addComponent(DirectLight);
    directLight.color = new Color(1, 1, 1, 1);
    
    // Add a sample cube to visualize the grid
    const cubeEntity = rootEntity.createChild("cube");
    cubeEntity.transform.position = new Vector3(0, 0.5, 0);
    const cubeRenderer = cubeEntity.addComponent(MeshRenderer);
    cubeRenderer.mesh = PrimitiveMesh.createCuboid(engine, 1, 1, 1);
    const material = new PBRMaterial(engine);
    material.metallic = 0.1;
    material.roughness = 0.5;
    material.baseColor = new Color(0.129, 0.8, 0.8, 1.0);
    cubeRenderer.setMaterial(material);
    
    // Create grid entity
    const gridEntity = rootEntity.createChild("grid");
    
    // Add GridControl component
    const grid = gridEntity.addComponent(GridControl);
    grid.camera = camera;
    grid.distance = args.distance;
    
    // Set grid parameters from args
    grid.material.primaryScale = args.primaryScale;
    grid.material.secondaryScale = args.secondaryScale;
    grid.material.gridIntensity = args.gridIntensity;
    grid.material.axisIntensity = args.axisIntensity;
    
    // Set 2D/3D mode
    grid.is2DGrid = args.is2DGrid;
    
    // Add parameter control script to update grid when controls change
    const paramControl = gridEntity.addComponent(GridParameterControl);
    paramControl.gridControl = grid;
    
    // Watch for changes in args and update grid parameters
    const updateGridFromArgs = () => {
      grid.material.primaryScale = args.primaryScale;
      grid.material.secondaryScale = args.secondaryScale;
      grid.material.gridIntensity = args.gridIntensity;
      grid.material.axisIntensity = args.axisIntensity;
      grid.distance = args.distance;
      grid.is2DGrid = args.is2DGrid;
    };
    
    context.watch = (newArgs) => {
      args = newArgs;
      updateGridFromArgs();
    };
    
    engine.run();
    
    return document.createElement('div');
  }
};
