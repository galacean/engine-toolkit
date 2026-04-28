sampler2D u_verticesSampler;
float u_verticesTextureWidth;
float u_verticesTextureHeight;

sampler2D u_indicesSampler;
float u_indicesTextureWidth;
float u_indicesTextureHeight;

vec4 getVertexElement(float row, float col) {
  return texture2D(u_verticesSampler, vec2((col + 0.5) / u_verticesTextureWidth, (row + 0.5) / u_verticesTextureHeight));
}

vec3 getIndicesElement(float row, float col) {
  return texture2D(u_indicesSampler, vec2((col + 0.5) / u_indicesTextureWidth, (row + 0.5) / u_indicesTextureHeight )).xyz;
}

vec2 getVec2(inout vec4[ELEMENT_COUNT] rows, inout int row_index, inout int value_index) {
  row_index += (value_index+1)/4;
  value_index = (value_index+1)%4;
  float x = rows[row_index][value_index];

  row_index += (value_index+1)/4;
  value_index = (value_index+1)%4;
  float y = rows[row_index][value_index];

  return vec2(x, y);
}

vec3 getVec3(inout vec4[ELEMENT_COUNT] rows, inout int row_index, inout int value_index) {
  row_index += (value_index+1)/4;
  value_index = (value_index+1)%4;
  float x = rows[row_index][value_index];

  row_index += (value_index+1)/4;
  value_index = (value_index+1)%4;
  float y = rows[row_index][value_index];

  row_index += (value_index+1)/4;
  value_index = (value_index+1)%4;
  float z = rows[row_index][value_index];
  return vec3(x, y, z);
}

vec4 getVec4(inout vec4[ELEMENT_COUNT] rows, inout int row_index, inout int value_index) {
  row_index += (value_index+1)/4;
  value_index = (value_index+1)%4;
  float x = rows[row_index][value_index];

  row_index += (value_index+1)/4;
  value_index = (value_index+1)%4;
  float y = rows[row_index][value_index];

  row_index += (value_index+1)/4;
  value_index = (value_index+1)%4;
  float z = rows[row_index][value_index];

  row_index += (value_index+1)/4;
  value_index = (value_index+1)%4;
  float w = rows[row_index][value_index];
  return vec4(x, y, z, w);
}
