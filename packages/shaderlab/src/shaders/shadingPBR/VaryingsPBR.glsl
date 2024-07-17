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

	vec3 v_pos;

	#if SCENE_FOG_MODE != 0
	    vec3 v_positionVS;
	#endif

	#ifdef RENDERER_HAS_NORMAL
	    vec3 v_normal;
	    #ifdef RENDERER_HAS_TANGENT
			vec3 v_tangent;
			vec3 v_bitangent;
	    #endif
	#endif


	#if defined(NEED_CALCULATE_SHADOWS) && (SCENE_SHADOW_CASCADED_COUNT == 1)
	    vec3 v_shadowCoord;
	#endif
};


#endif