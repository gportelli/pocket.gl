{
	/*
	meshes: [
		{ url: "meshes/teapot.DAE", name: "Teapot collada", y: -23},
		{ url: "meshes/teapot.OBJ", name: "Teapot obj", y: -23},
		{ url: "meshes/teapot.FBX", name: "Teapot fbx", y: -23},
	],
	*/

	tabColor: "#ff0000",

	textures: [
		{ 
			url: "textures/checker.jpg", 
			wrap: "repeat", // repeat (default), clamp
			uniformName: "texture"
		}
	],

	uniforms: {
		"Folder A": [{ uvscale: { type: "float", value: 1, min: 0.5, max: 2, displayName: "UV Scale" } }],
		"Folder B": [{
			color:   { type: "color", value: "#fff", displayName: "Color" },
			useTexture:   { type: "boolean", value: true, displayName: "Use Texture" },
		}]
	},

	//editorTheme: "bright",
	editorTheme: "dark",
	doubleSided: true,
	animated: true,

	vertexShader: [
		"varying vec3 normalInterp;",
		"varying vec3 vertPos;",
		"varying vec2 texcoord;",
		"",
		"uniform float uvscale;",
		"uniform float time;",
		"",
		"void main(){",
		"    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
		"    vec4 vertPos4 = modelViewMatrix * vec4(position, 1.0);",
		"",
		"    vertPos = vec3(vertPos4) / vertPos4.w;",
		"    normalInterp = normalMatrix * normal;",
		"",
		"    texcoord = uv * uvscale + vec2(time * 0.2, 0);",
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
		"const vec3 specColor 	= vec3(1.0, 1.0, 1.0);",
		"",
		"uniform sampler2D texture;",
		"uniform vec3 color;",
		"uniform float useTexture;",
		"",
		"vec3 blend(vec3 base, vec3 blend) {",
		"	return mix(1.0 - 2.0 * (1.0 - base) * (1.0 - blend), 2.0 * base * blend, step(base, vec3(0.5)));",
		"}",
		"",
		"void main() {",
		"	vec3 normal = normalize(normalInterp);",
		"	vec3 lightDir = normalize(lightPos - vertPos);",
		"",
		"	float lambertian = max(dot(lightDir,normal), 0.0);",
		"	float specular = 0.0;",
		"",
		"	vec3 albedo = mix(color, blend(texture2D(texture, texcoord).rgb, color), useTexture);",
		"",
		"	if(lambertian > 0.0) {",
		"		vec3 viewDir = normalize(-vertPos);",
		"		vec3 halfDir = normalize(lightDir + viewDir);",
		"		float specAngle = max(dot(halfDir, normal), 0.0);",
		"		specular = pow(specAngle, 20.0);",
		"	}",
		"",
		"	gl_FragColor = vec4(albedo * 0.2 + lambertian * albedo + specular * specColor, 1.0);",
		"}"
	].join("\n")
}