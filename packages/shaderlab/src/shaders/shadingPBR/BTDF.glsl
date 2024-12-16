#ifndef BTDF_INCLUDED
#define BTDF_INCLUDED

#include "Refraction.glsl"

vec4 renderer_texelSize;    // x: 1/width, y: 1/height, z: width, w: height
sampler2D camera_OpaqueTexture;

#ifdef MATERIAL_ENABLE_SS_REFRACTION 
    vec3 evaluateRefraction(Varyings varyings, SurfaceData surfaceData, BRDFData brdfData, vec3 speculaColor) {
        RefractionModel ray;
        #if  REFRACTION_SPHERE
        RefractionModelSphere(surfaceData.viewDir, varyings.positionWS, varyings.normalWS, surfaceData.IOR, surfaceData.thickness, ray);
        #elif REFRACTION_PLANE
        RefractionModelBox(surfaceData.viewDir, varyings.positionWS, varyings.normalWS, surfaceData.IOR, surfaceData.thickness, ray);
        #elif REFRACTION_THIN
        RefractionModelBox(surfaceData.viewDir, varyings.positionWS, varyings.normalWS, surfaceData.IOR, surfaceData.thickness, ray);
        #endif

        vec3 refractedRayExit = ray.position; //ray.position + ray.direction;

        // Project refracted vector on the framebuffer, while mapping to normalized device coordinates.
        vec4 ndcPos = camera_ProjMat * camera_ViewMat * vec4( refractedRayExit, 1.0 );
        vec2 refractionCoords = ndcPos.xy / ndcPos.w;
        refractionCoords *= 0.5;
        refractionCoords += 0.5;

        // compute transmission 
       vec3 absorptionCoefficient = max(vec3(0), -log(surfaceData.attenuationColor)/surfaceData.attenuationDistance);
       #ifdef MATERIAL_HAS_ABSORPTION
			vec3 transmittance = min(vec3(1.0), exp(-absorptionCoefficient * ray.dist));
        #else
            vec3 transmittance = 1.0 - absorptionCoefficient;
       #endif

		// vec4 transmittedLight = texture2D(camera_OpaqueTexture, varyings.uv);
		vec4 transmittedLight = sampleTexture2DBicubic(camera_OpaqueTexture, refractionCoords, renderer_texelSize);
		// vec3 transmittanceColor = brdfData.diffuseColor * transmittance;
        vec3 E = envBRDFApprox(speculaColor, brdfData.roughness, surfaceData.dotNV);
		
        vec3 ft  = transmittedLight.rgb;
        ft *= brdfData.diffuseColor;
        ft *= 1.0 - E;

       #ifdef MATERIAL_HAS_ABSORPTION
       ft *= transmittance;
       #endif
        
        return ft;
    }
#endif

#endif