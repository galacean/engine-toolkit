#define FUNCTION_SPECULAR_LOBE specularLobe_hair

#include "./HairFunction.glsl"
#include "LightDirectPBR.glsl"

void specularLobe_hair(BRDFData brdfData, vec3 incidentDirection, vec3 attenuationIrradiance, inout vec3 specularColor){
    
    vec3 worldtangentDir = brdfData.tangent;
    vec3 worldbitangentDir = brdfData.bitangent;

   #ifdef MATERIAL_HAS_HAIRANISOTROPY_TEXTURE
    float shift = (texture2D(material_HairAnisotropyTexture, v.v_uv)).r - 0.5;
   #else
    float shift = 1.0;
   #endif

    vec3 shiftTangent1 = shiftTangent(worldbitangentDir, brdfData.normal, shift + material_HairFirstOffest);
    vec3 shiftTangent2 = shiftTangent(worldbitangentDir, brdfData.normal, shift + material_HairSecondOffest);

    vec3 firstcol = material_HairFirstColor.rgb;
    vec3 firstSpecular = firstcol * anisotropySpecular(brdfData, incidentDirection, material_HairFirstWidth*15.0, material_HairsFirststrength, shiftTangent1);
 
    vec3 secondcol = material_HairSecondColor.rgb;
    vec3 secondSpecular = secondcol * anisotropySpecular(brdfData, incidentDirection, material_HairSecondWidth*15.0, material_HairsSecondstrength, shiftTangent2);
 
    vec3 hairSpecular = clamp(firstSpecular + secondSpecular, 0.0, 1.0);

    specularColor += attenuationIrradiance * hairSpecular;
}