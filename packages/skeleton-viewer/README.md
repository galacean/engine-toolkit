# Skeleton Viewer

The `Skeleton Viewer` tool can help you display all bone entities in the model, and display bone placeholders of different sizes according to the layer weight. You can also configure the size, proportion, color and other functions of the bone placeholders.

![skeleton](https://gw.alipayobjects.com/zos/OasisHub/caa47b1f-5141-4268-b98f-86d6afb48e5b/skeleton.gif)

## Features

- 🖇 &nbsp;**midStep** - Distance from connector to bone, [0~1].
- ⚖ &nbsp;**midWidthScale** -The scale of the linker.
- ⚾︎ &nbsp;**ballSize** - Ball size.
- 📉 &nbsp;**scaleFactor** - Skeleton Decrease Factor.
- ⚫️ &nbsp;**colorMin** - The min color.
- ⚪️ &nbsp;**colorMax** - The max color.

## npm

The `Outline` is published on npm with full typing support. To install, use:

```sh
$ npm install @galacean/engine-toolkit-skeleton-viewer
```

This will allow you to import package entirely using:

```javascript
import * as TOOLKIT from "@galacean/engine-toolkit-skeleton-viewer";
```

or individual classes using:

```javascript
import { SkeletonViewer } from "@galacean/engine-toolkit-skeleton-viewer";
```

## Usage

```ts
// The entity you want to show skeleton
const skeletonViewer = entity.addComponent(SkeletonViewer);

// hidden skeleton viewer
skeletonViewer.enabled = false;

// reshow skeleton viewer
skeletonViewer.enabled = true;

// destroy resource
skeletonViewer.destroy();

// some configuration
skeletonViewer.midStep = 0.2;
skeletonViewer.midWidthScale = 0.1;
skeletonViewer.ballSize = 0.1;
skeletonViewer.scaleFactor = 0.1;
skeletonViewer.colorMin.set(1, 1, 1, 1);
skeletonViewer.colorMax.set(1, 1, 1, 1);
```

## Links

- [Repository](https://github.com/galacean/engine-toolkit)
- [Examples](https://oasisengine.cn/#/examples/latest/skeleton-viewer)
- [Documentation](https://oasisengine.cn/#/docs/latest/cn/install)
- [API References](https://oasisengine.cn/#/api/latest/core)

## License

The engine is released under the [MIT](https://opensource.org/licenses/MIT) license. See LICENSE file.
