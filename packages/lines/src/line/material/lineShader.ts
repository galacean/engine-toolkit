import { Shader } from "@galacean/engine";

//-- Shader 代码
const vertexSource = `
attribute vec2 a_pos;
attribute vec2 a_normal;
attribute vec2 a_data;

uniform mat4 galacean_MVPMat;
uniform float u_width;

varying vec2 v_origin;
varying vec2 v_position;
varying float v_direction;
varying float v_part;

void main() {
    v_direction = a_data.x;
    v_part = a_data.y;
    float layer_index = 1.0;

    v_origin = a_pos;
    vec2 position = a_pos + a_normal * u_width;
    v_position = position;
    gl_Position = galacean_MVPMat * vec4(position, 0.0, 1);
}
  `;

const fragmentSource = `
precision highp float;

uniform vec4 u_color;
uniform int u_join;
uniform int u_cap;
uniform float u_width;

varying vec2 v_origin;
varying vec2 v_position;
varying float v_direction;
varying float v_part;

float IS_CAP = 0.0;

void main() {
    vec4 finalColor;
    if (u_cap == 0 && v_part == IS_CAP) {
      if (distance(v_position, v_origin) > u_width) {
        discard;
      }
    }
    if (u_join == 1 && v_part > 1.0) {
      if (distance(v_position, v_origin) > u_width) {
        discard;
      }
    }

    gl_FragColor = u_color;
}

  `;

Shader.create("line", vertexSource, fragmentSource);
