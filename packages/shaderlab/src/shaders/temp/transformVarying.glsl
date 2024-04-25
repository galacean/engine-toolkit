
#ifdef RENDERER_ENABLE_VERTEXCOLOR
	temp_varyings.v_color = v.v_color;
#endif

#if SCENE_FOG_MODE != 0
    temp_varyings.v_positionVS = v.v_positionVS;
#endif

#ifndef MATERIAL_OMIT_NORMAL
    #ifdef RENDERER_HAS_NORMAL
        temp_varyings.v_normal = v.v_normal;
        #if defined(RENDERER_HAS_TANGENT) && ( defined(MATERIAL_HAS_NORMALTEXTURE) || defined(MATERIAL_HAS_CLEAR_COAT_NORMAL_TEXTURE) || defined(MATERIAL_ENABLE_ANISOTROPY) )
            temp_varyings.v_TBN = v.v_TBN;
        #endif
    #endif
#endif

#ifdef SCENE_IS_CALCULATE_SHADOWS
    #if SCENE_SHADOW_CASCADED_COUNT==1
        temp_varyings.v_shadowCoord = v.v_shadowCoord;
    #endif
#endif

temp_varyings.v_uv = v.v_uv;

#ifdef RENDERER_HAS_UV1
    temp_varyings.v_uv1 = v.v_uv1;
#endif
#ifdef MATERIAL_NEED_WORLD_POS
    temp_varyings.v_pos = v.v_pos;
#endif