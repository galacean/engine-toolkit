#ifndef VARYINGS_PBR_INCLUDED
#define VARYINGS_PBR_INCLUDED

struct Varyings{
	vec2 v_uv;
	#ifdef RENDERER_HAS_UV1
	    vec2 v_uv1;
	#endif

	#ifdef RENDERER_ENABLE_VERTEXCOLOR
  		vec4 v_color;
	#endif

	#if SCENE_FOG_MODE != 0
	    vec3 v_positionVS;
	#endif

	#ifndef MATERIAL_OMIT_NORMAL
	    #ifdef RENDERER_HAS_NORMAL
	        vec3 v_normal;
	        #ifdef RENDERER_HAS_TANGENT
				vec3 v_tangent;
				vec3 v_bitangent;
	        #endif
	    #endif
	#endif

	#ifdef MATERIAL_NEED_WORLD_POS
	    vec3 v_pos;
	#endif

		#ifdef SCENE_IS_CALCULATE_SHADOWS
	    #if SCENE_SHADOW_CASCADED_COUNT==1
	        vec3 v_shadowCoord;
	    #endif
	#endif
};


#endif