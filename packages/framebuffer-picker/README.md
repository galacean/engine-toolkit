# Framebuffer Picker

The `Framebuffer Picker` tool using GPU frame picking technology, it can judge whether a certain model is clicked at the pixel level, and return information such as the material and mesh of the picked entity.

![frame picker](https://gw.alipayobjects.com/zos/OasisHub/14e66eda-9abc-4cc5-b6f2-1d0c47660986/frame.gif)

## npm

The `Outline` is published on npm with full typing support. To install, use:

```sh
$ npm install @galacean/engine-toolkit-framebuffer-picker
```

This will allow you to import package entirely using:

```javascript
import * as TOOLKIT from "@galacean/engine-toolkit-framebuffer-picker";
```

or individual classes using:

```javascript
import { FramebufferPicker } from "@galacean/engine-toolkit-framebuffer-picker";
```

## Usage

```ts
class ClickScript extends Script {
  onUpdate(): void {
    const inputManager = this.engine.inputManager;
    const { pointers } = inputManager;
    if (pointers && inputManager.isPointerDown(PointerButton.Primary)) {
      if (pointers.length > 0) {
        const pointerPosition = pointers[0].position;
        framebufferPicker.pick(pointerPosition.x, pointerPosition.y).then((renderElement) => {
          if (renderElement) {
            // ... picked element
          } else {
            // ... no picked element
          }
        });
      }
    }
  }
}

cameraEntity.addComponent(ClickScript);

const framebufferPicker = rootNode.addComponent(FramebufferPicker);
framebufferPicker.camera = camera;
```

## Links

- [Repository](https://github.com/galacean/engine-toolkit)
- [Examples](https://oasisengine.cn/#/examples/latest/framebuffer-picker)
- [Documentation](https://oasisengine.cn/#/docs/latest/cn/install)
- [API References](https://oasisengine.cn/#/api/latest/core)

## License

The engine is released under the [MIT](https://opensource.org/licenses/MIT) license. See LICENSE file.
