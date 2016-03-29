{
	meshes: [
		{ url: "derivatives.obj", name: "Derivatives", x:-13, y: 0, z:0, rx:0, ry:-30, rz:0, scale: 0.65, transparent: true },
	],

	textures: [
		{ 
			url: "texture.png", 
			wrap: "repeat", // repeat (default), clamp
			name: "texture"
		}
	],

	backgroundColor: "#f8f8f8",
	
	vertexShader: [
		"varying vec3 normalInterp;",
		"varying vec3 vertPos;",
		"varying vec2 texcoord;",
		"",
		"void main(){",
		"    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
		"    vec4 vertPos4 = modelViewMatrix * vec4(position, 1.0);",
		"",
		"    vertPos = vec3(vertPos4) / vertPos4.w;",
		"    normalInterp = normalMatrix * normal;",
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
		"const vec3 lightPos 	= vec3(-200,60,100);",
		"const vec3 specColor 	= vec3(1.0, 1.0, 1.0);",
		"",
		"uniform sampler2D texture;",
		"",
		"void main() {",
		"	vec3 normal = normalize(normalInterp);",
		"	vec3 lightDir = normalize(lightPos - vertPos);",
		"",
		"	float lambertian = max(dot(lightDir,normal), 0.0);",
		"	vec4 albedo = texture2D(texture, texcoord);",
		"	gl_FragColor = vec4(albedo.rgb * 0.7 + lambertian * albedo.rgb * 0.3, albedo.a);",
		"}"
	].join("\n")
}