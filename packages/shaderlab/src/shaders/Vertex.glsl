// #ifndef VERTEX_INCLUDE
// #define VERTEX_INCLUDE 1

#include "Skin.glsl"
#include "BlendShape.glsl"
#include "Shadow.glsl"
#include "Transform.glsl"


vec4 material_TilingOffset;

void initVertex(){
    vec4 position = vec4( attr.POSITION , 1.0 );

    #ifndef MATERIAL_OMIT_NORMAL
        #ifdef RENDERER_HAS_NORMAL
            vec3 normal = vec3( attr.NORMAL );
        #endif

        #ifdef RENDERER_HAS_TANGENT
            vec4 tangent = vec4( attr.TANGENT );
        #endif
    #endif


    // blendShape
    #ifdef RENDERER_HAS_BLENDSHAPE
    	#ifdef RENDERER_BLENDSHAPE_USE_TEXTURE	
    		int vertexOffset = gl_VertexID * renderer_BlendShapeTextureInfo.x;
    		for(int i = 0; i < RENDERER_BLENDSHAPE_COUNT; i++){
    			int vertexElementOffset = vertexOffset;
    			float weight = renderer_BlendShapeWeights[i];
    			// Warnning: Multiplying by 0 creates weird precision issues, causing rendering anomalies in Ace2 Android13
    			if(weight != 0.0){
    				position.xyz += getBlendShapeVertexElement(i, vertexElementOffset) * weight;
    
    				#ifndef MATERIAL_OMIT_NORMAL
    					#if defined( RENDERER_HAS_NORMAL ) && defined( RENDERER_BLENDSHAPE_HAS_NORMAL )
    						vertexElementOffset += 1;
    						normal += getBlendShapeVertexElement(i, vertexElementOffset) * weight;
    					#endif
    
    					#if defined( RENDERER_HAS_TANGENT ) && defined(RENDERER_BLENDSHAPE_HAS_TANGENT)
    						vertexElementOffset += 1;
    						tangent.xyz += getBlendShapeVertexElement(i, vertexElementOffset) * weight;
    					#endif
    				#endif
    			}
    
    		}
    	#else
    		position.xyz += attr.POSITION_BS0 * renderer_BlendShapeWeights[0];
    		position.xyz += attr.POSITION_BS1 * renderer_BlendShapeWeights[1];

    		#if defined( RENDERER_BLENDSHAPE_HAS_NORMAL ) && defined( RENDERER_BLENDSHAPE_HAS_TANGENT )
    			#ifndef MATERIAL_OMIT_NORMAL
    				#ifdef RENDERER_HAS_NORMAL
    					normal += attr.NORMAL_BS0 * renderer_BlendShapeWeights[0];
    					normal += attr.NORMAL_BS1 * renderer_BlendShapeWeights[1];
    				#endif
                    
    				#ifdef RENDERER_HAS_TANGENT
    					tangent.xyz += attr.TANGENT_BS0 * renderer_BlendShapeWeights[0];
    					tangent.xyz += attr.TANGENT_BS1 * renderer_BlendShapeWeights[1];
    				#endif				
    			#endif
    		#else
    			#if defined( RENDERER_BLENDSHAPE_HAS_NORMAL ) || defined( RENDERER_BLENDSHAPE_HAS_TANGENT )
    				#ifndef MATERIAL_OMIT_NORMAL
    					position.xyz += attr.POSITION_BS2 * renderer_BlendShapeWeights[2];
    					position.xyz += attr.POSITION_BS3 * renderer_BlendShapeWeights[3];

    					#if defined( RENDERER_BLENDSHAPE_HAS_NORMAL ) && defined( RENDERER_HAS_NORMAL )
    						normal += attr.NORMAL_BS0 * renderer_BlendShapeWeights[0];
    						normal += attr.NORMAL_BS1 * renderer_BlendShapeWeights[1];
    						normal += attr.NORMAL_BS2 * renderer_BlendShapeWeights[2];
    						normal += attr.NORMAL_BS3 * renderer_BlendShapeWeights[3];
    					#endif

    					#if defined(RENDERER_BLENDSHAPE_HAS_TANGENT) && defined( RENDERER_HAS_TANGENT )
    						tangent.xyz += attr.TANGENT_BS0 * renderer_BlendShapeWeights[0];
    						tangent.xyz += attr.TANGENT_BS1 * renderer_BlendShapeWeights[1];
    						tangent.xyz += attr.TANGENT_BS2 * renderer_BlendShapeWeights[2];
    						tangent.xyz += attr.TANGENT_BS3 * renderer_BlendShapeWeights[3];
    					#endif
    				#endif
    			#else
    				position.xyz += attr.POSITION_BS2 * renderer_BlendShapeWeights[2];
    				position.xyz += attr.POSITION_BS3 * renderer_BlendShapeWeights[3];
    				position.xyz += attr.POSITION_BS4 * renderer_BlendShapeWeights[4];
    				position.xyz += attr.POSITION_BS5 * renderer_BlendShapeWeights[5];
    				position.xyz += attr.POSITION_BS6 * renderer_BlendShapeWeights[6];
    				position.xyz += attr.POSITION_BS7 * renderer_BlendShapeWeights[7];
    			#endif
    		#endif
    	#endif
    #endif



    // skin
    #ifdef RENDERER_HAS_SKIN

            #ifdef RENDERER_USE_JOINT_TEXTURE
                mat4 skinMatrix =
                    attr.WEIGHTS_0.x * getJointMatrix(renderer_JointSampler, attr.JOINTS_0.x ) +
                    attr.WEIGHTS_0.y * getJointMatrix(renderer_JointSampler, attr.JOINTS_0.y ) +
                    attr.WEIGHTS_0.z * getJointMatrix(renderer_JointSampler, attr.JOINTS_0.z ) +
                    attr.WEIGHTS_0.w * getJointMatrix(renderer_JointSampler, attr.JOINTS_0.w );

            #else
                mat4 skinMatrix =
                    attr.WEIGHTS_0.x * renderer_JointMatrix[ int( attr.JOINTS_0.x ) ] +
                    attr.WEIGHTS_0.y * renderer_JointMatrix[ int( attr.JOINTS_0.y ) ] +
                    attr.WEIGHTS_0.z * renderer_JointMatrix[ int( attr.JOINTS_0.z ) ] +
                    attr.WEIGHTS_0.w * renderer_JointMatrix[ int( attr.JOINTS_0.w ) ];
            #endif

            position = skinMatrix * position;

            #if defined(RENDERER_HAS_NORMAL) && !defined(MATERIAL_OMIT_NORMAL)
                mat3 skinNormalMatrix = INVERSE_MAT(mat3(skinMatrix));
                normal = normal * skinNormalMatrix;
                #ifdef RENDERER_HAS_TANGENT
                    tangent.xyz = tangent.xyz * skinNormalMatrix;
                #endif

            #endif

    #endif




    // fog
    #if SCENE_FOG_MODE != 0
        vec4 positionVS = renderer_MVMat * position;
        v.v_positionVS = positionVS.xyz / positionVS.w;
    #endif


    // uv_vert
    #ifdef RENDERER_HAS_UV
        v.v_uv = attr.TEXCOORD_0;
    #else
        // may need this calculate normal
        v.v_uv = vec2( 0.0, 0.0 );
    #endif

    #ifdef RENDERER_HAS_UV1
        v.v_uv1 = attr.TEXCOORD_1;
    #endif

    #ifdef MATERIAL_NEED_TILING_OFFSET
        v.v_uv = v.v_uv * material_TilingOffset.xy + material_TilingOffset.zw;
    #endif


    // color_vert
    #ifdef RENDERER_ENABLE_VERTEXCOLOR
    	v.v_color = attr.COLOR_0;
    #endif


    // normal_vert
    #ifndef MATERIAL_OMIT_NORMAL
        #ifdef RENDERER_HAS_NORMAL
            v.v_normal = normalize( mat3(renderer_NormalMat) * normal );

            #ifdef RENDERER_HAS_TANGENT
                vec3 tangentW = normalize( mat3(renderer_NormalMat) * tangent.xyz );
                vec3 bitangentW = cross( v.v_normal, tangentW ) * tangent.w;

                v.v_tangent = tangentW;
                v.v_bitangent = bitangentW;
            #endif
        #endif
    #endif


    // worldpos_vert
    #ifdef MATERIAL_NEED_WORLD_POS
        vec4 temp_pos = renderer_ModelMat * position;
        v.v_pos = temp_pos.xyz / temp_pos.w;
    #endif

    // shadow
    #ifdef SCENE_IS_CALCULATE_SHADOWS
        #if SCENE_SHADOW_CASCADED_COUNT == 1
            v.v_shadowCoord = getShadowCoord(v.v_pos);
        #endif
    #endif

    // position_vert
    gl_Position = renderer_MVPMat * position;
}

// #endif