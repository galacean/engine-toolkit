vec4 material_SkinScatterAmount;
float material_CurvaturePower;

#ifdef MATERIAL_HAS_CURVATEXTURE
 sampler2D material_CurvatureTexture;
#endif

struct FsphericalGaussian {
    vec3 Axis;  //u
    vec3 Sharpness; //L
    vec3 Amplitude; //a
};

vec3 dotCosineLobe(FsphericalGaussian G , vec3 N)
{
 float muDotN = dot(G.Axis,N);
 const vec3 c0 = vec3(0.36);
 const vec3 c1 = vec3(0.25 / c0);
 vec3 eml = exp(-G.Sharpness);
 vec3 em2l = eml * eml;
 vec3 rl = 1.0 / G.Sharpness;

 vec3 scale = 1.0 + 2.0 * em2l - rl;
 vec3 bias =(eml - em2l) * rl - em2l;

 vec3 x = sqrt(vec3(1.0)- scale);
 vec3 x0 = c0 * muDotN;
 vec3 x1 = c1 * x;

 vec3 n = x0 + x1;

 vec3 y;
if (all(lessThanEqual(abs(x0), x1)))
 {
   y = (n * n) / x;
 } 
 else
 {
   y = clamp(vec3(muDotN),vec3(0.0),vec3(1.0));
 }
 return scale * y + bias;
}

// Normalized sg
FsphericalGaussian makeNormalizedSG(vec3 lightdir , vec3 sharpness)
{
FsphericalGaussian sg;
sg.Axis = lightdir;
sg.Sharpness = sharpness;
sg.Amplitude = sg.Sharpness /((2.0 * PI) * (1.0 - exp(-2.0 * sg.Sharpness)));
return sg;
}
  
vec3 sgdiffuseLighting(vec3 light ,vec3 normal ,vec3 scatterAmt)
{
FsphericalGaussian Kernel = makeNormalizedSG(light, 1.0 / max(scatterAmt.xyz,0.0001));
vec3 diffuse = dotCosineLobe(Kernel,normal); 
// Tone Mapping
vec3 diffuselobe = max(vec3(0.0),(diffuse-0.004));
diffuse = (diffuselobe * (6.2 * diffuselobe + 0.5)) / (diffuselobe * (6.2 * diffuselobe + 1.7) + 0.06);
return diffuse;
}