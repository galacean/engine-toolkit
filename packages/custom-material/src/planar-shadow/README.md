# Planar Shadow

The cascaded shadows provided by Galacean Engine have a relatively large impact on performance. For the case where the **shadow acceptor is a plane**, planar shadows can support shadow drawing with higher performance due to advantages such as not relying on the creation of Framebuffer.

## Usage

This material will actually draw the shadow caster twice, so multi shader pass is used. The factory class `PlanarShadowShaderFactory` provided here will integrate the original material of the caster and the planar shadow shader into a new material.

```ts
const renderers = new Array<MeshRenderer>();
defaultSceneRoot.getComponentsIncludeChildren(MeshRenderer, renderers);

for (let i = 0, n = renderers.length; i < n; i++) {
  const material = renderers[i].getMaterial();
  PlanarShadowShaderFactory.replaceShader(material);
  PlanarShadowShaderFactory.setShadowFalloff(material, 0.2);
  PlanarShadowShaderFactory.setPlanarHeight(material, 0.01);
  PlanarShadowShaderFactory.setLightDirection(material, lightDirection);
  PlanarShadowShaderFactory.setShadowColor(material, new Color(0, 0, 0, 1.0));
}
```

##### OR with `ShaderLab`

- Init engine with `ShaderLab`

  ```ts
  import { ShaderLab } from "@galacean/engine-shader-lab";
  // Init engine with shaderLab
  WebGLEngine.create({ canvas: "canvas", shaderLab });
  ```

- Create shader through `ShaderLab`

  ```ts
  import { PlanarShadowShaderSource } from "@galacean/engine-toolkit";

  Shader.create(PlanarShadowShaderSource);
  ```

- Replace shader

  ```ts
  const planarShadowShader = Shader.find("PlanarShadow");
  material.shader = planarShadowShader;
  ```

- Set shader uniforms

  ```ts
  const shaderData = material.shaderData;

  /**
   * Set planar height.
   */
  material.shaderData.setFloat("u_planarHeight", 0);

  /**
   * Set light direction.
   */
  shaderData.setVector3("u_lightDir", new Vector3(0, 0, 0));

  /**
   * Set shadow color
   */
  shaderData.setColor("u_planarShadowColor", new Color(1.0, 1.0, 1.0, 1.0));

  /**
   * Set Shadow falloff coefficient
   */
  shaderData.setFloat("u_planarShadowFalloff", 0);
  ```

# Showcase

- [planar-shadow](https://github.com/ant-galaxy/oasis-engine.github.io/blob/main/playground/planar-shadow.ts)
- [planar-shadow live demo](https://oasisengine.cn/#/examples/latest/planar-shadow)
