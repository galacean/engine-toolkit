int row = pointIndex * ELEMENT_COUNT / int(u_verticesTextureWidth);
int col = pointIndex * ELEMENT_COUNT % int(u_verticesTextureWidth);

vec4 rows[ELEMENT_COUNT];
for( int i = 0; i < ELEMENT_COUNT; i++ ) {
  rows[i] = getVertexElement(float(row), float(col + i));
}

vec3 POSITION = vec3(rows[0].x, rows[0].y, rows[0].z);
int row_index = 0;
int value_index = 2;
#ifdef RENDERER_HAS_NORMAL
vec3 NORMAL = getVec3(rows, row_index, value_index);
#endif

#ifdef RENDERER_HAS_VERTEXCOLOR
vec4 COLOR_0 = getVec4(rows, row_index, value_index);
#endif

#ifdef RENDERER_HAS_WEIGHT
vec4 WEIGHTS_0 = getVec4(rows, row_index, value_index);
#endif

#ifdef RENDERER_HAS_JOINT
vec4 JOINTS_0 = getVec4(rows, row_index, value_index);
#endif

#ifdef RENDERER_HAS_TANGENT
vec4 TANGENT = getVec4(rows, row_index, value_index);
#endif

#ifdef RENDERER_HAS_UV
vec2 TEXCOORD_0 = getVec2(rows, row_index, value_index);
#endif
