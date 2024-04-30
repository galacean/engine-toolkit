// #ifndef SHADING_PBR_INCLUDED
// #define SHADING_PBR_INCLUDED 1

#include "surfaceDataPBR.glsl"
#include "lightDirectPBR.glsl"
#include "lightIndirectPBR.glsl"


vec4 evaluateSurface(Temp_Varyings v, SurfaceData surfaceData){
    vec3 color = vec3(0);

    // Direct Light
    evaluateDirectRadiance(v, surfaceData, color);
    // IBL
    evaluateIBL(v, surfaceData, color);
    // Emissive
    color += surfaceData.emissive;

    return vec4(color, surfaceData.opacity);
}


// #endif

