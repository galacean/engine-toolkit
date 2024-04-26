#include "material_pbr.glsl"
#include "normal_get.glsl"
#include "surfaceData_pbr.glsl"
// direct + indirect
#include "brdf.glsl"
#include "light_direct_pbr.glsl"
#include "light_indirect_pbr.glsl"


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


