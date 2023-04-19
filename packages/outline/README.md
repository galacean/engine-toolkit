# Outline

The `Outline` tool uses an efficient method of `post-processing` to stroke entities in the scene that need to be stroked in batches, and supports strokes of different colors for entities containing children, and also supports the adjustment of stroke size.

<img src="https://gw.alipayobjects.com/zos/OasisHub/4944eb0b-46a3-4225-8d0c-92a120540e28/1673581901802-65b600a4-c5a7-43fd-b013-12461b42c496.png" alt="img" style="zoom:50%;" />

## Features

- 🔲 &nbsp;**size** - Outline size, [1~6]
- 👱🏻‍♂️ &nbsp;**mainColor** - Outline main color, used for parent entity
- 👶 &nbsp;**subColor** - Outline sub color, used for child entity

## npm

The `Outline` is published on npm with full typing support. To install, use:

```sh
$ npm install @galacean/engine-toolkit-outline
```

This will allow you to import package entirely using:

```javascript
import * as TOOLKIT from "@galacean/engine-toolkit-outline";
```

or individual classes using:

```javascript
import { OutlineManager } from "@galacean/engine-toolkit-outline";
```

## Usage

```ts
const cameraEntity = rootEntity.createChild("camera_entity");
const camera = cameraEntity.addComponent(Camera);

const outlineManager = cameraEntity.addComponent(OutlineManager);

// The entity you want to outline
outlineManager.addEntity(renderElement.component.entity);

// Clear all outline entities
outlineManager.clear();

// some configuration
outlineManager.size = 1;
outlineManager.mainColor.set(1, 1, 1, 1);
outlineManager.subColor.set(1, 1, 1, 1);
```

## Links

- [Repository](https://github.com/galacean/engine-toolkit)
- [Examples](https://oasisengine.cn/#/examples/latest/outline-postprocess)
- [Documentation](https://oasisengine.cn/#/docs/latest/cn/install)
- [API References](https://oasisengine.cn/#/api/latest/core)

## License

The engine is released under the [MIT](https://opensource.org/licenses/MIT) license. See LICENSE file.
