# Gizmo

Gizmos allow mouse-controlled translation, rotation and scaling in the 3D Viewport.

There is a separate gizmo for each operation. Each gizmo can be used separately or in combination with the others.

A gizmo always has three color-coded axes: X (green), Y (blue), and Z (red). You can drag an axis with left mouse button to transform along it. The Move and Scale gizmos additionally have small colored squares for transforming along two axes in one go.

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

## Example

[Gizmo-Examples](https://oasisengine.cn/#/examples/latest/gizmo)

## npm

The `Gizmo` is published on npm with full typing support. To install, use:

```sh
$ npm install @oasis-engine-toolkit/gizmo
```

This will allow you to import package entirely using:

```javascript
import { Gizmo, Group, AnchorType, CoordinateType, State } from "oasis-engine-toolkit";
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

- [Repository](https://github.com/ant-galaxy/oasis-engine-toolkit)
- [Documentation](https://oasisengine.cn/#/docs/latest/cn/install)
- [API References](https://oasisengine.cn/#/api/latest/core)

## License

The engine is released under the [MIT](https://opensource.org/licenses/MIT) license. See LICENSE file.
