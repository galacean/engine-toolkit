vec3 DotCosineLobe(FsphericalGaussian G , vec3 N)
{
 float muDotN = dot(G.Axis,N);
 vec3 c0 = vec3 (0.36);
 vec3 c1 = vec3(0.25 / c0);
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

//Normalized SG
FsphericalGaussian MakeNormalizedSG(vec3 lightdir , vec3 sharpness)
{
FsphericalGaussian SG;
SG.Axis = lightdir;
SG.Sharpness = sharpness;
SG.Amplitude = SG.Sharpness /((2.0 * PI) * (1.0 - exp(-2.0 * SG.Sharpness)));
return SG;
}
  
vec3 SGDiffuseLighting(vec3 Light ,vec3 Normal ,vec3 ScatterAmt)
{
FsphericalGaussian Kernel = MakeNormalizedSG(L, 1.0 / max(ScatterAmt.xyz,0.0001));
vec3 diffuse = DotCosineLobe(Kernel,N); 
//Tone Mapping
vec3 diffuselobe = max(vec3(0.0),(diffuse-0.004));
diffuse = (diffuselobe * (6.2 * diffuselobe + 0.5)) / (diffuselobe * (6.2 * diffuselobe + 1.7) + 0.06);
return diffuse;
}


  
  