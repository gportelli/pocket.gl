varying vec3 normalInterp;
varying vec3 lightPosInterp;
varying vec3 vertPos;
varying vec2 texcoord;

uniform float time;
uniform float rotationSpeed;

const vec3 lightPos = vec3(0, 0, 1);

void main(){
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	vec4 vertPos4 = modelViewMatrix * vec4(position, 1.0);

	vertPos = vec3(vertPos4) / vertPos4.w;
	normalInterp = normalMatrix * normal;

	lightPosInterp = normalMatrix * lightPos;

	texcoord = vec2(uv.x + time * rotationSpeed * 0.05, uv.y);
}
