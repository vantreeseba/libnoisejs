/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(1);


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

window.GL = __webpack_require__(2);

const foo = 3


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

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

    this._selectProgram(this.createProgram(__webpack_require__(5)));
    // this._selectProgram(this.createProgram(require('./glsl/test/laser.glsl')));

    const color = this._getUniformLocation('options.color');
    const time = this._getUniformLocation('time');
    const resolution = this._getUniformLocation('resolution');

    this.uniforms = {};
    this.uniforms.time = time;
    this.uniforms.color = color;

    this.context.uniform1f(time, this.time);
    this.context.uniform2fv(resolution, new Float32Array([this.canvas.width, this.canvas.height]));
    this.context.uniform4fv(color, new Float32Array([1, 0, 0, 1]));

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

    gl.viewportWidth = this.canvas.width;
    gl.viewportHeight = this.canvas.height;
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

    gl.clearColor(0.0, 0.1, 0.0, 1.0);
  }

  /**
   * Select current program.
   * @param {Object} program
   * @return {undefined}
   */
  _selectProgram(program){
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
      passThrough = __webpack_require__(4);

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
  bindVertices(program){
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
      -1.0, 1.0, 0.0 // top left
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
      0, 2, 3 // top left triangle
    ];
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexIndices), gl.STATIC_DRAW);
  }

  /**
   * Update the delta time passed to shaders.
   * @return {undefined}
   */
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
    this.context.uniform1f(this.uniforms.time, this.dtTime);

    this.context.clear(this.context.COLOR_BUFFER_BIT);
    this.context.drawElements(this.context.TRIANGLES, 6, this.context.UNSIGNED_SHORT, 0);
    requestAnimationFrame(this.runLoop.bind(this));
  }
}

module.exports = GL;


/***/ }),
/* 3 */,
/* 4 */
/***/ (function(module, exports) {

module.exports = "// vertex shader for a single quad\n// work is performed in the operation specific texture shader\n\nprecision highp float;\n\nattribute vec3 pos;\nattribute vec2 tex;\nvarying vec2   outTex;\nvoid main(void)\n{\n  // just pass the position and texture coords\n  gl_Position = vec4(pos, 1.0);\n  outTex = tex;\n}\n"

/***/ }),
/* 5 */
/***/ (function(module, exports) {

module.exports = "precision mediump float;\n\nstruct test_options {\n  vec4 color;\n};\n\nuniform test_options options;\n\nvoid main() {\n  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); // options.color; \n}\n\n"

/***/ })
/******/ ]);
//# sourceMappingURL=app.js.map
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsImZpbGUiOiJhcHAuanM/OGMwMDQxZjRiNjc0NzFmOGFiMzIiLCJzb3VyY2VSb290IjoiIn0=