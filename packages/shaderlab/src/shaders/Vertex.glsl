#ifndef VERTEX_INCLUDE
#define VERTEX_INCLUDE

#include "Skin.glsl"
#include "BlendShape.glsl"
#include "Shadow.glsl"
#include "Transform.glsl"


vec4 material_TilingOffset;
vec2 getUV0(Attributes attributes){
    vec2 uv0 = vec2(0);

    #ifdef RENDERER_HAS_UV
        uv0 = attributes.TEXCOORD_0;
    #endif

    return uv0 * material_TilingOffset.xy + material_TilingOffset.zw;
}


void initTransform(Attributes attributes, inout Varyings varyings){
    vec4 position = vec4( attributes.POSITION , 1.0 );

    #ifdef RENDERER_HAS_NORMAL
        vec3 normal = vec3( attributes.NORMAL );
    #endif

    #ifdef RENDERER_HAS_TANGENT
        vec4 tangent = vec4( attributes.TANGENT );
    #endif


    // blendShape
    #ifdef RENDERER_HAS_BLENDSHAPE
        calculateBlendShape(attributes, position
        #ifdef RENDERER_HAS_NORMAL
            ,normal
        #endif
        #ifdef RENDERER_HAS_TANGENT
            ,tangent
        #endif
        );
    #endif

    // skin
    #ifdef RENDERER_HAS_SKIN
        mat4 skinMatrix = getSkinMatrix(attributes);
        position = skinMatrix * position;

        #if defined(RENDERER_HAS_NORMAL)
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
        varyings.v_positionVS = positionVS.xyz / positionVS.w;
    #endif


    // normal and tangent
    #ifdef RENDERER_HAS_NORMAL
        varyings.v_normal = normalize( mat3(renderer_NormalMat) * normal );

        #ifdef RENDERER_HAS_TANGENT
            vec3 tangentW = normalize( mat3(renderer_NormalMat) * tangent.xyz );
            vec3 bitangentW = cross( varyings.v_normal, tangentW ) * tangent.w;

            varyings.v_tangent = tangentW;
            varyings.v_bitangent = bitangentW;
        #endif
    #endif


    // worldpos_vert
    vec4 temp_pos = renderer_ModelMat * position;
    varyings.v_pos = temp_pos.xyz / temp_pos.w;


    // position_vert
    gl_Position = renderer_MVPMat * position;
}

#endif