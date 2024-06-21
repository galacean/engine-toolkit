vec3 ShiftTangent(vec3 Tangent,vec3 Normal, float shift )
{
 
return (normalize(Tangent + Normal * shift));
}

//Kajiya-Kay Model
float AnisotropySpecular(BRDFData brdfData, vec3 Light, float width, float strength, vec3 shiftedTangent)
{
    vec3 v =  brdfData.viewDir;
    vec3 H =  normalize( Light + v );
    float dotTH = dot(shiftedTangent, H);
    float sinTH =  sqrt(1.0-dotTH * dotTH);
    float dirAtten = smoothstep(-1.0, 0.0, dotTH);
    return dirAtten * pow(sinTH, width) * strength;
}