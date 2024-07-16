#ifndef VERTEX_INCLUDE
#define VERTEX_INCLUDE

#include "Skin.glsl"
#include "BlendShape.glsl"
#include "Shadow.glsl"
#include "Transform.glsl"


vec4 material_TilingOffset;
void initUV(Attributes attr, inout Varyings v){
    #ifdef RENDERER_HAS_UV
        v.v_uv = attr.TEXCOORD_0;
    #else
        // may need this calculate normal
        v.v_uv = vec2( 0.0, 0.0 );
    #endif

    #ifdef RENDERER_HAS_UV1
        v.v_uv1 = attr.TEXCOORD_1;
    #endif

    v.v_uv = v.v_uv * material_TilingOffset.xy + material_TilingOffset.zw;
}

void initVertexColor(Attributes attr, inout Varyings v){
    #ifdef RENDERER_ENABLE_VERTEXCOLOR
    	v.v_color = attr.COLOR_0;
    #endif
}


void initTransform(Attributes attr, out Varyings v){
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
        calculateBlendShape(attr, position
        #ifndef MATERIAL_OMIT_NORMAL
            #ifdef RENDERER_HAS_NORMAL
                ,normal
            #endif
            #ifdef RENDERER_HAS_TANGENT
                ,tangent
            #endif
        #endif
        );
    #endif



    // skin
    #ifdef RENDERER_HAS_SKIN
        mat4 skinMatrix = getSkinMatrix(attr);
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


    // normal and tangent
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
    vec4 temp_pos = renderer_ModelMat * position;
    v.v_pos = temp_pos.xyz / temp_pos.w;


    // position_vert
    gl_Position = renderer_MVPMat * position;
}


void initShadowCorrd(Attributes attr, out Varyings v){
    #ifdef SCENE_IS_CALCULATE_SHADOWS
        #if SCENE_SHADOW_CASCADED_COUNT == 1
            v.v_shadowCoord = getShadowCoord(v.v_pos);
        #endif
    #endif
}


#endif