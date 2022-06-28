#include <math.h>

struct Vertex {
    float x;
    float y;
    float offset_x;
    float offset_y;
    short direction;
    short part;
    float lengthsofar;
};

const static int CAP_ROUND = 0;
const static int CAP_BUTT = 1;
const static int CAP_SQUARE = 2;

const static int JOIN_MITER = 0;
const static int JOIN_ROUND = 1;
const static int JOIN_BEVEL = 2;

const static char IS_CAP = 0;
const static char IS_JOIN = 2;
const static char IS_LINE = 1;

extern void consoleLog(int arg);

void scaleAndAdd(float x1, float y1, float x2, float y2, float scale, float *out);
void reflect(float x1, float y1, float x2, float y2, float *out);
void normalize(float *vector);
float dot(float x1, float y1, float x2, float y2);
float length(float x, float y);
int use_normal(float tangent_x, float tangent_y, float normal_x, float normal_y, int join, int index);
void calc_normal(float x, float y, int index, float *out);
void calc_cap(float vx, float vy, int index, int cap, float *out);
void calc_offset(float x1, float y1, float x2, float y2, int index, float *out);
void calc_offset2(float x1, float y1, float x2, float y2, int index, int join, char part, float *out);
void generate_vertex(float x, float y, float* vector, int cap, int join, char index,
                 float *other_vector, char part, struct Vertex *result, int v_index);
void build_solid_line(float* data, int point_length, int join, int cap, int count, struct Vertex* vertices, unsigned short* indices);
void store_vertex(float x, float y, float offset_x, float offset_y,
           char direction, char part, float lengthsofar, struct Vertex *result, int index);

void calc_offset8(float x1, float y1, float x2, float y2, int index, int join, float *out);
void calc_offset_dash(float x1, float y1, float x2, float y2, int index, char part, float *out);
void calc_offset_other(float x1, float y1, float x2, float y2, float index, float *out);
void generate_dash_vertex(float x, float y, float vx, float vy, int cap, int join, char index,
                      float lengthsofar, float ovx, float ovy, char part, struct Vertex *result, int v_index);
void build_dash_line(float *data, int point_length, int join, int cap, float lengthsofar, int count, struct Vertex* vertices, unsigned short* indices);
void store_index(int index, int inner_count, short is_counter_clockwise, unsigned short *out, int i_index);

void scaleAndAdd(float x1, float y1, float x2, float y2, float scale, float *out) {
    out[0] = x1  + x2 * scale;
    out[1] = y1  + y2 * scale;
}

void reflect(float x1, float y1, float x2, float y2, float *out) {
    float scale = -2 * dot(x2, y2, x1, y1);
    scaleAndAdd(x2, y2, x1, y1, scale, out);
}

float dot(float x1, float y1, float x2, float y2) {
    return x1 * x2 + y1 * y2;
};

float length(float x, float y) {
    return sqrtf(x * x + y * y);
}

void normalize(float *vector) {
    float x = vector[0];
    float y = vector[1];
    float len = x * x + y * y;
    if (len > 0) {
        // TODO: evaluate use of glm_invsqrt here?
        len = 1 / sqrt(len);
        vector[0] = x * len;
        vector[1] = y * len;
    } else {
        vector[0] = 0;
        vector[1] = 0;
    }
}

int use_normal(float tangent_x, float tangent_y, float normal_x, float normal_y, int join, int index) {
    float cos = dot(tangent_x, tangent_y, normal_x, normal_y);
    if (join == JOIN_BEVEL || join == JOIN_ROUND) {
        if ((index == 0 || index == 1) && cos > 0) {
            return 1;
        } else if ((index == 2 || index == 3) && cos < 0) {
            return 1;
        }
    }
    if ((index == 0 || index == 1) && cos < 0) {
        return 1;
    } else if ((index == 2 || index == 3) && cos > 0) {
        return 1;
    }
    return 0;
};


void calc_normal(float x, float y, int index, float *out) {
    if (index % 2 == 0) {
        out[0] = -y;
        out[1] = x;
    } else {
        out[0] = y;
        out[1] = -x;
    }
}


