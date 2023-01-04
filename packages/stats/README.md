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

The stats is published on npm with full typing support. To install, use:

```sh
npm install @oasis-engine-toolkit/stats
```

This will allow you to import stats entirely using:

```javascript
import * as Stats from "@oasis-engine-toolkit/stats";
```

or individual classes using:

```javascript
import { Stats } from "@oasis-engine-toolkit/stats";
```

## License

The engine is released under the [MIT](https://opensource.org/licenses/MIT) license. See LICENSE file.