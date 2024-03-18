# Camera Controls

The `Camera Controls`, as the name implies, is a component that is used with the camera to display the 3D scene. This type of component customizes the corresponding parameters according to different functions, and controls the display of the 3D scene by affecting the properties of the camera.

## Category

### OrbitControl

`OrbitControl` is used to simulate orbital interaction, suitable for 360 rotation interaction around a target object, be sure to add the `OrbitControl` after adding the Camera component.

![merge](https://user-images.githubusercontent.com/7768919/212805592-ebfc6226-62f5-4b9a-9526-952dc84b6693.gif)

#### Feature

| Attributes | Meaning |
| :-- | :-- |
| `target` | Observation point |
| `autoRotate` | Whether to rotate automatically, the default is `false`, the rotation speed can be adjusted by autoRotateSpeed |
| `autoRotateSpeed` | Speed ​​of automatic rotation |
| `enableDamping` | Whether to enable camera damping, the default is `true` |
| `dampingFactor` | Rotation damping parameter, default is `0.1` |
| `enableKeys` | Whether to support keyboard operation (up, down, left, and right keys) |
| `enablePan` | Whether to support camera translation, the default is `true` |
| `keyPanSpeed` | The amplitude of the operation when the keyboard is continuously pressed |
| `enableRotate` | Whether to support camera rotation, the default is `true` |
| `rotateSpeed` | Camera rotation speed, the default is `1.0` |
| `enableZoom` | Whether to support camera zoom, the default is `true` |
| `minAzimuthAngle` | When `onUpdate`, the minimum radian of a reasonable range for horizontal operation, the default is negative infinity |
| `maxAzimuthAngle` | When `onUpdate`, the maximum radian of the reasonable range of horizontal operation, the default is positive infinity |
| `minDistance` | When `onUpdate`, the minimum value of the reasonable range of distance operation is judged |
| `maxDistance` | When `onUpdate`, the maximum value of the reasonable range of distance operation judged |
| `minPolarAngle` | When `onUpdate`, the minimum arc within a reasonable range of vertical operation |
| `maxPolarAngle` | When `onUpdate`, the maximum arc within a reasonable range of vertical operation |

#### Example

[OrbitControl-Examples](https://oasisengine.cn/#/examples/latest/gltf-basic)

### FreeControl

`FreeControl` are generally used for roaming control, often in game scenes, be sure to add the `FreeControl` after adding the Camera component.

![merge](https://user-images.githubusercontent.com/7768919/212805777-9ceb676e-3c27-4880-962c-3be224dcc7c1.gif)

#### Feature

| Attributes      | Meaning                                                                |
| :-------------- | :--------------------------------------------------------------------- |
| `floorMock`     | Whether to simulate the ground, the default is `true`                  |
| `floorY`        | Use with `floorMock` to declare the location information of the ground |
| `movementSpeed` | Speed ​​of movement                                                    |
| `rotateSpeed`   | Speed ​​of rotation                                                    |

#### Example

[FreeControl-Examples](https://oasisengine.cn/#/examples/latest/controls-free)

### OrthoControl

`OrthoControl` are generally used to control zoom and displacement in 2D scenes.

#### Feature

| Attributes  | Meaning    |
| :---------- | :--------- |
| `zoomSpeed` | Zoom Speed |

#### Example

[OrthoControl-Examples](https://oasisengine.cn/#/examples/latest/ortho-control)

![merge](https://user-images.githubusercontent.com/7768919/212807005-cba34313-1750-47e9-9855-fe7e6f8df148.gif)

### BoxSelectionControls

`BoxSelectionControls` is generally used in editor or RTS games to draw a rectangle on the screen and find objects in it.

https://user-images.githubusercontent.com/7953802/250814033-073aee92-cd8d-489e-8e89-d3cbeb26ee84.mov


## npm

The `Control` is published on npm with full typing support. To install, use:

```sh
$ npm install @galacean/engine-toolkit-controls
```

This will allow you to import package entirely using:

```javascript
import * as Controls from "@galacean/engine-toolkit-controls";
```

or individual classes using:

```javascript
import { OrthoControl } from "@galacean/engine-toolkit-controls";
```

## Usage

```ts
import { OrbitControl } from "@galacean/engine-toolkit-controls";

// Create engine
const engine = await WebGLEngine.create({ canvas: "canvas" });
engine.canvas.resizeByClientSize();

// Initialize root
const rootEntity = engine.sceneManager.activeScene.createRootEntity();

// Initialize camera entity
const cameraEntity = rootEntity.createChild("camera");
cameraEntity.addComponent(Camera);
// Add OrbitControl
cameraEntity.addComponent(OrbitControl);
```

## Links

- [Repository](https://github.com/galacean/engine-toolkit)
- [Documentation](https://oasisengine.cn/#/docs/latest/cn/install)
- [API References](https://oasisengine.cn/#/api/latest/core)

## License

The engine is released under the [MIT](https://opensource.org/licenses/MIT) license. See LICENSE file.
