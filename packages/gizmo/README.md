# Gizmo

Gizmos allow for mouse-controlled translation, rotation, and scaling within the 3D Viewport.

There is a distinct gizmo for each operation, which can be used individually or in conjunction with one another.

Each gizmo features three color-coded axes: X (green), Y (blue), and Z (red). To transform along a specific axis, drag it with the left mouse button. The Move and Scale gizmos also have small, colored squares that allow for transforming along two axes simultaneously.

**Translate**

Show the gizmo to control the location.

**Rotate**

Show the gizmo to control the rotation.

**Scale**

Show the gizmo to control the scale. Dragging the center cube scales along all three axes.

![merge](https://mdn.alipayobjects.com/huamei_qbugvr/afts/img/A*f5lvSIAaQiAAAAAAAAAAAAAADtKFAQ/original)

## Feature

| Attributes | Meaning |
| :-- | :-- |
| `Group` | Store selection. Need to init with gizmo. |
| `AnchorType` | Gizmo Position. **Center** for at the center of the selection, **Pivot** for at the pivot point |
| `CoordinateType` | Gizmo Rotation. **Local** aligns to the selection's local space. **Global** aligns to the world space orientation |
| `State` | Gizmo State. **translate** **rotate** **scale** **all** |

| Event              | Meaning                                                                      |
| :----------------- | :--------------------------------------------------------------------------- |
| `gizmo-move-start` | Fire when gizmo moving start. Could get the triggered axis from event value. |
| `gizmo-move-end`   | Fire when gizmo moving end.                                                  |

## Example

[Gizmo-Examples](https://oasisengine.cn/#/examples/latest/gizmo)

## npm

The `Gizmo` is published on npm with full typing support. To install, use:

```sh
$ npm install @galacean/engine-toolkit-gizmo
```

This will allow you to import package entirely using:

```javascript
import { Gizmo, Group, AnchorType, CoordinateType, State } from "@galacean/engine-toolkit-gizmo";
```

## Usage

```ts
// Initialize camera entity.
const cameraEntity = rootEntity.createChild("camera");
const camera = cameraEntity.addComponent(Camera);

// Initialize group for selection
const group = new Group();

// add gizmo
const gizmoEntity = rootEntity.createChild("editor-gizmo");
const gizmo = gizmoEntity.addComponent(Gizmo);
gizmo.init(camera, group);
gizmo.state = State.translate;
```

## Links

- [Repository](https://github.com/galacean/engine-toolkit)
- [Documentation](https://oasisengine.cn/#/docs/latest/cn/install)
- [API References](https://oasisengine.cn/#/api/latest/core)

## License

The engine is released under the [MIT](https://opensource.org/licenses/MIT) license. See LICENSE file.
