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

// Normal Mapping Without Precomputed Tangents
// http://www.thetenthplanet.de/archives/1180
vec3 perturbNormal( vec3 p, vec3 N, vec2 uv, vec3 mapN )
{
    // get edge vectors of the pixel triangle
    vec3 dp1 = dFdx( p );
    vec3 dp2 = dFdy( p );
    vec2 duv1 = dFdx( uv );
    vec2 duv2 = dFdy( uv );

    // solve the linear system
    vec3 dp2perp = cross( dp2, N );
    vec3 dp1perp = cross( N, dp1 );
    vec3 T = dp2perp * duv1.x + dp1perp * duv2.x;
    vec3 B = dp2perp * duv1.y + dp1perp * duv2.y;

    // construct a scale-invariant frame
    float invmax = inversesqrt( max( dot(T,T), dot(B,B) ) );
    mat3 TBN = mat3( T * invmax, B * invmax, N );

	return normalize( TBN * mapN );
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