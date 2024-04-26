#include "material_pbr.glsl"
#include "normal_get.glsl"
#include "surfaceData_pbr.glsl"
// direct + indirect
#include "brdf.glsl"
#include "light_direct_pbr.glsl"
#include "light_indirect_pbr.glsl"


vec4 evaluateSurface(SurfaceData surfaceData){

    ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );

    // Direct Light
    evaluateDirectRadiance(surfaceData, reflectedLight);


    // IBL
    evaluateIBL(surfaceData, reflectedLight);

    // Total
    vec3 totalRadiance =    reflectedLight.directDiffuse + 
                            reflectedLight.indirectDiffuse + 
                            reflectedLight.directSpecular + 
                            reflectedLight.indirectSpecular +
                            surfaceData.emissive;


    return vec4(totalRadiance, surfaceData.opacity);


}