void calc_cap(float vx, float vy, int index, int cap, float *out) {
    float normal[2] = {0};
    calc_normal(vx, vy, index, normal);

    out[0] = normal[0];
    out[1] = normal[1];
    if (cap != CAP_BUTT) {
        if (index == 4 || index == 5) {
            out[0] = normal[0] - vx;
            out[1] = normal[1] - vy;
        } else {
            out[0] = normal[0] + vx;
            out[1] = normal[1] + vy;
        }
    }
}

void calc_offset(float x1, float y1, float x2, float y2, int index, float *out) {
    float normal[2] = {0};
    calc_normal(x1, y1, index, normal);

    float tangent[2] = {x1 + x2, y1 + y2};
    normalize(tangent);
    
    float cos = dot(normal[0], normal[1], -tangent[1], tangent[0]);
    // 锐角角度太小，miter过长，截断处理
    if (fabsf(cos) < 0.1) {
        cos = 1;
    }
    float miter = 1 / cos;
    float offset_x = -tangent[1] * miter;
    float offset_y = tangent[0] * miter;
    cos = dot(x1, y1, offset_x, offset_y);
    if (cos < 0) {
        offset_x = -offset_x;
        offset_y = -offset_y;
    }
    out[0] = offset_x;
    out[1] = offset_y;
    out[2] = cos;
}

void calc_offset2(float x1, float y1, float x2, float y2, int index, int join, char part, float *out) {
    float normal[2] = {0};
    calc_normal(x1, y1, index, normal);
    
    float local_x = x1, local_y = y1;
    if (index == 0 || index == 1) {
        x1 = x2;
        y1 = y2;
        x2 = local_x;
        y2 = local_y;
    }
    if (part == IS_CAP) { // 第一个点或最后一个点
        out[0] = normal[0];
        out[1] = normal[1];
        return;
    }
    float tangent[2] = {x1 + x2, y1 + y2};
    normalize(tangent);

    int is_use_normal = use_normal(tangent[0], tangent[1], normal[0], normal[1], join, index);
    if (is_use_normal) {
        out[0] = normal[0];
        out[1] = normal[1];
        return;
    }

    float cos = dot(normal[0], normal[1], -tangent[1], tangent[0]);
    // 锐角角度太小，miter过长，截断处理
    if (fabsf(cos) < 0.1) {
        cos = 1;
    }
    float miter = 1 / cos;
    out[0] = -tangent[1] * miter;
    out[1] = tangent[0] * miter;
}


void generate_vertex(float x, float y, float *vector, int cap, int join, char index,
                 float *other_vector, char part, struct Vertex *result, int v_index) {
    char direction = index % 2 == 0 ? 1 : -1;
    float res[3] = {0, 0, 0};
    if (index == 4 || index == 5 || index == 6 || index == 7) {
        calc_cap(vector[0], vector[1], index, cap, res);
    } else if (index == 0 || index == 1 || index == 2 || index == 3) {
        calc_offset2(vector[0], vector[1], other_vector[0], other_vector[1], index, join, part, res);
    } else if (index == 8) {
        calc_offset(vector[0], vector[1], other_vector[0], other_vector[1], index, res);
        float cos = res[2];
        if (cos < 0) {
            direction = -direction;
        }
    }

    store_vertex(x, y, res[0], res[1], direction, part, 0, result, v_index);
}

void store_vertex(float x, float y, float offset_x, float offset_y,
           char direction, char part, float lengthsofar, struct Vertex *result, int index) {
    struct Vertex vertex;
    vertex.x = x;
    vertex.y = y;
    vertex.offset_x = offset_x;
    vertex.offset_y = offset_y;
    vertex.direction = direction;
    vertex.part = part;
    vertex.lengthsofar = lengthsofar;
    result[index] = vertex;
}

int get_solid_vertex_count(int point_length, int join) {
    if (join == JOIN_ROUND) {
        return point_length * 5 - 2;
    } else {
        return point_length * 4;
    }
}
int get_dash_vertex_count(int point_length, int join) {
    if (join == JOIN_MITER) {
        return point_length * 7 - 6;
    } else {
        return point_length * 5 - 2;
    }
}

