# Infinity Grid

Infinity Grid is mainly used to calibrate the infinite grid of world coordinates. The material draws in screen space so
that the mesh is visible no matter where the camera moves. Materials support drawing (x-z) planes in 3D space and (x-y)
planes in 2D space, and support interpolation transitions between these two planes. So the material also includes a
script `GridControl` to control the progress of the transform.

The rendering algorithm in 3D space can refer
to [this](http://asliceofrendering.com/scene%20helper/2020/01/05/InfiniteGrid/).

## Usage

The easiest way to use it is to directly add the script `GridControl` as a component to the scene and bind the camera.
The bound camera is mainly used to obtain various parameters of the screen space:

```ts
const grid = rootEntity.addComponent(GridControl);
grid.camera = camera;
```

Assigning values to the following properties trigger grid rotation when transformations in 2D-3D space are required.

```ts
grid.is2DGrid = true;
```

GridMaterial provides a series of parameters to control the scale and strength of the grid. You can also
control `flipProgress` to adjust the progress of 2D-3D switching.

# Showcase

- [infinity-grid](https://github.com/ant-galaxy/oasis-engine.github.io/blob/main/playground/infinity-grid.ts)
- [infinity-grid live demo](https://galacean.antgroup.com/#/examples/latest/infinity-grid)
