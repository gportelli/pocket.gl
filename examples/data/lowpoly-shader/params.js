{
	meshes: [
		{ url: "meshes/teapot.DAE", name: "Teapot", y: -23, doubleSided: true},
		{ url: "meshes/torus.DAE",  name: "Torus"}
	],

	textures: [
		{ 
			url: "textures/noise.png", 
			wrap: "repeat", // repeat (default), clamp
			filter: "nearest", // linear (default), nearest
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
		"varying vec3 perturbedNormalInterp;",
		"varying vec3 vertPos;",
		"varying vec2 texcoord;",
		"varying vec2 texcoord2;",
		"",
		"attribute vec2 uv2;",
		"",
		"uniform float intensity;",
		"uniform float seed;",
		"",
		"uniform sampler2D noiseTexture;",
		"",
		"void main(){",
		"    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
		"    vec4 vertPos4 = modelViewMatrix * vec4(position, 1.0);",
		"",
		"    vertPos = vec3(vertPos4) / vertPos4.w;",		
		"",
		"	// compute perturbed normal",
		"	vec4 noise = texture2D(noiseTexture, uv2 + vec2(seed/100.0, seed/30.0));",
		"	vec2 normalOffset = vec2(noise.r-0.5, noise.g-0.5) * intensity * 0.4;",
		"	perturbedNormalInterp = vec3(normalOffset, 1);",
		"",
		"	normalInterp = normalMatrix * normal;",
		"",
		"	texcoord  = uv;",
		"}"
	].join("\n"),

	fragmentShader: [
		"precision mediump float;",
		"",
		"varying vec3 normalInterp;",
		"varying vec3 perturbedNormalInterp;",
		"varying vec3 vertPos;",
		"varying vec2 texcoord;",
		"",
		"const vec3 lightPos 	 = vec3(200,60,100);",
		"const vec3 ambientColor = vec3(0.2, 0.0, 0.0);",
		"const vec3 diffuseColor = vec3(0.5, 0.0, 0.0);",
		"const vec3 specColor 	 = vec3(1.0, 1.0, 1.0);",
		"",
		"// Per-Pixel Tangent Space Normal Mapping",
		"// http://hacksoflife.blogspot.ch/2009/11/per-pixel-tangent-space-normal-mapping.html",
		"vec3 perturbNormal2Arb(vec3 eye_pos, vec2 vUV, vec3 surf_norm, vec3 perturbedNormal) {",
		"",
		"	vec3 q0 = dFdx(eye_pos.xyz);",
		"	vec3 q1 = dFdy(eye_pos.xyz);",
		"	vec2 st0 = dFdx(vUV.st);",
		"	vec2 st1 = dFdy(vUV.st);",
		"",
		"	vec3 S = normalize( q0 * st1.t - q1 * st0.t);",
		"	vec3 T = normalize(-q0 * st1.s + q1 * st0.s);",
		"	vec3 N = normalize(surf_norm);",
		"",
		"	mat3 tsn = mat3(S, T, N);",
		"	return normalize(tsn * perturbedNormal);",
		"}",
		"",
		"void main() {",
		"	// apply normal perturbation in tangent space",
		"	vec3 normal = perturbNormal2Arb(vertPos, texcoord, normalInterp, perturbedNormalInterp);",
		"",
		"	vec3 lightDir = normalize(lightPos - vertPos);",
		"",
		"	float lambertian = max(dot(lightDir, normal), 0.0);",
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
}