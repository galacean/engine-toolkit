Shader "icon" {
  SubShader "Default" {
    Pass "Forward" {
      DepthState = {
        Enabled = false;
      }

      RasterState = {
        CullMode = CullMode.Off;
      }

      BlendState = {
        Enabled = true;
        SourceColorBlendFactor = BlendFactor.SourceAlpha;
        DestinationColorBlendFactor = BlendFactor.OneMinusSourceAlpha;
        SourceAlphaBlendFactor = BlendFactor.One;
        DestinationAlphaBlendFactor = BlendFactor.OneMinusSourceAlpha;
      }

      RenderQueueType = Transparent;

      VertexShader = vert;
      FragmentShader = frag;

      #include "ShaderLibrary/Common/Common.glsl"
      #include "ShaderLibrary/Common/Transform.glsl"
      #include "ShaderLibrary/Skin/Skin.glsl"
      #include "ShaderLibrary/Skin/BlendShape.glsl"

      vec2 u_size;
      vec4 u_pixelViewport;

      #include "ShaderLibrary/Common/Attributes.glsl"

      struct Varyings {
        vec2 v_uv;
      };

      Varyings vert(Attributes attr) {
        Varyings v;

        vec4 position = vec4(attr.POSITION, 1.0);

        #ifdef RENDERER_HAS_BLENDSHAPE
          calculateBlendShape(attr, position);
        #endif

        #ifdef RENDERER_HAS_SKIN
          mat4 skinMatrix = getSkinMatrix(attr);
          position = skinMatrix * position;
        #endif

        vec4 translation = renderer_MVPMat[3];
        translation = translation / translation.w;
        float xFactor = u_size.x / u_pixelViewport.z * 2.0;
        float yFactor = u_size.y / u_pixelViewport.w * 2.0;
        gl_Position = vec4(translation.x + xFactor * position.x, translation.y + yFactor * position.y, translation.z, 1);
        #ifdef RENDERER_HAS_UV
          v.v_uv = attr.TEXCOORD_0;
        #endif

        return v;
      }

      vec4 material_BaseColor;
      #ifdef MATERIAL_HAS_BASETEXTURE
        sampler2D material_BaseTexture;
      #endif

      void frag(Varyings v) {
        vec4 baseColor = material_BaseColor;

        #ifdef MATERIAL_HAS_BASETEXTURE
          vec4 textureColor = texture2D(material_BaseTexture, v.v_uv);
          baseColor.a *= textureColor.a;
        #endif

        #ifdef MATERIAL_IS_ALPHA_CUTOFF
          if( baseColor.a < material_AlphaCutoff ) {
            discard;
          }
        #endif

        gl_FragColor = baseColor;
      }
    }
  }
}
