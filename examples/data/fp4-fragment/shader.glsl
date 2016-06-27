uniform vec2 resolution;
uniform vec4 mouse;
uniform float time;

uniform float z_speed;
uniform float rot_speed;
uniform float twist;
uniform float fov;
uniform float hOffset, vOffset;
uniform float manualLod;

uniform sampler2D texture;

#define PI 3.1415926
#define PI_INVERSE 1.0/PI
#define DEG2PI 3.1415926/180.0
#define VELOCITY 0.1
#define TWIST 0.5
#define LONGITUDE_SCALE 1.0
#define LATITUDE_SCALE 2.0
#define EXP 1.0

void main()	{
	vec2 p = -1.0 + 2.0 * gl_FragCoord.xy / resolution.xy;
	p.y *= resolution.y / resolution.x;

	float focalDistance = 1.0 / tan(fov * DEG2PI * 0.5);

	vec3 viewDirection = normalize(vec3(focalDistance, p.x, p.y));
	vec3 offsetViewPoint = vec3(0, hOffset, vOffset);

	float tmp = dot(viewDirection, offsetViewPoint);
	vec3 radialDirection = offsetViewPoint + (sqrt(tmp * tmp - dot(offsetViewPoint, offsetViewPoint) + 1.0) - tmp) * viewDirection;

	// Rotation
	vec2 rot = -vec2(mouse.z, mouse.w) / resolution * vec2(2.0*PI, PI);
	vec3 XAxis = vec3(cos(rot.y)*cos(rot.x), sin(rot.x), -cos(rot.x)*sin(rot.y));
	vec3 YAxis = vec3(-cos(rot.y)*sin(rot.x), cos(rot.x), sin(rot.y)*sin(rot.x));
	vec3 ZAxis = vec3(sin(rot.y), 0 , cos(rot.y));

	radialDirection = XAxis * radialDirection.x + YAxis * radialDirection.y + ZAxis * radialDirection.z;

	float longitude = atan(radialDirection.z, radialDirection.y) * PI_INVERSE * 0.5;
	float latitude  = 1.0 - atan(sqrt(radialDirection.y*radialDirection.y + radialDirection.z*radialDirection.z), radialDirection.x) * PI_INVERSE;

	// Apply non linear latitude mapping: we want the variation speed for circumferences to be constant along the latitudes
	float t = 1.0 - 2.0 * abs(latitude - 0.5);
    float h = pow(t, 0.5);
    float r = 1.0 + (h - 1.0) * sign(0.5 - latitude);
    latitude = r * 0.5;
        
	vec2 uv = vec2(
	    (longitude + latitude * twist) * LONGITUDE_SCALE + time * rot_speed * VELOCITY,
	    latitude * LATITUDE_SCALE + time * z_speed * VELOCITY);

    if(length(dFdx(uv) + dFdy(uv)) > 0.9)
    {
    	// avoids artifacts when longitude jumps from 0.5 to -0.5
    	float mipmapLevel = pow((1.0 - t), 20.0) * 10.0;
	    gl_FragColor = vec4(texture2DLodEXT(texture, uv, mipmapLevel).rgb, 1.0);
    }
	else
	{
	    gl_FragColor = vec4(texture2D(texture, uv).rgb, 1.0);	
	}
}