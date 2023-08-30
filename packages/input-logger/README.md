# Input Logger

Input Logger outputs `keyboard` and `pointer` information in real time for developers.

## Feature

| Attributes | Meaning |
| :-- | :-- |
| `scale` |  The display size of the log. | 
| `offset` | Display position offset, specified in normalized. |
| `color` | The display color of the log. |
| `layer` | Input Logger layer, default Layer25. Ensure this layer is not taken |
| `scene` | Effective scene. |
| `showPointer` | Whether to display pointer information. |
| `showKeyBoard` | Whether to display keyboard information. |

## npm

The `Input Logger` is published on npm with full typing support. To install, use:

```sh
$ npm install @galacean/engine-toolkit-input-logger
```

This will allow you to import package entirely using:

```javascript
import { InputLogger } from "@galacean/engine-toolkit-input-logger";
```

## Usage

```ts
// Initialize engine and scene.
const engine = await WebGLEngine.create({ canvas: "canvas" });

// Initialize input logger.
new InputLogger(engine);
```

## Links

- [Repository](https://github.com/galacean/engine-toolkit)
- [Documentation](https://galacean.antgroup.com/#/docs/latest/cn/install)
- [API References](https://galacean.antgroup.com/#/api/latest/core)

## License

The engine is released under the [MIT](https://opensource.org/licenses/MIT) license. See LICENSE file.
