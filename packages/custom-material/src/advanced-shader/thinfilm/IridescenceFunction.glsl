#ifndef IRIDESCENCE_FUNCTION
#define IRIDESCENCE_FUNCTION

float material_Eta2;
float material_IridescenceThickness;
float material_Iridescence;

float sqr(float x)  { 
  return x * x; 
}

vec3 iorToFresnel(vec3 transmittedIor, float incidentIor){
  return pow((transmittedIor - incidentIor) / (transmittedIor + incidentIor),vec3(2.0,2.0,2.0));
} 

vec3 fresnelToIor(vec3 F0){
  vec3 sqrtF0 = sqrt(F0);
  return (vec3(1.0) + sqrtF0) / (vec3(1.0) - sqrtF0);
}

 vec3 evalSensitivity(float opd, vec3 shift){
	// Use Gaussian fits, given by 3 parameters: val, pos and var
	float phase = 2.0 * PI * opd * 1.0e-6;
	const vec3 val = vec3(5.4856e-13, 4.4201e-13, 5.2481e-13);
	const vec3 pos = vec3(1.6810e+6, 1.7953e+6, 2.2084e+6);
	const vec3 var = vec3(4.3278e+9, 9.3046e+9, 6.6121e+9);
	vec3 xyz = val * sqrt(2.0*PI * var) * cos(pos * phase + shift) * exp(-var * sqr(phase));
	xyz.x += 9.7470e-14 * sqrt(2.0*PI * 4.5282e+9) * cos(2.2399e+6 * phase + shift[0]) * exp(-4.5282e+9 * sqr(phase));
	xyz /= 1.0685e-7;

	const mat3 XYZ_TO_RGB = mat3( 3.2404542, -0.9692660,  0.0556434,
                                 -1.5371385,  1.8760108, -0.2040259,
                                 -0.4985314,  0.0415560,  1.0572252);
   vec3 rgb = XYZ_TO_RGB * xyz;
   return rgb;
}

vec3 thinFilmIridescence(float cosTheta1, float eta2, vec3 baseF0,float iridescenceThickness){ 

 const float eta1 = 1.0;
 float dinc = 2.0 *  iridescenceThickness;
 float sinTheta2  = pow(eta1 / eta2, 2.0) * (1.0 - pow(cosTheta1 , 2.0));
 float cosTheta2Sq = (1.0 - sinTheta2);
 float cosTheta2 = sqrt(cosTheta2Sq);
      
 // First interface
 float R0 = iorToFresnel(vec3(eta2), eta1).x;
 float R12 = F_Schlick(R0, cosTheta1);
 float R21  = R12;
 float T121 =1.0 - R12;

 float phi12 = 0.0;
 float phi21 = PI - phi12;

 vec3 baseIor = fresnelToIor(baseF0 + 0.0001); 
 vec3 R1  =iorToFresnel(baseIor, eta2);
 vec3 R23 = F_Schlick(R1, cosTheta2);

 vec3 phi23 =vec3(0.0);
 if (baseIor[0] < eta2) {phi23[0] = PI;}
 if (baseIor[1] < eta2) {phi23[1] = PI;}
 if (baseIor[2] < eta2) {phi23[2] = PI;}
 
 // Phase shift
 float OPD = dinc * cosTheta1 * eta2;
 vec3 phi = vec3(phi21,phi21,phi21) + phi23;

 vec3 R123 = clamp(R12 * R23, 1e-5, 0.9999);
 vec3 r123 = sqrt(R123);
 vec3 Rs   = sqr(T121) * R23 / (vec3(1.0)-R123);

 vec3 C0 = R12 + Rs;
 vec3 iridescence = vec3(0);			
 iridescence = C0;

 vec3 Cm = Rs - T121;
  for (int m = 1; m <= 2; ++m)
    {
     Cm *= r123;
	 vec3 Sm = 2.0 * evalSensitivity(float(m) * OPD, float(m) * phi);
	 iridescence += Cm * Sm;
    }
 iridescence = max(iridescence, vec3(0)); 
    
 return iridescence;
}

vec3 directBDRFIridescence(SurfaceData surfaceData, vec3 light, BRDFData brdfData ){
// Compute dot products
 float NdotL = saturate(dot(surfaceData.normal, light ) );
 float NdotV = saturate(dot(surfaceData.normal, surfaceData.viewDir ) );
 vec3 halfDir = normalize(light + surfaceData.viewDir );
 float NdotH = saturate(dot(surfaceData.normal, halfDir ) );
 float cosTheta1 = dot(halfDir, light);

 vec3 iridescence = thinFilmIridescence(cosTheta1,material_Eta2,brdfData.specularColor,material_IridescenceThickness);    
 return iridescence;
}

#endif