void build_solid_line(float* data, int point_length, int join, int cap, int count, struct Vertex* vertices, unsigned short* indices) {
    float vector[2] = {data[2] - data[0], data[3] - data[1]};
    float other_vector[2] = {0, 0};
    int inner_count = -1;
    short is_counter_clockwise = 1;
    normalize(vector);
    int index = 0;
    int i_index = 0;
    count++;
    inner_count++;
    generate_vertex(data[0], data[1], vector, cap, join, 4,
                other_vector, IS_CAP, vertices, index++);

    count++;
    inner_count++;
    generate_vertex(data[0], data[1], vector, cap, join, 5,
            other_vector, IS_CAP, vertices, index++);

    for (int i = 0; i < point_length - 1; i++) {
        float xi = data[i * 2];
        float yi = data[i * 2 + 1];
        float xi_next = data[i * 2 + 2];
        float yi_next = data[i * 2 + 3];
        vector[0] = xi_next - xi;
        vector[1] = yi_next - yi;
        normalize(vector);
        float vector_prev[2] = {0, 0};
        if (i != 0) {
            float xi_prev = data[i * 2 - 2];
            float yi_prev = data[i * 2 - 1];
            vector_prev[0] = xi - xi_prev;
            vector_prev[1] = yi - yi_prev;
            normalize(vector_prev);
        }
        float vector_next[2] = {0, 0};
        if (i != point_length - 2) {
            float xi_next_next = data[i * 2 + 4];
            float yi_next_next = data[i * 2 + 5];
            vector_next[0] = xi_next_next - xi_next;
            vector_next[1] = yi_next_next - yi_next;
            normalize(vector_next);
        }

        generate_vertex(xi, yi, vector, cap, join, 0, vector_prev, i == 0 ? IS_CAP : IS_LINE, vertices, index++);
        store_index(++count, ++inner_count, is_counter_clockwise, indices, i_index);
        i_index += 3;

        generate_vertex(xi, yi, vector, cap, join, 1, vector_prev, i == 0 ? IS_CAP : IS_LINE, vertices, index++);
        store_index(++count, ++inner_count, is_counter_clockwise, indices, i_index);
        i_index += 3;

        generate_vertex(xi_next, yi_next, vector, cap, join, 2,
                    vector_next, i == point_length - 2 ? IS_CAP : IS_LINE, vertices, index++);
        store_index(++count, ++inner_count, is_counter_clockwise, indices, i_index);
        i_index += 3;

        generate_vertex(xi_next, yi_next, vector, cap, join, 3,
                    vector_next, i == point_length - 2 ? IS_CAP : IS_LINE, vertices, index++);
        store_index(++count, ++inner_count, is_counter_clockwise, indices, i_index);
        i_index += 3;

        if (join == JOIN_ROUND && i != point_length - 2) {
            generate_vertex(xi_next, yi_next, vector, cap, join, 8,
                        vector_next, IS_JOIN, vertices, index++);
            store_index(++count, ++inner_count, is_counter_clockwise, indices, i_index);
            i_index += 3;
            is_counter_clockwise = is_counter_clockwise ? 0 : 1;
        }
    }

    vector[0] = data[point_length * 2 - 2] - data[point_length * 2 - 4];
    vector[1] = data[point_length * 2 - 1] - data[point_length * 2 - 3];

    normalize(vector);

    other_vector[0] = 0;
    other_vector[1] = 0;

    generate_vertex(data[point_length * 2 - 2], data[point_length * 2 - 1], vector, cap, join, 6,
                other_vector, IS_CAP, vertices, index++);
    store_index(++count, ++inner_count, is_counter_clockwise, indices, i_index);
    i_index += 3;

    generate_vertex(data[point_length * 2 - 2], data[point_length * 2 - 1], vector, cap, join, 7,
                other_vector, IS_CAP, vertices, index++);
    store_index(++count, ++inner_count, is_counter_clockwise, indices, i_index);
    i_index += 3;
}

