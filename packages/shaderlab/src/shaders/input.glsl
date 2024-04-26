// struct VertexData{
// 	vec4 position;
// 	vec3 normal;
// 	vec4 tangent;
// }

struct Attributes{
  	vec3 POSITION;

	#ifdef RENDERER_HAS_BLENDSHAPE
    	#ifndef RENDERER_BLENDSHAPE_USE_TEXTURE
    		vec3 POSITION_BS0;
    	  	vec3 POSITION_BS1;
    	  	#if defined( RENDERER_BLENDSHAPE_HAS_NORMAL ) && defined( RENDERER_BLENDSHAPE_HAS_TANGENT )
    	    	vec3 NORMAL_BS0;
    	    	vec3 NORMAL_BS1;
    	    	vec3 TANGENT_BS0;
    	    	vec3 TANGENT_BS1;
    	  	#else
    	    	#if defined( RENDERER_BLENDSHAPE_HAS_NORMAL ) || defined( RENDERER_BLENDSHAPE_HAS_TANGENT )
    	    	  vec3 POSITION_BS2;
    	    	  vec3 POSITION_BS3;

    	    	  #ifdef RENDERER_BLENDSHAPE_HAS_NORMAL
    	    	    vec3 NORMAL_BS0;
    	    	    vec3 NORMAL_BS1;
    	    	    vec3 NORMAL_BS2;
    	    	    vec3 NORMAL_BS3;
    	    	  #endif

    	    	  #ifdef RENDERER_BLENDSHAPE_HAS_TANGENT
    	    	    vec3 TANGENT_BS0;
    	    	    vec3 TANGENT_BS1;
    	    	    vec3 TANGENT_BS2;
    	    	    vec3 TANGENT_BS3;
    	    	  #endif

    	    	#else
    	    	  vec3 POSITION_BS2;
    	    	  vec3 POSITION_BS3;
    	    	  vec3 POSITION_BS4;
    	    	  vec3 POSITION_BS5;
    	    	  vec3 POSITION_BS6;
    	    	  vec3 POSITION_BS7;
    	    #endif
    	#endif
    #endif
  #endif


  #ifdef RENDERER_HAS_UV
      vec2 TEXCOORD_0;
  #endif

  #ifdef RENDERER_HAS_UV1
      vec2 TEXCOORD_1;
  #endif

  #ifdef RENDERER_HAS_SKIN
      vec4 JOINTS_0;
      vec4 WEIGHTS_0;
  #endif

  #ifdef RENDERER_ENABLE_VERTEXCOLOR
      vec4 COLOR_0;
  #endif

  #ifndef MATERIAL_OMIT_NORMAL
      #ifdef RENDERER_HAS_NORMAL
          vec3 NORMAL;
      #endif

      #ifdef RENDERER_HAS_TANGENT
          vec4 TANGENT;
      #endif
  #endif
}

struct Varyings{
	vec2 v_uv;

	#ifdef RENDERER_ENABLE_VERTEXCOLOR
  		vec4 v_color;
	#endif

	#if SCENE_FOG_MODE != 0
	    vec3 v_positionVS;
	#endif

	#ifndef MATERIAL_OMIT_NORMAL
	    #ifdef RENDERER_HAS_NORMAL
	        vec3 v_normal;
	        #if defined(RENDERER_HAS_TANGENT) && ( defined(MATERIAL_HAS_NORMALTEXTURE) || defined(MATERIAL_HAS_CLEAR_COAT_NORMAL_TEXTURE) || defined(MATERIAL_ENABLE_ANISOTROPY) )
	            mat3 v_TBN;
	        #endif
	    #endif
	#endif

	#ifdef SCENE_IS_CALCULATE_SHADOWS
	    #if SCENE_SHADOW_CASCADED_COUNT==1
	        vec3 v_shadowCoord;
	    #endif
	#endif

	#ifdef RENDERER_HAS_UV1
	    vec2 v_uv1;
	#endif
	#ifdef MATERIAL_NEED_WORLD_POS
	    vec3 v_pos;
	#endif
}

