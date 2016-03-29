uniform vec2 resolution;
uniform float time;

uniform float z_speed;
uniform float rot_speed;
uniform float twist;

uniform sampler2D texture;

#define PI 3.1415926
#define VELOCITY 0.1
#define TWIST 0.5

void main()	{
	vec2 p = -1.0 + 2.0 * gl_FragCoord.xy / resolution.xy;
	p.x *= resolution.x / resolution.y;

	float radius = length(p);
	float angle  = atan(p.y, p.x);

	float t = time * VELOCITY;
	float tw= twist * TWIST;

	vec2 uv = vec2(angle / PI * 0.5 + 1.0 + t * rot_speed + tw * radius, pow(radius, 0.25) - t * z_speed);

	gl_FragColor = vec4(texture2D(texture, uv).rgb, 1.0);
}