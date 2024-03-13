# Dynamic Bone

Dynamic bones are generally used to add physics-based animation to character animation, and can be used for hair,
ribbons, tails, and even clothing. Enhanced effects of original character animation.

Although spring motion can also be realized with a physics engine such as PhysX, dynamic bones generally need to
customize some motion curves to meet artistic needs. Therefore, this repository implements a custom small physics engine
to meet this requirement. This physics engine only implements particle-based spring animation, plus Capsule, Sphere,
and Plane colliders.

## Features

- Dynamic Bone: Spring movement
- Sphere Collider
- Capsule Collider
- Plane Collider

## npm

The `Dynamic bones` is published on npm with full typing support. To install, use:

```sh
npm install @galacean/engine-toolkit-dynamic-bone
```

This will allow you to import package entirely using:

```javascript
import * as TOOLKIT from "@galacean/engine-toolkit-dynamic-bone";
```

or individual classes using:

```javascript
import { DynamicBone } from "@galacean/engine-toolkit-dynamic-bone";
```

## Links

- [Repository](https://github.com/galacean/engine-toolkit)
- [Documentation](https://oasisengine.cn/#/docs/latest/cn/install)
- [API References](https://oasisengine.cn/#/api/latest/core)

## License

The engine is released under the [MIT](https://opensource.org/licenses/MIT) license. See LICENSE file.