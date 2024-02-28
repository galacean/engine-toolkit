attribute vec3 POSITION;
attribute vec2 TEXCOORD_0;

varying vec2 v_uv;

void main(){
    gl_Position = vec4( POSITION.xzy , 1.0);
    gl_Position.y *= -1.0;
    v_uv = TEXCOORD_0;
}
        