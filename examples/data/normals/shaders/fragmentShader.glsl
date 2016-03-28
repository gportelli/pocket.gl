varying vec3 normalInterp;
varying vec3 vertPos;
varying vec2 texcoord;

const vec3 lightPos 	= vec3(200,60,100);
const vec3 ambientColor = vec3(0.2, 0, 0);
const vec3 diffuseColor = vec3(0.5, 0 , 0);
const vec3 specColor 	= vec3(1.0, 1.0, 1.0);

uniform sampler2D normalMap;
uniform float bMethod;

// Normal Mapping Without Precomputed Tangents
// http://www.thetenthplanet.de/archives/1180
vec3 perturbNormalA( vec3 eye_pos, vec3 surf_norm, vec2 uv_coords, vec3 normal_perturbation )
{
    // get edge vectors of the pixel triangle
    vec3 dp1 = dFdx( eye_pos );
    vec3 dp2 = dFdy( eye_pos );
    vec2 duv1 = dFdx( uv_coords );
    vec2 duv2 = dFdy( uv_coords );

    // solve the linear system
    vec3 dp2perp = cross( dp2, surf_norm );
    vec3 dp1perp = cross( surf_norm, dp1 );
    vec3 T = dp2perp * duv1.x + dp1perp * duv2.x;
    vec3 B = dp2perp * duv1.y + dp1perp * duv2.y;

    // construct a scale-invariant frame
    float invmax = inversesqrt( max( dot(T,T), dot(B,B) ) );
    mat3 TBN = mat3( T * invmax, B * invmax, surf_norm );

	return normalize( TBN * normal_perturbation );
}

// Per-Pixel Tangent Space Normal Mapping
// http://hacksoflife.blogspot.ch/2009/11/per-pixel-tangent-space-normal-mapping.html
vec3 perturbNormalB( vec3 eye_pos, vec3 surf_norm, vec2 uv_coords, vec3 normal_perturbation ) {
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
	if(bMethod == 0.0) 
		normal = perturbNormalA(vertPos, normal, texcoord, mapN);
	else 
		normal = perturbNormalB(vertPos, normal, texcoord, mapN);

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