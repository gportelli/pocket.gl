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
	vec3 normal = perturbNormal(vertPos, normalize(normalInterp), texcoord, mapN);
	vec3 lightDir = normalize(lightPosInterp);

	float lambertian = max(dot(lightDir,normal), 0.0);
	float specular = 0.0;		

	if(lambertian > 0.0) {
		vec3 viewDir = normalize(-vertPos);
		vec3 halfDir = normalize(lightDir + viewDir);
		float specAngle = max(dot(halfDir, normal), 0.0);
		specular = pow(specAngle, 20.0) * 0.5;
	}

	float clouds = min(texture2D(texCloudsSpecular, vec2(texcoord.x + time * cloudsSpeed * 0.05, texcoord.y)).g, cloudsOn);
	vec3 cloudsColor = vec3(clouds, clouds, clouds) * lambertian;
	vec3 nightColor = mix(texture2D(texNight, texcoord).rgb * 0.3, cloudsColor, clouds);
   specular *= (1.0 - texture2D(texCloudsSpecular, texcoord).r);
	vec3 dayColor = mix(texture2D(texDay, texcoord).rgb * lambertian + specular * specColor, cloudsColor, clouds);

	vec3 albedo = mix(nightColor, dayColor, lambertian);
	gl_FragColor = vec4(albedo, 1.0);
}