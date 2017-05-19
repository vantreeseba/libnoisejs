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
    // this._selectProgram(this.createProgram(glslify('./glsl/test/cool.glsl')));
    this._selectProgram(this.createProgram(glslify(["\nprecision mediump float;\n#define GLSLIFY 1\n\nuniform float     time;\nuniform vec2     resolution;\n\n#define PI 3.1415926535897932384626433832795\n\nfloat band(vec2 pos, float amplitude, float frequency) {\n    float wave = amplitude * sin(1.0 * PI * frequency * pos.x + time);\n    return clamp(amplitude * frequency * 0.02, 0.01, 5.0) / abs(wave - pos.y);\n}\n\nvoid main() {\n    vec3 color = vec3(1., 0.25, 0.25);\n\n    //Normalize coords to range [0,1]\n    vec2 pos = (gl_FragCoord.xy / resolution.xy);\n\n    //Move y pos up by half the screen\n    pos.y -= 0.5;\n\n    float spectrum = 0.0;\n    spectrum += band(pos, 0.01, 1.);\n\n    gl_FragColor = vec4((color * spectrum), spectrum);\n}\n"])));

    // const color = this._getUniformLocation('options.color');
    const time = this._getUniformLocation('time');
    const resolution = this._getUniformLocation('resolution');

    // this.context.uniform4fv(color, new Float32Array([1, 0, 0, 1]));
    this.uniforms = {};
    this.uniforms.time = time;

    this.context.uniform1f(time, this.time);
    // this.context.uniform2fv(resolution, new Float32Array([256, 256]));
    this.context.uniform2fv(resolution, new Float32Array([canvas.width, canvas.height]));

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

},{"./GL":2}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZ2xzbGlmeS9icm93c2VyLmpzIiwic3JjL0dMLmpzIiwic3JjL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1TUE7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHN0cmluZ3MpIHtcbiAgaWYgKHR5cGVvZiBzdHJpbmdzID09PSAnc3RyaW5nJykgc3RyaW5ncyA9IFtzdHJpbmdzXVxuICB2YXIgZXhwcnMgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywxKVxuICB2YXIgcGFydHMgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0cmluZ3MubGVuZ3RoLTE7IGkrKykge1xuICAgIHBhcnRzLnB1c2goc3RyaW5nc1tpXSwgZXhwcnNbaV0gfHwgJycpXG4gIH1cbiAgcGFydHMucHVzaChzdHJpbmdzW2ldKVxuICByZXR1cm4gcGFydHMuam9pbignJylcbn1cbiIsInZhciBnbHNsaWZ5ID0gcmVxdWlyZSgnZ2xzbGlmeScpO1xuXG4vKipcbiAqIEdMXG4gKi9cbmNsYXNzIEdMIHtcblxuICAvKipcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAgICogQHJldHVybnMge0dMfVxuICAgKi9cbiAgY29uc3RydWN0b3Iob3B0aW9ucyl7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICB0aGlzLmNhbnZhcyA9IG9wdGlvbnMuY2FudmFzIHx8IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgIHRoaXMuY29udGV4dCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJ3dlYmdsJyk7XG4gICAgdGhpcy5jb250ZXh0LmNsZWFyQ29sb3IoMC41LCAwLCAwLCAxLjApO1xuXG4gICAgdGhpcy5QT1NJVElPTl9VTklGT1JNX05BTUUgPSAncG9zJztcbiAgICB0aGlzLlRFWFRVUkVfVU5JRk9STV9OQU1FID0gJ3RleCc7XG5cbiAgICB0aGlzLl9pbml0R2woKTtcbiAgICB0aGlzLl9jcmVhdGVQYXNzVGhyb3VnaFZlcnRleFNoYWRlcigpO1xuXG4gICAgdGhpcy50aW1lID0gRGF0ZS5ub3coKTtcbiAgICB0aGlzLmR0VGltZSA9IDA7XG4gICAgdGhpcy5kdCA9IDA7XG5cbiAgICAvLyB0aGlzLl9zZWxlY3RQcm9ncmFtKHRoaXMuY3JlYXRlUHJvZ3JhbShnbHNsaWZ5KCcuL2dsc2wvbWFpbkZyYWcuZ2xzbCcpKSk7XG4gICAgLy8gdGhpcy5fc2VsZWN0UHJvZ3JhbSh0aGlzLmNyZWF0ZVByb2dyYW0oZ2xzbGlmeSgnLi9nbHNsL3Rlc3QvY29vbC5nbHNsJykpKTtcbiAgICB0aGlzLl9zZWxlY3RQcm9ncmFtKHRoaXMuY3JlYXRlUHJvZ3JhbShnbHNsaWZ5KFtcIlxcbnByZWNpc2lvbiBtZWRpdW1wIGZsb2F0O1xcbiNkZWZpbmUgR0xTTElGWSAxXFxuXFxudW5pZm9ybSBmbG9hdCAgICAgdGltZTtcXG51bmlmb3JtIHZlYzIgICAgIHJlc29sdXRpb247XFxuXFxuI2RlZmluZSBQSSAzLjE0MTU5MjY1MzU4OTc5MzIzODQ2MjY0MzM4MzI3OTVcXG5cXG5mbG9hdCBiYW5kKHZlYzIgcG9zLCBmbG9hdCBhbXBsaXR1ZGUsIGZsb2F0IGZyZXF1ZW5jeSkge1xcbiAgICBmbG9hdCB3YXZlID0gYW1wbGl0dWRlICogc2luKDEuMCAqIFBJICogZnJlcXVlbmN5ICogcG9zLnggKyB0aW1lKTtcXG4gICAgcmV0dXJuIGNsYW1wKGFtcGxpdHVkZSAqIGZyZXF1ZW5jeSAqIDAuMDIsIDAuMDEsIDUuMCkgLyBhYnMod2F2ZSAtIHBvcy55KTtcXG59XFxuXFxudm9pZCBtYWluKCkge1xcbiAgICB2ZWMzIGNvbG9yID0gdmVjMygxLiwgMC4yNSwgMC4yNSk7XFxuXFxuICAgIC8vTm9ybWFsaXplIGNvb3JkcyB0byByYW5nZSBbMCwxXVxcbiAgICB2ZWMyIHBvcyA9IChnbF9GcmFnQ29vcmQueHkgLyByZXNvbHV0aW9uLnh5KTtcXG5cXG4gICAgLy9Nb3ZlIHkgcG9zIHVwIGJ5IGhhbGYgdGhlIHNjcmVlblxcbiAgICBwb3MueSAtPSAwLjU7XFxuXFxuICAgIGZsb2F0IHNwZWN0cnVtID0gMC4wO1xcbiAgICBzcGVjdHJ1bSArPSBiYW5kKHBvcywgMC4wMSwgMS4pO1xcblxcbiAgICBnbF9GcmFnQ29sb3IgPSB2ZWM0KChjb2xvciAqIHNwZWN0cnVtKSwgc3BlY3RydW0pO1xcbn1cXG5cIl0pKSk7XG5cbiAgICAvLyBjb25zdCBjb2xvciA9IHRoaXMuX2dldFVuaWZvcm1Mb2NhdGlvbignb3B0aW9ucy5jb2xvcicpO1xuICAgIGNvbnN0IHRpbWUgPSB0aGlzLl9nZXRVbmlmb3JtTG9jYXRpb24oJ3RpbWUnKTtcbiAgICBjb25zdCByZXNvbHV0aW9uID0gdGhpcy5fZ2V0VW5pZm9ybUxvY2F0aW9uKCdyZXNvbHV0aW9uJyk7XG5cbiAgICAvLyB0aGlzLmNvbnRleHQudW5pZm9ybTRmdihjb2xvciwgbmV3IEZsb2F0MzJBcnJheShbMSwgMCwgMCwgMV0pKTtcbiAgICB0aGlzLnVuaWZvcm1zID0ge307XG4gICAgdGhpcy51bmlmb3Jtcy50aW1lID0gdGltZTtcblxuICAgIHRoaXMuY29udGV4dC51bmlmb3JtMWYodGltZSwgdGhpcy50aW1lKTtcbiAgICAvLyB0aGlzLmNvbnRleHQudW5pZm9ybTJmdihyZXNvbHV0aW9uLCBuZXcgRmxvYXQzMkFycmF5KFsyNTYsIDI1Nl0pKTtcbiAgICB0aGlzLmNvbnRleHQudW5pZm9ybTJmdihyZXNvbHV0aW9uLCBuZXcgRmxvYXQzMkFycmF5KFtjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHRdKSk7XG5cbiAgICB0aGlzLmZvbyA9IDA7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtTdHJpbmd9IG5hbWVcbiAgICogQHJldHVybiB7dW5kZWZpbmVkfVxuICAgKi9cbiAgX2dldFVuaWZvcm1Mb2NhdGlvbihuYW1lKSB7XG4gICAgcmV0dXJuIHRoaXMuY29udGV4dC5nZXRVbmlmb3JtTG9jYXRpb24odGhpcy5wcm9ncmFtLCBuYW1lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBfaW5pdEdsXG4gICAqIEByZXR1cm4ge3VuZGVmaW5lZH1cbiAgICovXG4gIF9pbml0R2woKXtcbiAgICBjb25zdCBnbCA9IHRoaXMuY29udGV4dDtcblxuICAgIGdsLnZpZXdwb3J0V2lkdGggPSBjYW52YXMud2lkdGg7XG4gICAgZ2wudmlld3BvcnRIZWlnaHQgPSBjYW52YXMuaGVpZ2h0O1xuICAgIGdsLnZpZXdwb3J0KDAsIDAsIGdsLnZpZXdwb3J0V2lkdGgsIGdsLnZpZXdwb3J0SGVpZ2h0KTtcblxuICAgIGdsLmNsZWFyQ29sb3IoMC4wLCAwLjEsIDAuMCwgMS4wKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZWxlY3QgY3VycmVudCBwcm9ncmFtLlxuICAgKiBAcGFyYW0ge09iamVjdH0gcHJvZ3JhbVxuICAgKiBAcmV0dXJuIHt1bmRlZmluZWR9XG4gICAqL1xuICBfc2VsZWN0UHJvZ3JhbShwcm9ncmFtKSB7XG4gICAgdGhpcy5wcm9ncmFtID0gcHJvZ3JhbTtcbiAgICB0aGlzLmNvbnRleHQudXNlUHJvZ3JhbShwcm9ncmFtKTtcbiAgICB0aGlzLmJpbmRWZXJ0aWNlcyhwcm9ncmFtKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgdGhlIHBhc3N0aHJvdWdoIHZlcnRleCBzaGFkZXIuXG4gICAqIEByZXR1cm5zIHt1bmRlZmluZWR9XG4gICAqL1xuICBfY3JlYXRlUGFzc1Rocm91Z2hWZXJ0ZXhTaGFkZXIoKXtcbiAgICBjb25zdCBzZWxmID0gdGhpcyxcbiAgICAgIGdsID0gc2VsZi5jb250ZXh0LFxuICAgICAgcGFzc1Rocm91Z2ggPSBnbHNsaWZ5KFtcIi8vIHZlcnRleCBzaGFkZXIgZm9yIGEgc2luZ2xlIHF1YWRcXG4vLyB3b3JrIGlzIHBlcmZvcm1lZCBpbiB0aGUgb3BlcmF0aW9uIHNwZWNpZmljIHRleHR1cmUgc2hhZGVyXFxuXFxucHJlY2lzaW9uIGhpZ2hwIGZsb2F0O1xcbiNkZWZpbmUgR0xTTElGWSAxXFxuXFxuYXR0cmlidXRlIHZlYzMgcG9zO1xcbmF0dHJpYnV0ZSB2ZWMyIHRleDtcXG52YXJ5aW5nIHZlYzIgICBvdXRUZXg7XFxudm9pZCBtYWluKHZvaWQpXFxue1xcbiAgLy8ganVzdCBwYXNzIHRoZSBwb3NpdGlvbiBhbmQgdGV4dHVyZSBjb29yZHNcXG4gIGdsX1Bvc2l0aW9uID0gdmVjNChwb3MsIDEuMCk7XFxuICBvdXRUZXggPSB0ZXg7XFxufVxcblwiXSk7XG5cbiAgICBzZWxmLnZlcnRleFNoYWRlciA9IGdsLmNyZWF0ZVNoYWRlcihnbC5WRVJURVhfU0hBREVSKTtcbiAgICBzZWxmLmNvbnRleHQuc2hhZGVyU291cmNlKHNlbGYudmVydGV4U2hhZGVyLCBwYXNzVGhyb3VnaCk7XG4gICAgZ2wuY29tcGlsZVNoYWRlcihzZWxmLnZlcnRleFNoYWRlcik7XG4gIH1cblxuICAvKipcbiAgICogQ29tcGlsZSBhIGZyYWdtZW50IHNoYWRlci5cbiAgICogQHBhcmFtIHtTdHJpbmd9IHNvdXJjZSBTb3VyY2UgY29kZSBmb3IgdGhlIHNoYWRlci5cbiAgICogQHJldHVybnMge09iamVjdH0gcHJvZ3JhbSBUaGUgY29tcGlsZWQgZnJhZ21lbnQgc2hhZGVyLlxuICAgKi9cbiAgY3JlYXRlUHJvZ3JhbShzb3VyY2UpIHtcbiAgICBjb25zdCBzZWxmID0gdGhpcyxcbiAgICAgIGdsID0gc2VsZi5jb250ZXh0LFxuICAgICAgc2hhZGVyID0gZ2wuY3JlYXRlU2hhZGVyKGdsLkZSQUdNRU5UX1NIQURFUik7XG5cbiAgICAvLyBjb21waWxlIHRoZSBwcm92aWRlZCBmcmFnbWVudC90ZXh0dXJlIHNoYWRlclxuICAgIGdsLnNoYWRlclNvdXJjZShzaGFkZXIsIHNvdXJjZSk7XG4gICAgZ2wuY29tcGlsZVNoYWRlcihzaGFkZXIpO1xuXG4gICAgaWYgKCFnbC5nZXRTaGFkZXJQYXJhbWV0ZXIoc2hhZGVyLCBnbC5DT01QSUxFX1NUQVRVUykpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihnbC5nZXRTaGFkZXJJbmZvTG9nKHNoYWRlcikpO1xuICAgIH1cblxuICAgIC8vIGxpbmsgdGhlIHByb2dyYW0gc3BlY2lmaWMgZnJhZ21lbnQgc2hhZGVyIGFuZCB0aGUgZ2VuZXJpYyBwYXNzIHRocm91Z2hcbiAgICAvLyBzaGFkZXIgaW50byBhIHByb2dyYW1cbiAgICBjb25zdCBwcm9ncmFtID0gZ2wuY3JlYXRlUHJvZ3JhbSgpO1xuICAgIGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCBzZWxmLnZlcnRleFNoYWRlcik7XG4gICAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIHNoYWRlcik7XG4gICAgZ2wubGlua1Byb2dyYW0ocHJvZ3JhbSk7XG5cbiAgICBpZiAoIWdsLmdldFByb2dyYW1QYXJhbWV0ZXIocHJvZ3JhbSwgZ2wuTElOS19TVEFUVVMpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoZ2wuZ2V0UHJvZ3JhbUluZm9Mb2cocHJvZ3JhbSkpO1xuICAgIH1cblxuICAgIHJldHVybiBwcm9ncmFtO1xuICB9XG5cbiAgLyoqXG4gICAqIGJpbmRWZXJ0aWNlc1xuICAgKiBAcGFyYW0ge09iamVjdH0gcHJvZ3JhbVxuICAgKiBAcmV0dXJuIHt1bmRlZmluZWR9XG4gICAqL1xuICBiaW5kVmVydGljZXMocHJvZ3JhbSkge1xuICAgIHZhciBnbCA9IHRoaXMuY29udGV4dCxcbiAgICAgIHJlbmRlcmVyID0gcHJvZ3JhbTtcblxuICAgIC8vIGJpbmQgdmVydGljZXNcbiAgICB2YXIgcG9zaXRpb24gPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihyZW5kZXJlciwgdGhpcy5QT1NJVElPTl9VTklGT1JNX05BTUUpO1xuICAgIHZhciB2ZXJ0ZXhCdWZmZXIgPSBnbC5jcmVhdGVCdWZmZXIoKTtcbiAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgdmVydGV4QnVmZmVyKTtcblxuICAgIC8vIGRlZmluZSBhIHNxdWFyZSB0aGF0IGNvdmVycyB0aGUgc2NyZWVuXG4gICAgdmFyIHZlcnRpY2VzID0gW1xuICAgICAgLTEuMCwgLTEuMCwgMC4wLCAvLyBib3R0b20gbGVmdFxuICAgICAgMS4wLCAtMS4wLCAwLjAsXHQgLy8gYm90dG9tIHJpZ2h0XG4gICAgICAxLjAsIDEuMCwgMC4wLFx0IC8vIHRvcCByaWdodFxuICAgICAgLTEuMCwgMS4wLCAwLjAgICAvLyB0b3AgbGVmdFxuICAgIF07XG5cbiAgICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgbmV3IEZsb2F0MzJBcnJheSh2ZXJ0aWNlcyksIGdsLlNUQVRJQ19EUkFXKTtcbiAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHBvc2l0aW9uLCAzLCBnbC5GTE9BVCwgZmFsc2UsIDAsIDApO1xuICAgIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KHBvc2l0aW9uKTtcblxuXHQvLyBiaW5kIHRleHR1cmUgY29yZHNcbiAgICB2YXIgdGV4dHVyZSA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHJlbmRlcmVyLCB0aGlzLlRFWFRVUkVfVU5JRk9STV9OQU1FKTtcbiAgICB2YXIgdGV4Q29vcmRzID0gZ2wuY3JlYXRlQnVmZmVyKCk7XG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHRleENvb3Jkcyk7XG4gICAgdmFyIHRleHR1cmVDb29yZHMgPSBbXG4gICAgICAwLjAsIDAuMCxcbiAgICAgIDEuMCwgMC4wLFxuICAgICAgMS4wLCAxLjAsXG4gICAgICAwLjAsIDEuMFxuICAgIF07XG5cbiAgICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgbmV3IEZsb2F0MzJBcnJheSh0ZXh0dXJlQ29vcmRzKSwgZ2wuU1RBVElDX0RSQVcpO1xuICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIodGV4dHVyZSwgMiwgZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKTtcbiAgICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheSh0ZXh0dXJlKTtcblxuICAgIC8vIGluZGV4IHRvIHZlcnRpY2VzXG4gICAgdmFyIGluZGljZXMgPSBnbC5jcmVhdGVCdWZmZXIoKTtcbiAgICBnbC5iaW5kQnVmZmVyKGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBpbmRpY2VzKTtcbiAgICAvLyB0ZXNzZWxhdGUgc3F1YXJlIGludG8gdHJpYW5nbGVzXG4gICAgLy8gaW5kZWNlcyBpbnRvIHZlcnRleCBhcnJheSBjcmVhdGluZyB0cmlhbmdsZXMsIHdpdGggY291bnRlci1jbG9ja3dpc2Ugd2luZGluZ1xuICAgIHZhciB2ZXJ0ZXhJbmRpY2VzID0gW1xuICAgICAgMCwgMSwgMixcdC8vIGJvdHRvbSByaWdodCB0cmlhbmdsZVxuICAgICAgMCwgMiwgMyAgIC8vIHRvcCBsZWZ0IHRyaWFuZ2xlXG4gICAgXTtcbiAgICBnbC5idWZmZXJEYXRhKGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBuZXcgVWludDE2QXJyYXkodmVydGV4SW5kaWNlcyksIGdsLlNUQVRJQ19EUkFXKTtcbiAgfVxuXG4gIF91cGRhdGVUaW1lKCl7XG4gICAgY29uc3QgdGltZSA9IERhdGUubm93KCk7XG4gICAgdGhpcy5kdCA9IHRpbWUgLSB0aGlzLnRpbWU7XG4gICAgdGhpcy50aW1lID0gdGltZTtcblxuICAgIHRoaXMuZHRUaW1lICs9IHRoaXMuZHQvMTAwMDtcbiAgfVxuICAvKipcbiAgICogUnVuIHRoZSBzaGFkZXIgcHJvZ3JhbXMgaW4gYSBsb29wLlxuICAgKiBAcmV0dXJuIHt1bmRlZmluZWR9XG4gICAqL1xuICBydW5Mb29wKCl7XG4gICAgdGhpcy5fdXBkYXRlVGltZSgpO1xuXG4gICAgdGhpcy5jb250ZXh0LmNsZWFyKHRoaXMuY29udGV4dC5DT0xPUl9CVUZGRVJfQklUKTtcblxuICAgIHRoaXMuY29udGV4dC51bmlmb3JtMWYodGhpcy51bmlmb3Jtcy50aW1lLCB0aGlzLmR0VGltZSk7XG5cbiAgICAvLyBjb25zb2xlLmxvZyh0aGlzLmR0KTtcbiAgICB0aGlzLmNvbnRleHQuZHJhd0VsZW1lbnRzKHRoaXMuY29udGV4dC5UUklBTkdMRVMsIDYsIHRoaXMuY29udGV4dC5VTlNJR05FRF9TSE9SVCwgMCk7XG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHRoaXMucnVuTG9vcCgpKTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEdMO1xuIiwid2luZG93LkdMID0gcmVxdWlyZSgnLi9HTCcpO1xuIl19
