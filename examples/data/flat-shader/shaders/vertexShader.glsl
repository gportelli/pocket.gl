varying vec3 normalInterp;
varying vec3 vertPos;

void main(){
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vec4 vertPos4 = modelViewMatrix * vec4(position, 1.0);

    normalInterp = normalMatrix * normal;
    vertPos = vec3(vertPos4) / vertPos4.w;
}