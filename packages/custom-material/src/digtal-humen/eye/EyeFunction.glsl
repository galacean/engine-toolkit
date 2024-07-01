vec2 parallaxOffset( float heighttex, float height, vec3 viewDir )
   {
     float heightTex = heighttex * height- height/2.0;
     vec3 s = viewDir;
     s.z -= 0.42;
     s.y -= s.y;
     return  heightTex * (s.xy / s.z);
   }
