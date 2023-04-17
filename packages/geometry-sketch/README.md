# Geometry Sketch

The core of the `Geometry sketch toolkit` is to upload the entire `ModelMesh` as a texture to the GPU, thereby converting
the vertex shader into a parallel computing core that processes grid data, thereby achieving a capability similar to
that of a geometry shader. Special shaders for drawing mesh auxiliary views such as **normals, tangents, and wireframes
are provided in the repository**, and other geometry drawing shaders that rely on mesh data can also be easily extended.

## Features

- NormalMaterial: Draw mesh normal line
- TangentMaterial: Draw mesh tangent line
- BiTangentMaterial: Draw mesh bi-tangent line
- WireframeMaterial: Draw mesh wireframe

You can define your own specific shader by using:
```glsl
${geometryTextureDefine}

void main() {
    int pointIndex = gl_VertexID / 2;
    ${geometryTextureVert}
}
```
Then your own shader can access all model mesh info in the vertex shader include morph and skin.

## npm

The `Geometry Sketch` is published on npm with full typing support. To install, use:

```sh
npm install @galacean/engine-toolkit-geometry-sketch
```

This will allow you to import package entirely using:

```javascript
import * as TOOLKIT from "@galacean/engine-toolkit-geometry-sketch";
```

or individual classes using:

```javascript
import { SketchRenderer } from "@galacean/engine-toolkit-geometry-sketch";
```

## playground

The usage of this toolkit can be found in :

- [geometry-sketch](https://github.com/ant-galaxy/oasis-engine.github.io/blob/main/playground/geometry-sketch.ts)
- [live demo](https://oasisengine.cn/#/examples/latest/geometry-sketch)

## Links

- [Repository](https://github.com/galacean/engine-toolkit)
- [Examples](https://oasisengine.cn/#/examples/latest/skeleton-viewer)
- [Documentation](https://oasisengine.cn/#/docs/latest/cn/install)
- [API References](https://oasisengine.cn/#/api/latest/core)

## License

The engine is released under the [MIT](https://opensource.org/licenses/MIT) license. See LICENSE file.