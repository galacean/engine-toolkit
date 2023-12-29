# Easy Animation

`easy-animation` tool simplifies the playback of model animations by creating multiple animation layers, allowing multiple animations to be played on the same Animator. It also provides the capability to play choreographed animations within a single layer.

## npm

The `easy-animation` is published on npm with full typing support. To install, use:

```sh
npm install @galacean/engine-toolkit-easy-animation
```
```javascript
import { addAnimatorLayer, multiAnimationsTransition } from "@galacean/engine-toolkit-easy-animation";
```

## Usage

```javascript
import { addAnimatorLayer, multiAnimationsTransition } from "@alipay/galacean-toolkit-controls";
import { GLTFResource, WebGLEngine } from "@galacean/engine";
import { shuffle } from "lodash";

WebGLEngine.create({ canvas: "canvas" }).then((engine) => {
  engine.canvas.resizeByClientSize();

  const rootEntity = engine.sceneManager.activeScene.createRootEntity();

  engine.resourceManager
    .load<GLTFResource>(
      "*.gltf"
    )
    .then((gltf) => {
      rootEntity.addChild(gltf.defaultSceneRoot);
    });

  engine.run();

  const { animator, animationNames } = addAnimatorLayer(gltf.defaultSceneRoot);
  animationNames.forEach((name, idx) => {
    animator.play(name, idx);
  });

  multiAnimationsTransition({ animator, transitions: shuffle(animations), layerIndex: 0 });
});
```

## Links

- [Repository](https://github.com/galacean/runtime-toolkit)

## License

The engine is released under the [MIT](https://opensource.org/licenses/MIT) license. See LICENSE file.