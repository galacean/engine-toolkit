#include <common>

uniform vec3 u_pickColor;

void main() {
    gl_FragColor = vec4( u_pickColor, 1.0 );
}
