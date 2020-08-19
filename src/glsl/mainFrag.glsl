precision mediump float;

struct test_options {
  vec4 color;
};

uniform test_options options;

void main() {
  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); // options.color; 
}