void calc_offset_dash(float x1, float y1, float x2, float y2, int index, char part, float *out) {
    float normal[2] = {0};
    calc_normal(x1, y1, index, normal);
    float normal_x = normal[0];
    float normal_y = normal[1];

    out[0] = normal_x;
    out[1] = normal_y;
    float local_x = x1, local_y = y1;
    if (index == 0 || index == 1) {
        x1 = x2;
        y1 = y2;
        x2 = local_x;
        y2 = local_y;
    }
    if (part == IS_CAP) { // 第一个点或最后一个点
        return;
    }
    float tangent[2] = {x1 + x2, y1 + y2};
    normalize(tangent);
    float tangent_x = tangent[0];
    float tangent_y = tangent[1];

    float cos = dot(normal_x, normal_y, -tangent_y, tangent_x);
    // 锐角角度太小，miter过长，截断处理
    if (fabsf(cos) < 0.1) {
        cos = 1;
    }
    float miter = 1 / cos;
    float offset_x = -tangent_y * miter;
    float offset_y = tangent_x * miter;
    out[0] = offset_x;
    out[1] = offset_y;
    cos = dot(local_x, local_y, offset_x, offset_y);
    if (index == 2 || index == 3) {
        if (cos > 0) {
            reflect(normal_x, normal_y, -offset_x, -offset_y, out);
        }
    } else if (index == 0 || index == 1) {
        if (cos < 0) {
            reflect(normal_x, normal_y, -offset_x, -offset_y, out);
        }
    }
}
void calc_offset8(float x1, float y1, float x2, float y2, int index, int join, float *out) {
    float normal[2] = {0};
    calc_normal(x1, y1, index, normal);
    float normal_x = normal[0];
    float normal_y = normal[1];

    float tangent_x = x1 + x2;
    float tangent_y = y1 + y2;
    float tangent[2] = {0};
    if (tangent_x == 0 && tangent_y == 0) {
        tangent[0] = x2;
        tangent[1] = y2;
        normalize(tangent);
    } else {
        tangent[0] = tangent_x;
        tangent[1] = tangent_y;
        normalize(tangent);
    }
    tangent_x = tangent[0];
    tangent_y = tangent[1];
    
    float cos = dot(normal_x, normal_y, -tangent_y, tangent_x);
    // 锐角角度太小，miter过长，截断处理
    if (fabsf(cos) < 0.1) {
        cos = 1;
    }
    float miter = 1 / cos;
    float offset_x = -tangent_y * miter;
    float offset_y = tangent_x * miter;
    cos = dot(x1, y1, offset_x, offset_y);
    if (cos < 0) {
        offset_x = -offset_x;
        offset_y = -offset_y;
    }
    if (join == JOIN_BEVEL) {
        offset_x = -offset_x;
        offset_y = -offset_y;
    }
    out[0] = offset_x;
    out[1] = offset_y;
    out[2] = cos;
}

void calc_offset_other(float x1, float y1, float x2, float y2, float index, float *out) {
    float normal[2] = {0};
    calc_normal(x1, y1, index, normal);
    float normal_x = normal[0];
    float normal_y = normal[1];

    float tangent_x = x1 + x2;
    float tangent_y = y1 + y2;
    if (tangent_x == 0 && tangent_y == 0) {
        tangent_x = x1;
        tangent_y = y1;
    }
    float offset_x = -tangent_y;
    float offset_y = tangent_x;
    float cos = dot(x1, y1, offset_x, offset_y);
    if (cos > 0) {
        normal_x = -normal_x;
        normal_y = -normal_y;
    }
    out[0] = normal_x;
    out[1] = normal_y;
    out[2] = cos;
}


