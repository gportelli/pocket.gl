{
	meshes: [
		{ url: "meshes/teapot.DAE", name: "Teapot", y: -23},
	],

	//editorTheme: "bright",
	editorTheme: "dark",

	doubleSided: true,

	vertexShader: [
		"varying vec3 normalInterp;",
		"varying vec3 vertPos;",
		"varying vec2 textureCoord;",
		"attribute vec2 uv2;",
		"",
		"void main(){",
		"    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
		"    vec4 vertPos4 = modelViewMatrix * vec4(position, 1.0);",
		"",
		"    normalInterp = normalMatrix * normal;",
		"    vertPos = vec3(vertPos4) / vertPos4.w;",
		"	 textureCoord = uv2;",
		"}"
	].join("\n"),

	fragmentShader: [
        "precision mediump float;",
        "",
		"varying vec3 vertPos;",
		"varying vec3 normalInterp;",
		"varying vec2 textureCoord;",
		"",
		"const vec3 lightPos 	= vec3(200,60,100);",
		"const vec3 specColor 	= vec3(1.0, 1.0, 1.0);",
		"",
		"void main() {",
		"	vec3 normal = normalize(normalInterp);",
		"	vec3 lightDir = normalize(lightPos - vertPos);",
		"",
		"	float lambertian = max(dot(lightDir,normal), 0.0);",
		"	float specular = 0.0;",
		"",
		"	if(lambertian > 0.0) {",
		"		vec3 viewDir = normalize(-vertPos);",
		"		vec3 halfDir = normalize(lightDir + viewDir);",
		"		float specAngle = max(dot(halfDir, normal), 0.0);",
		"		specular = pow(specAngle, 16.0);",
		"	}",
		"",
		"	vec3 diffuseColor = vec3(textureCoord.r, textureCoord.g, 0);",
		"	vec3 ambientColor = diffuseColor * 0.2;",
		"	gl_FragColor = vec4(ambientColor + lambertian * diffuseColor + specular * specColor, 1.0);",
		"}"
	].join("\n"),
}