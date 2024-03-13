# Draco

Used for glTF draco compressed mesh.

## Usage

```sh
npm install @galacean/engine-toolkit-draco
```

```javascript
import "@galacean/engine-toolkit-draco";

// load draco compressed gltf
const gltf = await engine.resourceManager.load<GLTFResource>("draco.gltf");
```

## License

The engine is released under the [MIT](https://opensource.org/licenses/MIT) license. See LICENSE file.