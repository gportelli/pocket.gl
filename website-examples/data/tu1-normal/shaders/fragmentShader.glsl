varying vec3 normalInterp;
varying vec3 vertPos;
varying vec2 texcoord;

const vec3 lightPos 	= vec3(200,60,100);
const vec3 ambientColor = vec3(0.2, 0, 0);
const vec3 diffuseColor = vec3(0.5, 0 , 0);
const vec3 specColor 	= vec3(1.0, 1.0, 1.0);

uniform sampler2D normalMap;

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
	vec3 mapN = texture2D( normalMap, texcoord ).xyz * 2.0 - 1.0;
	vec3 normal = normalize(normalInterp);
	normal = perturbNormal(vertPos, normal, texcoord, mapN);

	vec3 lightDir = normalize(lightPos - vertPos);

	float lambertian = max(dot(lightDir,normal), 0.0);
	float specular = 0.0;

	if(lambertian > 0.0) {
		vec3 viewDir = normalize(-vertPos);
		vec3 halfDir = normalize(lightDir + viewDir);
		float specAngle = max(dot(halfDir, normal), 0.0);
		specular = pow(specAngle, 16.0);
	}

	gl_FragColor = vec4(ambientColor + lambertian * diffuseColor + specular * specColor, 1.0);
}