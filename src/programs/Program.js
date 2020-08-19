/**
 * Program
 */
class Program {
  /**
   * @param {Object} gl The GL instance.
   * @param {} config The configuration for this program.
   * @return {undefined}
   */
  constructor(gl, config) {
  this.gl = gl;
    this._fragmentSrc = config.FragSrc;
    this.program = gl.createProgram(this._fragmentSrc);
  }

  /**
   * @return {undefined}
   */
  _bindUniforms() {
  }

  /**
   * @param {String} name
   * @return {undefined}
   */
  _getUniformLocation(name) {
    return this.gl.context.getUniformLocation(this.program, name);
  }
}

module.exports = Program;
