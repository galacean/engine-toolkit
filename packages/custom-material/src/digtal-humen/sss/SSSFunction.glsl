float DotCosineLobe(FsphericalGaussian G , vec3 Normal)
{
 float muDotN = dot(G.Axis,Normal);
 float c0 = 0.36;
 float c1 = 0.25 / c0;
 float eml = exp(-G.Sharpness);
 float em2l = eml * eml;
 float rl = 1.0 / G.Sharpness;

 float scale = 1.0 + 2.0 * em2l - rl;
 float bias =(eml - em2l) * rl - em2l;

 float x = sqrt(1.0 - scale);
 float x0 = c0 * muDotN;
 float x1 = c1 * x;

 float n = x0 + x1;

 float y;
 if (abs(x0) <= x1)
 {
   y = (n * n) / x;
 } 
 else
 {
   y = clamp(muDotN,0.0,1.0);
 }
 return scale * y + bias;
}

//Normalized SG
FsphericalGaussian MakeNormalizedSG(vec3 lightdir , float sharpness)
{
FsphericalGaussian SG;
SG.Axis = lightdir;
SG.Sharpness = sharpness;
SG.Amplitude = SG.Sharpness /((2.0 * PI) * (1.0 - exp(-2.0 * SG.Sharpness)));
return SG;
}
  
vec3 SGDiffuseLighting(vec3 Light ,vec3 Normal ,vec3 ScatterAmt)
{
FsphericalGaussian RedKernel = MakeNormalizedSG(Light, 1.0 / max(ScatterAmt.x,0.0001));
FsphericalGaussian GreenKernel = MakeNormalizedSG(Light, 1.0/ max(ScatterAmt.y,0.0001));
FsphericalGaussian BlueKernel = MakeNormalizedSG(Light, 1.0/ max(ScatterAmt.z,0.0001));
vec3 diffuse = vec3(DotCosineLobe(RedKernel,Normal), DotCosineLobe(GreenKernel,Normal),  DotCosineLobe(BlueKernel,Normal));
//Tone Mapping
vec3 x = max(vec3(0.0,0.0,0.0),(diffuse-0.004));
diffuse =  (x * (6.2 * x + 0.5)) / (x * (6.2 * x + 1.7) + 0.06);
return diffuse;
}


  
  