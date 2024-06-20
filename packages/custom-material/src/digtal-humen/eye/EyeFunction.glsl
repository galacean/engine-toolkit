vec2 ParallaxOffset( float h, float height, vec3 viewDir )
   {
     float heightTex = h * height- height/2.0;
     vec3 s = viewDir;
     s.z -= 0.42;
     s.y -= s.y;
     return  heightTex * (s.xy / s.z);
   }
