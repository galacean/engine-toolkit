#include <common>

uniform vec3 u_colorId;

void main() {

    gl_FragColor = vec4( u_colorId, 1.0 );

}
