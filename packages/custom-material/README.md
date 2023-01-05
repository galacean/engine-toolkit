# Custom Material

The `Custom Material` toolkit provides a variety of special materials, such as infinite grids and planar shadows, etc.
However, the material of this warehouse will either rely on the control of the `Script`, or use the `multi shader pass`
to provide a factory class, or rely on special Mesh data. So each material is used in a different way.

Due to the particularity of various materials, a README document is provided under each material folder. For the
principle and usage of each material, please refer to the README document under each folder.

## Features

- ⚔️ &nbsp;**[Grid Material](src/grid)** - Infinity grid material
- 🗳 &nbsp;**[Planar Shadow Material](src/planar-shadow)** - Two-pass shadow on the planar
- 🍞 &nbsp;**[Bake PBR Material](src/bake-pbr)** - Bake texture with ibl lighting

## npm

The `Custom Material` is published on npm with full typing support. To install, use:

```sh
npm install @oasis-engine-toolkit/custom-material
```

This will allow you to import package entirely using:

```javascript
import * as TOOLKIT from "@oasis-engine-toolkit/custom-material";
```

or individual classes using:

```javascript
import { PlanarShadowShaderFactory } from "@oasis-engine-toolkit/custom-material";
```

## playground

The usage of this toolkit can be found in :

- [infinity-grid](https://github.com/ant-galaxy/oasis-engine.github.io/blob/main/playground/infinity-grid.ts)
- [infinity-grid live demo](https://oasisengine.cn/#/examples/latest/infinity-grid)
- [planar-shadow](https://github.com/ant-galaxy/oasis-engine.github.io/blob/main/playground/planar-shadow.ts)
- [planar-shadow live demo](https://oasisengine.cn/#/examples/latest/planar-shadow)

## License

The engine is released under the [MIT](https://opensource.org/licenses/MIT) license. See LICENSE file.