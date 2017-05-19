precision mediump float;

uniform float     time;
uniform vec2     resolution;

#define PI 3.1415926535897932384626433832795

float band(vec2 pos, float amplitude, float frequency) {
    float wave = amplitude * sin(1.0 * PI * frequency * pos.x + time);
    float light = clamp(amplitude * frequency * 0.02, 0.001 + 0.001, 5.0) / abs(wave - pos.y);
    return light;
}

void main() {
    vec3 color = vec3(1.5, 0.5, 10.0);
    color = color == vec3(0.0)? vec3(10.5, 0.5, 1.0) : color;
    vec2 pos = (gl_FragCoord.xy / resolution.xy);
    pos.y += - 1.;
    float spectrum = 0.0;

    float amp = sin(PI * (pos.x / 2.));

    spectrum += band(pos, amp * 0.05, 4.5);
    spectrum += band(pos, amp * 0.1, 7.0);
    spectrum += band(pos, amp * 0.1, 3.0);
    spectrum += band(pos, amp * 0.1, 14.0);
    spectrum += band(pos, amp * 0.1, 5.5);

    gl_FragColor = vec4(color * spectrum, spectrum);
}