void generate_dash_vertex(float x, float y, float vx, float vy, int cap, int join, char index,
                      float lengthsofar, float ovx, float ovy, char part, struct Vertex *result, int v_index) {
    char direction = index % 2 == 0 ? 1 : -1;
    float offset_x = 0;
    float offset_y = 0;
    if (index == 4 || index == 5 || index == 6 || index == 7) {
        float cap_res[2] = {0};
        calc_cap(vx, vy, index, cap, cap_res);
        offset_x = cap_res[0];
        offset_y = cap_res[1];
    } else if (index == 0 || index == 1 || index == 2 || index == 3) {
        float offset_dash_res[2] = {0};
        calc_offset_dash(vx, vy, ovx, ovy, index, part, offset_dash_res);
        offset_x = offset_dash_res[0];
        offset_y = offset_dash_res[1];
    } else if (index == 8) {
        float offset8_res[3] = {0};
        calc_offset8(vx, vy, ovx, ovy, index, join, offset8_res);
        offset_x = offset8_res[0];
        offset_y = offset8_res[1];
        float cos = offset8_res[2];
        if (join == JOIN_BEVEL) {
            if (cos > 0) {
                direction = -direction;
            }
        } else {
            if (cos < 0) {
                direction = -direction;
            }
        }
    } else {
        float offset_other_res[3] = {0};
        calc_offset_other(vx, vy, ovx, ovy, index, offset_other_res);
        offset_x = offset_other_res[0];
        offset_y = offset_other_res[1];
        float cos = offset_other_res[2];
        if (cos > 0) {
            direction = -direction;
        }
    }
    store_vertex(x, y, offset_x, offset_y, direction, part, lengthsofar, result, v_index);

}

