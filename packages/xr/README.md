# XR

## Feature

This tool is for use by `Galatian Editor`.

## npm

The `XR` is published on npm with full typing support. To install, use:

```sh
$ npm install @galacean/engine-toolkit-xr
```

This will allow you to import package entirely using:

```javascript
import { XROrigin, XRPlaneManager } from "@galacean/engine-toolkit-xr";
```

## Usage

```ts
// Initialize engine and `XRDevice`.
const engine = await WebGLEngine.create({ canvas: "canvas", xrDevice: new WebXRDevice()});

// ……
// Add Component
entity.addComponent(XROrigin);
entity.addComponent(XRAnchorManager);
entity.addComponent(XRImageManager);
entity.addComponent(XRPlaneManager);

```

## Links

- [Repository](https://github.com/galacean/engine-toolkit)
- [Documentation](https://galacean.antgroup.com/#/docs/latest/cn/install)
- [API References](https://galacean.antgroup.com/#/api/latest/core)

## License

The engine is released under the [MIT](https://opensource.org/licenses/MIT) license. See LICENSE file.
