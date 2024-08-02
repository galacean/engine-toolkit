float material_HairFirstWidth;
float material_HairSecondWidth;
float material_HairFirstStrength;
float material_HairSecondStrength;
float material_HairFirstOffset;
float material_HairSecondOffset;
vec4 material_HairFirstColor;
vec4 material_HairSecondColor;

#ifdef MATERIAL_HAS_HAIRANISOTROPY_TEXTURE
 sampler2D material_HairAnisotropyTexture;
#endif

vec3 shiftTangent(vec3 tangent,vec3 normal, float shift )
{
return (normalize(tangent + normal * shift));
}

// Kajiya-Kay Model
float anisotropySpecular(SurfaceData surfaceData, vec3 light, float width, float strength, vec3 shiftedTangent)
{
  vec3 v = surfaceData.viewDir;
  vec3 H =  normalize( light + v );
  float dotTH = dot(shiftedTangent, H);
  float sinTH =  sqrt(1.0-dotTH * dotTH);
  float dirAtten = smoothstep(-1.0, 0.0, dotTH);
  return dirAtten * pow(sinTH, width) * strength;
}