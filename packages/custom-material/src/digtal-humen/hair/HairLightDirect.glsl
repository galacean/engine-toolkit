#define FUNCTION_SPECULAR_LOBE specularLobe_hair

#include "HairFunction.glsl"
#include "LightDirectPBR.glsl"

void specularLobe_hair(BRDFData brdfData, vec3 incidentDirection, vec3 attenuationIrradiance, inout vec3 specularColor){

    vec3 worldtangentDir   = brdfData.tangent;
    vec3 worldBitangentDir = brdfData.bitangent;

   #ifdef MATERIAL_HAS_HAIRANISOTROPY_TEXTURE
    float shift = (texture2D(material_HairAnisotropyTexture, v.v_uv)).r - 0.5;
   #else
    float shift = 1.0;
   #endif
  
    vec3 ShiftTangent1 = shiftTangent(worldBitangentDir,brdfData.normal,shift+material_HairFirstOffest);
    vec3 ShiftTangent2 = shiftTangent(worldBitangentDir,brdfData.normal,shift+material_HairSecondOffest);
 
    vec3 Firstcol= material_HairFirstColor.rgb ;
    vec3 FirstSpecular =Firstcol * anisotropySpecular( brdfData , incidentDirection, material_HairFirstWidth *15.0, material_HairsFirststrength, ShiftTangent1);
 
    vec3 Secondcol= material_HairSecondColor.rgb ;
    vec3 SecondSpecular = Secondcol * anisotropySpecular( brdfData ,  incidentDirection, material_HairSecondWidth *15.0, material_HairsSecondstrength, ShiftTangent2);
 
    vec3 hairSpecular =clamp( FirstSpecular + SecondSpecular,0.0,1.0);

    specularColor += attenuationIrradiance * hairSpecular;
}