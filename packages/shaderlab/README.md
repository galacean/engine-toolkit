# ShaderLab-toolkit

Refactor engine builtin `pbr` shader with `ShaderLab`.

## npm

Published on npm with full typing support. To install, use:

```sh
$ npm install @galacean/engine-toolkit-shader-lab
## or
$ npm install @galacean/engine-toolkit
```

This will allow you to import package entirely using:

```javascript
import { GSLPBRMaterial } from "@galacean/engine-toolkit-shader-lab";
```

## Usage

- To use the exported functionality, you need to init `engine` with `ShaderLab`, as below:

  ```ts
  const engine = await WebGLEngine.create({
    ...
    shaderLab: new ShaderLab()
    ...
  });
  ```

- Use `GSLPBRMaterial` (implemented in shaderlab) just like normal `PBRMaterial`.

  ```ts
  const pbrMaterial = new GSLPBRMaterial(engine);
  ```

- When you instanced `GSLPBRMaterial`, several shader source fragment written in shaderlab will auto be registered, so you can use `#include` syntax in shaderlab. Or you can register pbr related shader source fragment manually with:

  ```ts
  GSLPBRMaterial.registerIncludes();
  ```
