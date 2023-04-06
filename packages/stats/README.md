# Stats

Statistics toolkit to gather performance data

## Features
- fps: frame rate; 
- memory: CPU memory;
- drawCall: draw call count;
- triangles: triangle count;
- lines: line count;
- points: point count;
- textures: texture count;
- shaders: shader count;
- webglContext: webgl context type;

## npm

The `Stats` is published on npm with full typing support. To install, use:

```sh
npm install @galacean/engine-toolkit-stats
```

This will allow you to import stats entirely using:

```javascript
import * as Stats from "@galacean/engine-toolkit-stats";
```

or individual classes using:

```javascript
import { Stats } from "@galacean/engine-toolkit-stats";
```

If you don't want DOM panel, you can use Core directly:
```javascript
import { Core } from "@galacean/engine-toolkit-stats";
```
and call `update` manually.

## Links

- [Repository](https://github.com/galacean/engine-toolkit)
- [Examples](https://oasisengine.cn/#/examples/latest/skeleton-viewer)
- [Documentation](https://oasisengine.cn/#/docs/latest/cn/install)
- [API References](https://oasisengine.cn/#/api/latest/core)

## License

The engine is released under the [MIT](https://opensource.org/licenses/MIT) license. See LICENSE file.