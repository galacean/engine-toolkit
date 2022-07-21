exported_funcs="['_build_solid_line','_build_dash_line']"

emcc -Os --no-entry\
 -s ERROR_ON_UNDEFINED_SYMBOLS=0\
 -s STANDALONE_WASM=1\
 -s STACK_OVERFLOW_CHECK=1\
 -s EXPORTED_FUNCTIONS="$exported_funcs"\
 ./line.c -o ./line.wasm

