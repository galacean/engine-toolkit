# Auxiliary Lines

Auxiliary Lines toolkit to draw auxiliary frame for collider, frustum, light and bounding box.

## Features
- Camera: Camera Frustum
- Light: SpotLight, DirectLight, PointLight
- Renderer: BoundingBox of the renderer
- ColliderShape: BoxColliderShape, CapsuleColliderShape and SphereColliderShape
- Automatically update: Update auxiliary with transform modification automatically.

## npm

The `Auxiliary Lines` is published on npm with full typing support. To install, use:

```sh
npm install @galacean/engine-toolkit-auxiliary-lines
```

This will allow you to import package entirely using:

```javascript
import * as TOOLKIT from "@galacean/engine-toolkit-auxiliary-lines";
```

or individual classes using:

```javascript
import { WireframeManager } from "@galacean/engine-toolkit-auxiliary-lines";
```

## playground
The usage of this toolkit can be found in :
- [physics-debug-draw](https://github.com/ant-galaxy/oasis-engine.github.io/blob/main/playground/physics-debug-draw.ts)
- [live demo](https://oasisengine.cn/#/examples/latest/physics-debug-draw)

## Links

- [Repository](https://github.com/galacean/engine-toolkit)
- [Examples](https://oasisengine.cn/#/examples/latest/skeleton-viewer)
- [Documentation](https://oasisengine.cn/#/docs/latest/cn/install)
- [API References](https://oasisengine.cn/#/api/latest/core)

## License

The engine is released under the [MIT](https://opensource.org/licenses/MIT) license. See LICENSE file.