Shader "bake-pbr" {
  SubShader "Default" {
    UsePass "Utility/ShadowMap/Default/ShadowCaster"
    UsePass "Utility/DepthOnly/Default/DepthOnly"

    Pass "Forward Pass" {
      Tags { pipelineStage = "Forward" }

      RenderQueueType renderQueueType;
      BlendFactor sourceColorBlendFactor;
      BlendFactor destinationColorBlendFactor;
      BlendFactor sourceAlphaBlendFactor;
      BlendFactor destinationAlphaBlendFactor;
      CullMode rasterStateCullMode;
      Bool blendEnabled;
      Bool depthWriteEnabled;

      DepthState = {
        WriteEnabled = depthWriteEnabled;
      }

      BlendState = {
        Enabled = blendEnabled;
        SourceColorBlendFactor = sourceColorBlendFactor;
        DestinationColorBlendFactor = destinationColorBlendFactor;
        SourceAlphaBlendFactor = sourceAlphaBlendFactor;
        DestinationAlphaBlendFactor = destinationAlphaBlendFactor;
      }

      RasterState = {
        CullMode = rasterStateCullMode;
      }

      RenderQueueType = renderQueueType;

      VertexShader = BakePBRVertex;
      FragmentShader = BakePBRFragment;

      #include "PBR/ForwardPassPBR.glsl"

      #ifdef LIGHTMAP_TEXTURE
        sampler2D u_lightMapTexture;
        float u_lightMapIntensity;
      #endif

      Varyings BakePBRVertex(Attributes attributes) {
        return PBRVertex(attributes);
      }

      void BakePBRFragment(Varyings varyings) {
        BSDFData bsdfData;

        vec2 aoUV = varyings.uv;
        #if defined(MATERIAL_HAS_OCCLUSION_TEXTURE) && defined(RENDERER_HAS_UV1)
          if(material_OcclusionTextureCoord == 1.0){
            aoUV = varyings.uv1;
          }
        #endif

        SurfaceData surfaceData = getSurfaceData(varyings, aoUV, gl_FrontFacing);
        initBSDFData(surfaceData, bsdfData);

        vec3 totalDiffuseColor = vec3(0, 0, 0);
        vec3 totalSpecularColor = vec3(0, 0, 0);

        // Shadow
        float shadowAttenuation = 1.0;
        #if defined(SCENE_DIRECT_LIGHT_COUNT) && defined(NEED_CALCULATE_SHADOWS)
          #if SCENE_SHADOW_CASCADED_COUNT == 1
            vec3 shadowCoord = varyings.shadowCoord;
          #else
            vec3 shadowCoord = getShadowCoord(varyings.positionWS);
          #endif
          shadowAttenuation *= sampleShadowMap(varyings.positionWS, shadowCoord);
        #endif

        // Direct lighting
        evaluateDirectRadiance(varyings, surfaceData, bsdfData, shadowAttenuation, totalDiffuseColor, totalSpecularColor);

        // IBL (engine standard)
        evaluateIBL(varyings, surfaceData, bsdfData, totalDiffuseColor, totalSpecularColor);

        // Lightmap: replace/supplement IBL diffuse with baked lightmap
        #ifdef LIGHTMAP_TEXTURE
          vec2 lightMapUV = varyings.uv;
          #ifdef RENDERER_HAS_UV1
            lightMapUV = varyings.uv1;
          #endif
          totalDiffuseColor += texture2D(u_lightMapTexture, lightMapUV).rgb * u_lightMapIntensity * BRDF_Diffuse_Lambert(bsdfData.diffuseColor);
        #endif

        #ifdef MATERIAL_ENABLE_TRANSMISSION
          vec3 refractionTransmitted = evaluateTransmission(surfaceData, bsdfData);
          totalDiffuseColor = mix(totalDiffuseColor, refractionTransmitted, surfaceData.transmission);
        #endif

        vec4 color = vec4((totalDiffuseColor + totalSpecularColor).rgb, surfaceData.opacity);
        color.rgb += surfaceData.emissiveColor;

        #if SCENE_FOG_MODE != 0
          color = fog(color, varyings.positionVS);
        #endif

        gl_FragColor = color;
      }
    }
  }
}