precision mediump float;

struct test_options {
  vec4 color;
};

uniform test_options options;

void main() {
  gl_FragColor = options.color; 
}
