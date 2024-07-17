
#ifndef BRDF_INCLUDED
#define BRDF_INCLUDED

#define MIN_PERCEPTUAL_ROUGHNESS 0.045
#define MIN_ROUGHNESS            0.002025

#if defined(RENDERER_HAS_TANGENT) || defined(MATERIAL_ENABLE_ANISOTROPY) || defined(MATERIAL_HAS_CLEAR_COAT_NORMAL_TEXTURE) || defined(MATERIAL_HAS_NORMALTEXTURE)
    #define NEED_TANGENT
#endif


struct SurfaceData{
    // common
	vec3  albedoColor;
    vec3  specularColor;
	vec3  emissiveColor;
    float metallic;
    float roughness;
    float diffuseAO;
    float specularAO;
    float f0;
    float opacity;

    // geometry
    vec3 position;
    vec3 normal;

    #ifdef NEED_TANGENT
        vec3  tangent;
        vec3  bitangent;
    #endif

    vec3  viewDir;
    float dotNV;

    // Anisotropy
    #ifdef MATERIAL_ENABLE_ANISOTROPY
        float anisotropy;
        vec3  anisotropicT;
        vec3  anisotropicB;
        vec3  anisotropicN;
    #endif

    // Clear coat
    #ifdef MATERIAL_ENABLE_CLEAR_COAT
        float clearCoat;
        float clearCoatRoughness;
        vec3  clearCoatNormal;
        float clearCoatDotNV;
    #endif
};


struct BRDFData{
    // common
    vec3  diffuseColor;
    vec3  specularColor;
    float roughness;
    float diffuseAO;
    float specularAO;

    // geometry
    vec3 position;
    vec3 normal;

    #ifdef NEED_TANGENT
        vec3  tangent;
        vec3  bitangent;
    #endif

    vec3  viewDir;
    float dotNV;

    // Anisotropy
    #ifdef MATERIAL_ENABLE_ANISOTROPY
        float anisotropy;
        vec3  anisotropicT;
        vec3  anisotropicB;
        vec3  anisotropicN;
    #endif

    // Clear coat
    #ifdef MATERIAL_ENABLE_CLEAR_COAT
        float clearCoat;
        float clearCoatRoughness;
        vec3  clearCoatNormal;
        float clearCoatDotNV;
    #endif
};



float getAARoughnessFactor(vec3 normal) {
    // Kaplanyan 2016, "Stable specular highlights"
    // Tokuyoshi 2017, "Error Reduction and Simplification for Shading Anti-Aliasing"
    // Tokuyoshi and Kaplanyan 2019, "Improved Geometric Specular Antialiasing"
    #ifdef HAS_DERIVATIVES
        vec3 dxy = max( abs(dFdx(normal)), abs(dFdy(normal)) );
        return max( max(dxy.x, dxy.y), dxy.z );
    #else
        return 0.0;
    #endif
}


float F_Schlick(float f0, float dotLH) {
	return f0 + 0.96 * (pow(1.0 - dotLH, 5.0));
}

vec3 F_Schlick(vec3 specularColor, float dotLH ) {

	// Original approximation by Christophe Schlick '94
	// float fresnel = pow( 1.0 - dotLH, 5.0 );

	// Optimized variant (presented by Epic at SIGGRAPH '13)
	// https://cdn2.unrealengine.com/Resources/files/2013SiggraphPresentationsNotes-26915738.pdf
	float fresnel = exp2( ( -5.55473 * dotLH - 6.98316 ) * dotLH );

	return ( 1.0 - specularColor ) * fresnel + specularColor;

}

// Moving Frostbite to Physically Based Rendering 3.0 - page 12, listing 2
// https://seblagarde.files.wordpress.com/2015/07/course_notes_moving_frostbite_to_pbr_v32.pdf
float G_GGX_SmithCorrelated(float alpha, float dotNL, float dotNV ) {

	float a2 = pow2( alpha );

	// dotNL and dotNV are explicitly swapped. This is not a mistake.
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );

	return 0.5 / max( gv + gl, EPSILON );

}

#ifdef MATERIAL_ENABLE_ANISOTROPY
    // Heitz 2014, "Understanding the Masking-Shadowing Function in Microfacet-Based BRDFs"
    // Heitz http://jcgt.org/published/0003/02/03/paper.pdf
    float G_GGX_SmithCorrelated_Anisotropic(float at, float ab, float ToV, float BoV, float ToL, float BoL, float NoV, float NoL) {
        float lambdaV = NoL * length(vec3(at * ToV, ab * BoV, NoV));
        float lambdaL = NoV * length(vec3(at * ToL, ab * BoL, NoL));
        return 0.5 / max(lambdaV + lambdaL, EPSILON);
    }
#endif

// Microfacet Models for Refraction through Rough Surfaces - equation (33)
// http://graphicrants.blogspot.com/2013/08/specular-brdf-reference.html
// alpha is "roughness squared" in Disney’s reparameterization
float D_GGX(float alpha, float dotNH ) {

	float a2 = pow2( alpha );

	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0; // avoid alpha = 0 with dotNH = 1

	return RECIPROCAL_PI * a2 / pow2( denom );

}

#ifdef MATERIAL_ENABLE_ANISOTROPY
    // GGX Distribution Anisotropic
    // https://blog.selfshadow.com/publications/s2012-shading-course/burley/s2012_pbs_disney_brdf_notes_v3.pdf Addenda
    float D_GGX_Anisotropic(float at, float ab, float ToH, float BoH, float NoH) {
        float a2 = at * ab;
        highp vec3 d = vec3(ab * ToH, at * BoH, a2 * NoH);
        highp float d2 = dot(d, d);
        float b2 = a2 / d2;
        return a2 * b2 * b2 * RECIPROCAL_PI;
    }
