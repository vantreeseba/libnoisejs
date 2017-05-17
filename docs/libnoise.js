(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = function(strings) {
  if (typeof strings === 'string') strings = [strings]
  var exprs = [].slice.call(arguments,1)
  var parts = []
  for (var i = 0; i < strings.length-1; i++) {
    parts.push(strings[i], exprs[i] || '')
  }
  parts.push(strings[i])
  return parts.join('')
}

},{}],2:[function(require,module,exports){
var glslify = require('glslify');

/**
 * GL
 */
class GL {

  /**
   * @param {Object} options
   * @returns {GL}
   */
  constructor(options){
    options = options || {};

    this.canvas = options.canvas || document.createElement('canvas');
    this.context = this.canvas.getContext('webgl');
    this.context.clearColor(0.5, 0, 0, 1.0);

    this.POSITION_UNIFORM_NAME = 'pos';
    this.TEXTURE_UNIFORM_NAME = 'tex';

    this._initGl();
    this._createPassThroughVertexShader();

    this.time = Date.now();
    this.dtTime = 0;
    this.dt = 0;

    // this._selectProgram(this.createProgram(glslify('./glsl/mainFrag.glsl')));
    this._selectProgram(this.createProgram(glslify(["precision mediump float;\n#define GLSLIFY 1\n\nuniform float     time;\nuniform vec2     resolution;\n\n#define PI 3.1415926535897932384626433832795\n\nconst float position = 0.0;\nconst float scale = 1.0;\nconst float intensity = 1.0;\n\nfloat band(vec2 pos, float amplitude, float frequency) {\n    float wave = scale * amplitude * sin(1.0 * PI * frequency * pos.x + time) / 2.05;\n    float light = clamp(amplitude * frequency * 0.02, 0.001 + 0.001 / scale, 5.0) * scale / abs(wave - pos.y);\n    return light;\n}\n\nvoid main() {\n\n    vec3 color = vec3(1.5, 0.5, 10.0);\n    color = color == vec3(0.0)? vec3(10.5, 0.5, 1.0) : color;\n    vec2 pos = (gl_FragCoord.xy / resolution.xy);\n    pos.y += - 0.5;\n    float spectrum = 0.0;\n    const float lim = 28.0;\n    #define time time*0.037 + pos.x*10.\n    for(float i = 0.0; i < lim; i++){\n        spectrum += band(pos, 1.0*sin(time*0.1/PI), 1.0*sin(time*i/lim))/pow(lim, 0.25);\n    }\n\n    spectrum += band(pos, cos(10.7), 2.5);\n    spectrum += band(pos, 0.4, sin(2.0));\n    spectrum += band(pos, 0.05, 4.5);\n    spectrum += band(pos, 0.1, 7.0);\n    spectrum += band(pos, 0.1, 1.0);\n\n    gl_FragColor = vec4(color * spectrum, spectrum);\n}\n"])));

    // const color = this._getUniformLocation('options.color');
    const time = this._getUniformLocation('time');
    const resolution = this._getUniformLocation('resolution');

    // this.context.uniform4fv(color, new Float32Array([1, 0, 0, 1]));
    this.uniforms = {};
    this.uniforms.time = time;

    this.context.uniform1f(time, this.time);
    this.context.uniform2fv(resolution, new Float32Array([256, 256]));

    this.foo = 0;
  }

  /**
   * @param {String} name
   * @return {undefined}
   */
  _getUniformLocation(name) {
    return this.context.getUniformLocation(this.program, name);
  }

  /**
   * _initGl
   * @return {undefined}
   */
  _initGl(){
    const gl = this.context;

    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

    gl.clearColor(0.0, 0.1, 0.0, 1.0);
  }

  /**
   * Select current program.
   * @param {Object} program
   * @return {undefined}
   */
  _selectProgram(program) {
    this.program = program;
    this.context.useProgram(program);
    this.bindVertices(program);
  }

  /**
   * Create the passthrough vertex shader.
   * @returns {undefined}
   */
  _createPassThroughVertexShader(){
    const self = this,
      gl = self.context,
      passThrough = glslify(["// vertex shader for a single quad\n// work is performed in the operation specific texture shader\n\nprecision highp float;\n#define GLSLIFY 1\n\nattribute vec3 pos;\nattribute vec2 tex;\nvarying vec2   outTex;\nvoid main(void)\n{\n  // just pass the position and texture coords\n  gl_Position = vec4(pos, 1.0);\n  outTex = tex;\n}\n"]);

    self.vertexShader = gl.createShader(gl.VERTEX_SHADER);
    self.context.shaderSource(self.vertexShader, passThrough);
    gl.compileShader(self.vertexShader);
  }

  /**
   * Compile a fragment shader.
   * @param {String} source Source code for the shader.
   * @returns {Object} program The compiled fragment shader.
   */
  createProgram(source) {
    const self = this,
      gl = self.context,
      shader = gl.createShader(gl.FRAGMENT_SHADER);

    // compile the provided fragment/texture shader
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader));
    }

    // link the program specific fragment shader and the generic pass through
    // shader into a program
    const program = gl.createProgram();
    gl.attachShader(program, self.vertexShader);
    gl.attachShader(program, shader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program));
    }

    return program;
  }

  /**
   * bindVertices
   * @param {Object} program
   * @return {undefined}
   */
  bindVertices(program) {
    var gl = this.context,
      renderer = program;

    // bind vertices
    var position = gl.getAttribLocation(renderer, this.POSITION_UNIFORM_NAME);
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    // define a square that covers the screen
    var vertices = [
      -1.0, -1.0, 0.0, // bottom left
      1.0, -1.0, 0.0,	 // bottom right
      1.0, 1.0, 0.0,	 // top right
      -1.0, 1.0, 0.0   // top left
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(position);

	// bind texture cords
    var texture = gl.getAttribLocation(renderer, this.TEXTURE_UNIFORM_NAME);
    var texCoords = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoords);
    var textureCoords = [
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
    gl.vertexAttribPointer(texture, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texture);

    // index to vertices
    var indices = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
    // tesselate square into triangles
    // indeces into vertex array creating triangles, with counter-clockwise winding
    var vertexIndices = [
      0, 1, 2,	// bottom right triangle
      0, 2, 3   // top left triangle
    ];
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexIndices), gl.STATIC_DRAW);
  }

  _updateTime(){
    const time = Date.now();
    this.dt = time - this.time;
    this.time = time;

    this.dtTime += this.dt/1000;
  }
  /**
   * Run the shader programs in a loop.
   * @return {undefined}
   */
  runLoop(){
    this._updateTime();

    this.context.clear(this.context.COLOR_BUFFER_BIT);

    this.context.uniform1f(this.uniforms.time, this.dtTime);

    // console.log(this.dt);
    this.context.drawElements(this.context.TRIANGLES, 6, this.context.UNSIGNED_SHORT, 0);
    requestAnimationFrame(() => this.runLoop());
  }
}

module.exports = GL;

},{"glslify":1}],3:[function(require,module,exports){
window.GL = require('./GL');

},{"./GL":2}]},{},[3]);
