#include "material_pbr.glsl"
#include "normal_get.glsl"
#include "surfaceData_pbr.glsl"
// direct + indirect
#include "brdf.glsl"
#include "light_direct_pbr.glsl"
#include "light_indirect_pbr.glsl"


vec4 evaluateSurface(SurfaceData surfaceData){
    vec3 color = vec3(0);

    // Direct Light
    evaluateDirectRadiance(surfaceData, color);
    // IBL
    evaluateIBL(surfaceData, color);
    // Emissive
    color += surfaceData.emissive;

    return vec4(color, surfaceData.opacity);
}


