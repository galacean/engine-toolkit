import {
  GLTFAnimationParser,
  GLTFBufferParser,
  GLTFEntityParser,
  GLTFMaterialParser,
  GLTFMeshParser,
  GLTFParserContext,
  GLTFParserType,
  GLTFSceneParser,
  GLTFSkinParser,
  GLTFTextureParser,
  registerGLTFParser
} from "@galacean/engine";

export function enableCustomGLTFParser() {
  const map = {
    [GLTFParserType.Scene]: GLTFSceneParser,
    [GLTFParserType.Buffer]: GLTFBufferParser,
    [GLTFParserType.Texture]: GLTFTextureParser,
    [GLTFParserType.Material]: GLTFMaterialParser,
    [GLTFParserType.Mesh]: GLTFMeshParser,
    [GLTFParserType.Entity]: GLTFEntityParser,
    [GLTFParserType.Skin]: GLTFSkinParser,
    [GLTFParserType.Animation]: GLTFAnimationParser
  };

  for (let key in map) {
    const parserType = Number(key) as GLTFParserType;
    @registerGLTFParser(parserType)
    class GLTFOverrideParser extends map[key] {
      parse(context: GLTFParserContext, index: number) {
        if (context.params.customParser?.[parserType]) {
          return context.params.customParser[parserType].parse(context, index);
        }

        return super.parse(context, index);
      }
    }
  }
}
