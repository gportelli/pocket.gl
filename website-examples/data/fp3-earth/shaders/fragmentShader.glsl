varying vec3 normalInterp;
varying vec3 lightPosInterp;
varying vec3 vertPos;
varying vec2 texcoord;
		
const vec3 specColor 	= vec3(1.0, 1.0, 1.0);

uniform sampler2D texDay;
uniform sampler2D texNight;
uniform sampler2D texCloudsSpecular;
uniform sampler2D texNormal;

uniform float time;
uniform float cloudsSpeed;
uniform float cloudsOn;
uniform float specularOn;
uniform float normalOn;

// Per-Pixel Tangent Space Normal Mapping
// http://hacksoflife.blogspot.ch/2009/11/per-pixel-tangent-space-normal-mapping.html
vec3 perturbNormal( vec3 eye_pos, vec3 surf_norm, vec2 uv_coords, vec3 normal_perturbation ) {
	vec3 q0 = dFdx( eye_pos.xyz );
	vec3 q1 = dFdy( eye_pos.xyz );
	vec2 st0 = dFdx( uv_coords.st );
	vec2 st1 = dFdy( uv_coords.st );

	vec3 S = normalize( q0 * st1.t - q1 * st0.t );
	vec3 T = normalize( -q0 * st1.s + q1 * st0.s );
	vec3 N = normalize( surf_norm );

	mat3 tsn = mat3( S, T, N );
	return normalize( tsn * normal_perturbation );
}

void main() {
	vec3 mapN = texture2D( texNormal, texcoord ).xyz * 2.0 - 1.0;
	mapN = normalize(mix(mapN, vec3(0,0,1), 0.3));
	
	vec3 normal = normalize(normalInterp);
	normal = mix(normal, perturbNormal(vertPos, normal, texcoord, mapN), normalOn);

	vec3 lightDir = normalize(lightPosInterp);

	float lambertian = max(dot(lightDir,normal), 0.0);
	float specular = 0.0;		

	if(lambertian > 0.0) {
		vec3 viewDir = normalize(-vertPos);
		vec3 halfDir = normalize(lightDir + viewDir);
		float specAngle = max(dot(halfDir, normal), 0.0);
		specular = pow(specAngle, 20.0) * 0.5;
	}

	float cloudsMask   = texture2D(texCloudsSpecular, vec2(texcoord.x + time * cloudsSpeed * 0.05, texcoord.y)).g;
	cloudsMask = min(cloudsMask, cloudsOn);

	float specularMask = texture2D(texCloudsSpecular, texcoord).r;
	specularMask = min(specularMask, specularOn);
	
	vec3 cloudsColor = vec3(cloudsMask, cloudsMask, cloudsMask) * lambertian;

	vec3 nightColor = mix(texture2D(texNight, texcoord).rgb * 0.3, cloudsColor, cloudsMask);
	specular *= (1.0 - specularMask);
	vec3 dayColor = mix(texture2D(texDay, texcoord).rgb * lambertian + specular * specColor, cloudsColor, cloudsMask);

	vec3 albedo = mix(nightColor, dayColor, lambertian);
	gl_FragColor = vec4(albedo, 1.0);
}