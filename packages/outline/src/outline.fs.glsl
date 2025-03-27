#include <common>
uniform vec3 material_OutlineColor;
uniform sampler2D material_OutlineTexture;
uniform vec2 material_TexSize;
varying vec2 v_uv;

float luminance(vec4 color) {
    return  0.2125 * color.r + 0.7154 * color.g + 0.0721 * color.b; 
}

float sobel() {
  // float Gx[9] = float[](
  //             -1.0,  0.0,  1.0,
  //             -2.0,  0.0,  2.0,
  //             -1.0,  0.0,  1.0);
              
  // float Gy[9] = float[](
  //             -1.0, -2.0, -1.0,
  //             0.0,  0.0,  0.0,
  //             1.0,  2.0,  1.0);		
  
  // adapter to webgl 1.0
   float Gx[9];
   Gx[0] = -1.0;
   Gx[1] = 0.0;
   Gx[2] = 1.0;
   Gx[3] = -2.0;
   Gx[4] = 0.0;
   Gx[5] = 2.0;
   Gx[6] = -1.0;
   Gx[7] = 0.0;
   Gx[8] = 1.0;

              
  float Gy[9];
   Gy[0] = -1.0;
   Gy[1] = -2.0;
   Gy[2] = -1.0;
   Gy[3] = 0.0;
   Gy[4] = 0.0;
   Gy[5] = 0.0;
   Gy[6] = 1.0;
   Gy[7] = 2.0;
   Gy[8] = 1.0;
  
  float texColor;
  float edgeX = 0.0;
  float edgeY = 0.0;
  vec2 uv[9];

  uv[0] = v_uv + material_TexSize.xy * vec2(-1, -1);
  uv[1] = v_uv + material_TexSize.xy * vec2(0, -1);
  uv[2] = v_uv + material_TexSize.xy * vec2(1, -1);
  uv[3] = v_uv + material_TexSize.xy * vec2(-1, 0);
  uv[4] = v_uv + material_TexSize.xy * vec2(0, 0);
  uv[5] = v_uv + material_TexSize.xy * vec2(1, 0);
  uv[6] = v_uv + material_TexSize.xy * vec2(-1, 1);
  uv[7] = v_uv + material_TexSize.xy * vec2(0, 1);
  uv[8] = v_uv + material_TexSize.xy * vec2(1, 1);

  for (int i = 0; i < 9; i++) {
    texColor = luminance(texture2D(material_OutlineTexture, uv[i]));
    edgeX += texColor * Gx[i];
    edgeY += texColor * Gy[i];
  }
  
  return abs(edgeX) + abs(edgeY);
}



void main(){
  float sobelFactor = step(1.0, sobel());
  // float sobelFactor = sobel();
  gl_FragColor = mix( vec4(0), vec4(material_OutlineColor, 1.0), sobelFactor);

  gl_FragColor = outputTransform(gl_FragColor);

}