Shader "pbr_shaderlab.gs" {
  SubShader "Default" {
    Pass "Forward" {
      Tags { pipelineStage = "Forward"} 

      #define IS_METALLIC_WORKFLOW

      #include "attrib.glsl"
      #include "varying.glsl"

      #include "common.glsl"
      #include "common_vert.glsl"
      #include "blendShape_input.glsl"
      #include "ShadowVertexDeclaration.glsl"
      #include "camera_declare.glsl"

      // fragment uniforms
      #include "FogFragmentDeclaration.glsl"
      #include "light_frag_define.glsl"
      #include "pbr_frag_define.glsl"
      #include "pbr_helper.glsl"

      VertexShader = pbrVert;
      FragmentShader = pbrFrag;

      _galacean_v2f pbrVert(_galacean_a2v attr) {
        _galacean_v2f v;

        #include "begin_position_vert.glsl"
        #include "begin_normal_vert.glsl"
        #include "blendShape_vert.glsl"
        #include "skinning_vert.glsl"
        #include "uv_vert.glsl"
        #include "color_vert.glsl"
        #include "normal_vert.glsl"
        #include "worldpos_vert.glsl"
        #include "position_vert.glsl"

        #include "ShadowVertex.glsl"
        #include "FogVertex.glsl"

        return v;
      }

      void pbrFrag(_galacean_v2f v) {
        #include "pbr_frag.glsl"
        #include "FogFragment.glsl"

        #ifndef ENGINE_IS_COLORSPACE_GAMMA
            gl_FragColor = linearToGamma(gl_FragColor);
        #endif
      }
    }
  }
}
