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
npm install @oasis-engine-toolkit/auxiliary-lines
```

This will allow you to import stats entirely using:

```javascript
import * as TOOLKIT from "@oasis-engine-toolkit/auxiliary-lines";
```

or individual classes using:

```javascript
import { WireframeManager } from "@oasis-engine-toolkit/auxiliary-lines";
```

## playground
The usage of this toolkit can be found in :
- [physics-debug-draw](https://github.com/ant-galaxy/oasis-engine.github.io/blob/main/playground/physics-debug-draw.ts)

## License

The engine is released under the [MIT](https://opensource.org/licenses/MIT) license. See LICENSE file.