#endif

vec3 isotropicLobe(vec3 specularColor, float alpha, float dotNV, float dotNL, float dotNH, float dotLH) {
	vec3 F = F_Schlick( specularColor, dotLH );
	float D = D_GGX( alpha, dotNH );
	float G = G_GGX_SmithCorrelated( alpha, dotNL, dotNV );

	return F * ( G * D );
}

#ifdef MATERIAL_ENABLE_ANISOTROPY
    vec3 anisotropicLobe(vec3 h, vec3 l, BRDFData brdfData, vec3 specularColor, float alpha, float dotNV, float dotNL, float dotNH, float dotLH) {
        vec3 t = brdfData.anisotropicT;
        vec3 b = brdfData.anisotropicB;
        vec3 v = brdfData.viewDir;

        float dotTV = dot(t, v);
        float dotBV = dot(b, v);
        float dotTL = dot(t, l);
        float dotBL = dot(b, l);
        float dotTH = dot(t, h);
        float dotBH = dot(b, h);

        // Aniso parameter remapping
        // https://blog.selfshadow.com/publications/s2017-shading-course/imageworks/s2017_pbs_imageworks_slides_v2.pdf page 24
        float at = max(alpha * (1.0 + brdfData.anisotropy), MIN_ROUGHNESS);
        float ab = max(alpha * (1.0 - brdfData.anisotropy), MIN_ROUGHNESS);

        // specular anisotropic BRDF
    	vec3 F = F_Schlick( specularColor, dotLH );
        float D = D_GGX_Anisotropic(at, ab, dotTH, dotBH, dotNH);
        float G = G_GGX_SmithCorrelated_Anisotropic(at, ab, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL);

        return F * ( G * D );
    }
#endif

// GGX Distribution, Schlick Fresnel, GGX-Smith Visibility
vec3 BRDF_Specular_GGX(vec3 incidentDirection, BRDFData brdfData, vec3 normal, vec3 specularColor, float roughness ) {

	float alpha = pow2( roughness ); // UE4's roughness

	vec3 halfDir = normalize( incidentDirection + brdfData.viewDir );

	float dotNL = saturate( dot( normal, incidentDirection ) );
	float dotNV = brdfData.dotNV;
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotLH = saturate( dot( incidentDirection, halfDir ) );

    #ifdef MATERIAL_ENABLE_ANISOTROPY
        return anisotropicLobe(halfDir, incidentDirection, brdfData, specularColor, alpha, dotNV, dotNL, dotNH, dotLH);
    #else
        return isotropicLobe(specularColor, alpha, dotNV, dotNL, dotNH, dotLH);
    #endif

}

vec3 BRDF_Diffuse_Lambert(vec3 diffuseColor) {
	return RECIPROCAL_PI * diffuseColor;
}


void initGeometryData(SurfaceData surfaceData, inout BRDFData brdfData){
    brdfData.position = surfaceData.position;
    brdfData.normal = surfaceData.normal;
    #ifdef NEED_TANGENT
        brdfData.tangent = surfaceData.tangent;
        brdfData.bitangent = surfaceData.bitangent;
    #endif
    brdfData.viewDir = surfaceData.viewDir;

    brdfData.dotNV = surfaceData.dotNV;
}

void initCommonBRDFData(SurfaceData surfaceData, inout BRDFData brdfData){
    vec3 albedoColor = surfaceData.albedoColor;
    vec3 specularColor = surfaceData.specularColor;
    float metallic = surfaceData.metallic;
    float roughness = surfaceData.roughness;
    float f0 = surfaceData.f0;

    #ifdef IS_METALLIC_WORKFLOW
        brdfData.diffuseColor = albedoColor * ( 1.0 - metallic );
        brdfData.specularColor = mix( vec3(f0), albedoColor, metallic );
    #else
        float specularStrength = max( max( specularColor.r, specularColor.g ), specularColor.b );
        brdfData.diffuseColor = albedoColor * ( 1.0 - specularStrength );
        brdfData.specularColor = specularColor;
    #endif

    brdfData.roughness = max(MIN_PERCEPTUAL_ROUGHNESS, min(roughness + getAARoughnessFactor(brdfData.normal), 1.0));
}

void initClearCoatBRDFData(SurfaceData surfaceData, inout BRDFData brdfData){
    brdfData.clearCoatNormal = surfaceData.clearCoatNormal;
    brdfData.clearCoatDotNV = surfaceData.clearCoatDotNV;
    brdfData.clearCoat = surfaceData.clearCoat;
    brdfData.clearCoatRoughness = surfaceData.clearCoatRoughness;
}

void initAnisotropyBRDFData(SurfaceData surfaceData, inout BRDFData brdfData){
    brdfData.anisotropy = surfaceData.anisotropy;
    brdfData.anisotropicT = surfaceData.anisotropicT;
    brdfData.anisotropicB = surfaceData.anisotropicB;
    brdfData.anisotropicN = surfaceData.anisotropicN;
}

void initAO(SurfaceData surfaceData, inout BRDFData brdfData){
    brdfData.diffuseAO = surfaceData.diffuseAO;
    brdfData.specularAO = surfaceData.specularAO;
}

void initBRDFData(SurfaceData surfaceData, out BRDFData brdfData){
    initGeometryData(surfaceData, brdfData);
    initCommonBRDFData(surfaceData, brdfData);

    #ifdef MATERIAL_ENABLE_CLEAR_COAT
        initClearCoatBRDFData(surfaceData, brdfData);
    #endif

    #ifdef MATERIAL_ENABLE_ANISOTROPY
        initAnisotropyBRDFData(surfaceData, brdfData);
    #endif

    initAO(surfaceData, brdfData);
}




#endif