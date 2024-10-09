import { WebGLEngine } from "@galacean/engine";
import { OrbitControl } from "@galacean/engine-toolkit-controls";
import { describe, beforeAll, it, expect } from "vitest"

const canvasDOM = document.createElement("canvas");
canvasDOM.width = 1024;
canvasDOM.height = 1024;

describe("orbit control test", function () {
  let orbitControl: OrbitControl;
  beforeAll(async () => {
    const engine = await WebGLEngine.create({ canvas: canvasDOM });
    const node = engine.sceneManager.activeScene.createRootEntity();
    orbitControl = node.addComponent(OrbitControl);
  });

  it("constructor", () => {
    expect(orbitControl.autoRotate).to.eq(false);
    expect(orbitControl.autoRotateSpeed).to.eq(Math.PI);
  });
});
