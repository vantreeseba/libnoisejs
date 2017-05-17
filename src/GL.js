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
    this._selectProgram(this.createProgram(glslify('./glsl/test/cool.glsl')));

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
      passThrough = glslify('./glsl/passThrough.glsl');

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
