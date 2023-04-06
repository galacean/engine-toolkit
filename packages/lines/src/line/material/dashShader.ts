import { Shader } from "@galacean/engine";

//-- Shader 代码
const vertexSource = `
attribute vec2 a_pos;
attribute vec2 a_normal;
attribute vec2 a_data;
attribute float a_lengthsofar;

uniform mat4 u_MVPMat;
uniform float u_width;
uniform vec2 u_dash;

varying vec2 v_origin;
varying vec2 v_position;
varying float v_direction;
varying float v_part;
varying vec2 v_tex;

void main() {
    v_direction = a_data.x;
    v_part = a_data.y;
    float layer_index = 1.0;


    v_origin = a_pos;

    float texcoord_y = 0.0;

    texcoord_y = a_lengthsofar / (u_dash.x + u_dash.y);
    if (v_direction == 1.0) {
        v_tex = vec2(1.0, texcoord_y);
    } else {
        v_tex = vec2(0.0, texcoord_y);
    }
    vec2 position = a_pos + a_normal * u_width;
    v_position = position;
    gl_Position = u_MVPMat * vec4(position, 0.0, 1);
}
  `;

const fragmentSource = `
precision highp float;

uniform vec4 u_color;
uniform int u_join;
uniform int u_cap;
uniform float u_width;
uniform sampler2D u_texture;

varying vec2 v_origin;
varying vec2 v_position;
varying float v_direction;
varying float v_part;
varying vec2 v_tex;

float IS_CAP = 0.0;

void main() {
    vec4 finalColor;
    if (u_cap == 0 && v_part == IS_CAP) {
      if (distance(v_position, v_origin) > u_width) {
        discard;
      }
    }
    if (u_join == 1 && v_part > 1.5) {
      if (distance(v_position, v_origin) > u_width) {
        discard;
      }
    }
    vec4 textureColor = texture2D(u_texture, v_tex);
    if (textureColor.a <= 0.5) {
      gl_FragColor = vec4(u_color.rgb, 0.0);
    } else {
      gl_FragColor = u_color;
    }
}
`;

Shader.create("dash", vertexSource, fragmentSource);
