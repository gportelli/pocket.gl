define({
	meshes: [
		{ url: "meshes/teapot.DAE", name: "Teapot", y: -23},
		{ url: "meshes/torus.DAE",  name: "Torus",  y: 0}
	],

	textures: [
		{ 
			url: "textures/noise.png", 
			wrap: "repeat", // repeat (default), clamp
			uniformName: "noiseTexture"
		},
	],

	uniforms: {
		seed: 	   { type: "float", value: 62 , min: 0, max: 100, displayName: "Seed" },
		intensity: { type: "float", value: 0.5, min: 0, max: 1  , displayName: "Intensity" },
	},

	//editorTheme: "bright",
	editorTheme: "dark",

	doubleSided: true,

	vertexShader: [
		"varying vec3 normalInterp;",
		"varying vec3 vertPos;",
		"varying vec2 texcoord;",
		"",
		"attribute vec2 uv2;",
		"",
		"uniform float intensity;",
		"uniform float seed;",
		"uniform sampler2D noiseTexture;",
		"",
		"void main(){",
		"    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
		"    vec4 vertPos4 = modelViewMatrix * vec4(position, 1.0);",
		"",
		"    vertPos = vec3(vertPos4) / vertPos4.w;",
		"    vec4 noise = texture2D(noiseTexture, uv2 + vec2(seed/100.0, seed/30.0));",
		"    vec3 normalOffset = vec3(noise.r-0.5, noise.g-0.5, 0) * intensity * 0.4;",
		"    vec3 distortedNormal = normalize(normal + normalOffset);",
		"",
		"    normalInterp = normalMatrix * distortedNormal;",
		"",
		"    texcoord = uv;",
		"}"
	].join("\n"),

	fragmentShader: [
		"precision mediump float;",
		"",
		"varying vec3 normalInterp;",
		"varying vec3 vertPos;",
		"varying vec2 texcoord;",
		"",
		"const vec3 lightPos 	= vec3(200,60,100);",
		"const vec3 ambientColor = vec3(0.2, 0.0, 0.0);",
		"const vec3 diffuseColor = vec3(0.5, 0.0, 0.0);",
		"const vec3 specColor 	= vec3(1.0, 1.0, 1.0);",
		"",
		"uniform sampler2D normalMap;",
		"uniform sampler2D noiseTexture;",
		"",
		"void main() {",
		"	vec3 mapN = texture2D( normalMap, texcoord ).xyz * 2.0 - 1.0;",
		"   vec3 normal = normalize(normalInterp);",
		"",
		"	vec3 lightDir = normalize(lightPos - vertPos);",
		"",
		"	float lambertian = max(dot(lightDir,normal), 0.0);",
		"	float specular = 0.0;",
		"",
		"	if(lambertian > 0.0) {",
		"		vec3 viewDir = normalize(-vertPos);",
		"",
		"		// this is blinn phong",
		"		vec3 halfDir = normalize(lightDir + viewDir);",
		"		float specAngle = max(dot(halfDir, normal), 0.0);",
		"		specular = pow(specAngle, 16.0);",
		"	}",
		"",
		"	gl_FragColor = vec4(ambientColor + lambertian * diffuseColor + specular * specColor, 1.0);",
		"}"
	].join("\n")
});