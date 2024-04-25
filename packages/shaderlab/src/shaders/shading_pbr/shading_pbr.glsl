#include "material_pbr.glsl"
#include "normal_get.glsl"
// direct + indirect
#include "brdf.glsl"
#include "light_direct_pbr.glsl"
#include "light_indirect_pbr.glsl"
#include "surfaceData_pbr.glsl"


vec4 evaluateSurface(in Geometry geometry, in Material material){

    ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );

    // Direct Light
    evaluateDirectRadiance(geometry, material, reflectedLight);


    // IBL
    evaluateIBL(geometry, material, reflectedLight);

    // Total
    vec3 totalRadiance =    reflectedLight.directDiffuse + 
                            reflectedLight.indirectDiffuse + 
                            reflectedLight.directSpecular + 
                            reflectedLight.indirectSpecular +
                            material.emissive;


    return vec4(totalRadiance, material.opacity);


}