struct Temp_Attributes{
	#ifdef RENDERER_HAS_BLENDSHAPE
    	#ifndef RENDERER_BLENDSHAPE_USE_TEXTURE
    		vec3 POSITION_BS0;
    	  	vec3 POSITION_BS1;
    	  	#if defined( RENDERER_BLENDSHAPE_HAS_NORMAL ) && defined( RENDERER_BLENDSHAPE_HAS_TANGENT )
    	    	vec3 NORMAL_BS0;
    	    	vec3 NORMAL_BS1;
    	    	vec3 TANGENT_BS0;
    	    	vec3 TANGENT_BS1;
    	  	#else
    	    	#if defined( RENDERER_BLENDSHAPE_HAS_NORMAL ) || defined( RENDERER_BLENDSHAPE_HAS_TANGENT )
    	    	  vec3 POSITION_BS2;
    	    	  vec3 POSITION_BS3;

    	    	  #ifdef RENDERER_BLENDSHAPE_HAS_NORMAL
    	    	    vec3 NORMAL_BS0;
    	    	    vec3 NORMAL_BS1;
    	    	    vec3 NORMAL_BS2;
    	    	    vec3 NORMAL_BS3;
    	    	  #endif

    	    	  #ifdef RENDERER_BLENDSHAPE_HAS_TANGENT
    	    	    vec3 TANGENT_BS0;
    	    	    vec3 TANGENT_BS1;
    	    	    vec3 TANGENT_BS2;
    	    	    vec3 TANGENT_BS3;
    	    	  #endif

    	    	#else
    	    	  vec3 POSITION_BS2;
    	    	  vec3 POSITION_BS3;
    	    	  vec3 POSITION_BS4;
    	    	  vec3 POSITION_BS5;
    	    	  vec3 POSITION_BS6;
    	    	  vec3 POSITION_BS7;
    	    #endif
    	#endif
    #endif
  #endif

  vec3 POSITION;

  #ifdef RENDERER_HAS_UV
      vec2 TEXCOORD_0;
  #endif

  #ifdef RENDERER_HAS_UV1
      vec2 TEXCOORD_1;
  #endif

  #ifdef RENDERER_HAS_SKIN
      vec4 JOINTS_0;
      vec4 WEIGHTS_0;
  #endif

  #ifdef RENDERER_ENABLE_VERTEXCOLOR
      vec4 COLOR_0;
  #endif

  #ifndef MATERIAL_OMIT_NORMAL
      #ifdef RENDERER_HAS_NORMAL
          vec3 NORMAL;
      #endif

      #ifdef RENDERER_HAS_TANGENT
          vec4 TANGENT;
      #endif
  #endif
}

struct Temp_Varyings{
	#ifdef RENDERER_ENABLE_VERTEXCOLOR
  		vec4 v_color;
	#endif

	#if SCENE_FOG_MODE != 0
	    vec3 v_positionVS;
	#endif

	#ifndef MATERIAL_OMIT_NORMAL
	    #ifdef RENDERER_HAS_NORMAL
	        vec3 v_normal;
	        #if defined(RENDERER_HAS_TANGENT) && ( defined(MATERIAL_HAS_NORMALTEXTURE) || defined(MATERIAL_HAS_CLEAR_COAT_NORMAL_TEXTURE) || defined(MATERIAL_ENABLE_ANISOTROPY) )
	            mat3 v_TBN;
	        #endif
	    #endif
	#endif

	#ifdef SCENE_IS_CALCULATE_SHADOWS
	    #if SCENE_SHADOW_CASCADED_COUNT==1
	        vec3 v_shadowCoord;
	    #endif
	#endif

	vec2 v_uv;

	#ifdef RENDERER_HAS_UV1
	    vec2 v_uv1;
	#endif
	#ifdef MATERIAL_NEED_WORLD_POS
	    vec3 v_pos;
	#endif
}