void build_dash_line(float *data, int point_length, int join, int cap, float lengthsofar, int count, struct Vertex* vertices, unsigned short* indices) {
    int index = 0;
    int i_index = 0;
    float vector_x = data[2] - data[0];
    float vector_y = data[3] - data[1];
    int inner_count = -1;
    short is_counter_clockwise = 1;
    float vector[2] = {vector_x, vector_y};
    normalize(vector);
    vector_x = vector[0];
    vector_y = vector[1];
    count++;
    inner_count++;
    generate_dash_vertex(data[0], data[1], vector_x, vector_y, cap, join, 4, lengthsofar,
                     0, 0, IS_CAP, vertices, index++);

    count++;
    inner_count++;
    generate_dash_vertex(data[0], data[1], vector_x, vector_y, cap, join, 5, lengthsofar,
                     0, 0, IS_CAP, vertices, index++);

    for (int i = 0; i < point_length - 1; i++) {
        float xi = data[i * 2];
        float yi = data[i * 2 + 1];
        float xi_next = data[i * 2 + 2];
        float yi_next = data[i * 2 + 3];
        vector_x = xi_next - xi;
        vector_y = yi_next - yi;
        float orig_vector_x = vector_x;
        float orig_vector_y = vector_y;
        float vector1[2] = {vector_x, vector_y};
        normalize(vector1);
        vector_x = vector1[0];
        vector_y = vector1[1];

        float vector_x_prev = 0, vector_y_prev = 0;
        if (i != 0) {
            float xi_prev = data[i * 2 - 2];
            float yi_prev = data[i * 2 - 1];
            vector_x_prev = xi - xi_prev;
            vector_y_prev = yi - yi_prev;
            float vector_prev[2] = {vector_x_prev, vector_y_prev};
            normalize(vector_prev);
            vector_x_prev = vector_prev[0];
            vector_y_prev = vector_prev[1];
        }

        float vector_x_next = 0, vector_y_next = 0;
        if (i != point_length - 2) {
            float xi_next_next = data[i * 2 + 4];
            float yi_next_next = data[i * 2 + 5];
            vector_x_next = xi_next_next - xi_next;
            vector_y_next = yi_next_next - yi_next;
            float vector_next[2] = {vector_x_next, vector_y_next};
            normalize(vector_next);
            vector_x_next = vector_next[0];
            vector_y_next = vector_next[1];
        }
        if (i != 0 && join == JOIN_BEVEL) {
            generate_dash_vertex(xi, yi, vector_x, vector_y, cap, join, 10, lengthsofar,
                            vector_x_prev, vector_y_prev, IS_JOIN, vertices, index++);
            store_index(++count, ++inner_count, is_counter_clockwise, indices, i_index);
            i_index += 3;
            is_counter_clockwise = is_counter_clockwise ? 0 : 1;
        }

        generate_dash_vertex(xi, yi, vector_x, vector_y, cap, join, 0, lengthsofar, vector_x_prev,
                         vector_y_prev, i == 0 ? IS_CAP : IS_LINE, vertices, index++);
        store_index(++count, ++inner_count, is_counter_clockwise, indices, i_index);
            i_index += 3;

        generate_dash_vertex(xi, yi, vector_x, vector_y, cap, join, 1, lengthsofar, vector_x_prev,
                         vector_y_prev, i == 0 ? IS_CAP : IS_LINE, vertices, index++);
        store_index(++count, ++inner_count, is_counter_clockwise, indices, i_index);
            i_index += 3;

        lengthsofar += length(orig_vector_x, orig_vector_y);

        generate_dash_vertex(xi_next, yi_next, vector_x, vector_y, cap, join, 2, lengthsofar,
                         vector_x_next, vector_y_next, i == point_length - 2 ? IS_CAP : IS_LINE, vertices, index++);
        store_index(++count, ++inner_count, is_counter_clockwise, indices, i_index);
            i_index += 3;

        generate_dash_vertex(xi_next, yi_next, vector_x, vector_y, cap, join, 3, lengthsofar,
                         vector_x_next, vector_y_next, i == point_length - 2 ? IS_CAP : IS_LINE, vertices, index++);
        store_index(++count, ++inner_count, is_counter_clockwise, indices, i_index);
            i_index += 3;

        if (i != point_length - 2) {
            if (join == JOIN_BEVEL) {
                generate_dash_vertex(xi_next, yi_next, vector_x, vector_y, cap, join, 9, lengthsofar,
                                 vector_x_next, vector_y_next, IS_JOIN, vertices, index++);
                store_index(++count, ++inner_count, is_counter_clockwise, indices, i_index);
                i_index += 3;
                is_counter_clockwise = is_counter_clockwise ? 0 : 1;
            }
            generate_dash_vertex(xi_next, yi_next, vector_x, vector_y, cap, join, 8, lengthsofar,
                             vector_x_next, vector_y_next, IS_JOIN, vertices, index++);
            store_index(++count, ++inner_count, is_counter_clockwise, indices, i_index);
            i_index += 3;
            is_counter_clockwise = is_counter_clockwise ? 0 : 1;
        }
    }


    vector_x = data[point_length * 2 - 2] - data[point_length * 2 - 4];
    vector_y = data[point_length * 2 - 1] - data[point_length * 2 - 3];
    float vector3[2] = {vector_x, vector_y};
    normalize(vector3);
    vector_x = vector3[0];
    vector_y = vector3[1];

    generate_dash_vertex(data[point_length * 2 - 2], data[point_length * 2 - 1], vector_x, vector_y, cap, join, 6, lengthsofar,
                     0, 0, IS_CAP, vertices, index++);
    store_index(++count, ++inner_count, is_counter_clockwise, indices, i_index);
            i_index += 3;

    generate_dash_vertex(data[point_length * 2 - 2], data[point_length * 2 - 1], vector_x, vector_y, cap, join, 7, lengthsofar,
                     0, 0, IS_CAP, vertices, index++);
    store_index(++count, ++inner_count, is_counter_clockwise, indices, i_index);
                i_index += 3;
}

void store_index(int index, int inner_count, short is_counter_clockwise, unsigned short *out, int i_index) {
    if (inner_count % 2 == 0) {
        if (is_counter_clockwise) {
            out[i_index++] = index - 2;
            out[i_index++] = index - 1;
            out[i_index++] = index;
        } else {
            out[i_index++] = index - 1;
            out[i_index++] = index - 2;
            out[i_index++] = index;
        }
    } else {
        if (is_counter_clockwise) {
            out[i_index++] = index - 1;
            out[i_index++] = index - 2;
            out[i_index++] = index;
        } else {
            out[i_index++] = index - 2;
            out[i_index++] = index - 1;
            out[i_index++] = index;
        }
    }
}
