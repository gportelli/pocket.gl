varying vec3 normalInterp;
varying vec3 lightPosInterp;
varying vec3 vertPos;
varying vec2 texcoord;
		
const vec3 specColor 	= vec3(1.0, 1.0, 1.0);

uniform sampler2D texDay;
uniform sampler2D texNight;
uniform sampler2D texCloudsSpecular;

uniform float time;
uniform float cloudsSpeed;
uniform float cloudsOn;

void main() {
	vec3 normal = normalize(normalInterp);
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