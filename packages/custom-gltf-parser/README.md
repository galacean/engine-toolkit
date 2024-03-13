# glTF custom parser

use custom glTF parser

## Usage

```ts
import { enableCustomGLTFParser } from "@galacean/engine-toolkit-custom-gltf-parser";

enableCustomGLTFParser();

// custom parser
class CustomMaterialParser extends GLTFMaterialParser {
  override parse(context: GLTFParserContext, index: number): Promise<Material> {
    console.log("custom material parser");
    let materialPromise = super.parse(context, index);
    // ...
    return materialPromise;
  }
}

class CustomTextureParser extends GLTFTextureParser {
  override parse(context: GLTFParserContext, index: number): Promise<Texture> {
    console.log("custom texture parser");
    let texturePromise = super.parse(context, index);
    // ...
    return texturePromise;
  }
}

// load
engine.resourceManager.load({
  type: AssetType.GLTF,
  url: "",
  params: {
    customParser: {
      [GLTFParserType.Material]: new CustomMaterialParser(),
      [GLTFParserType.Texture]: new CustomTextureParser()
    }
  }
});
```

## Links

- [Repository](https://github.com/galacean/engine-toolkit)
- [Documentation](https://oasisengine.cn/#/docs/latest/cn/install)
- [API References](https://oasisengine.cn/#/api/latest/core)

## License

The engine is released under the [MIT](https://opensource.org/licenses/MIT) license. See LICENSE file.
