# Bake PBR Material

Bake PBR is a special material based on PBR material, which basically inherits the characteristics of PBR, but does not
accept the influence of direct light. Instead, it can set a baked light map, which is sampled based on UV2, so that it
can support static batching of objects in the scene. At the same time, in order to compensate for the darker problem
caused by the loss of direct light, it supports the adjustment of exposure parameters and use ACES toneMapping to correct
the highlights.

## Feature

- shadowTexture: Bake shadow map
- ShadowIntensity: If not set shadowTexture, the real-time shadow will work as the transparent shadow, which intensity
  can be adjusted.
- Exposure: exposure to adjust the brightness of model, which will be adjusted by ACES toneMapping automatically.

## Special case

The Bake shadow map is the core attribute of this material, which enables the scene to reduce the impact of direct light
on performance while ensuring the effect of the picture. If there is UV-2 information in the model, this ShadowMap will
automatically sample according to UV-2, otherwise it will directly use UV-1 for sampling. Such a feature is intended to
support static batching of models of a scene. **But because of this automated processing, special attention needs to be
paid to the UV data, so as not to cause other problems.**

## Showcase
![FX](https://mdn.alipayobjects.com/huamei_vvspai/afts/img/A*qCqWTKokWWYAAAAAAAAAAAAADsqFAQ/original)