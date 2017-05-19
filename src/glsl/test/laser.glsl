
precision mediump float;

uniform float     time;
uniform vec2     resolution;

#define PI 3.1415926535897932384626433832795

float band(vec2 pos, float amplitude, float frequency) {
    float wave = amplitude * sin(1.0 * PI * frequency * pos.x + time);
    return clamp(amplitude * frequency * 0.02, 0.01, 5.0) / abs(wave - pos.y);
}

void main() {
    vec3 color = vec3(1., 0.25, 0.25);

    //Normalize coords to range [0,1]
    vec2 pos = (gl_FragCoord.xy / resolution.xy);

    //Move y pos up by half the screen
    pos.y -= 0.5;

    float spectrum = 0.0;
    spectrum += band(pos, 0.01, 1.);

    gl_FragColor = vec4((color * spectrum), spectrum);
}
