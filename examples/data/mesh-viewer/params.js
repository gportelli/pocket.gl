{
	meshes: [
		{ 
			url: "dice.obj", name: "Dice", y: 0, ry: -55, scale: 1,
		  	materials: [{ diffuseMap: "diceDiffuseMap.jpg", normalMap: "dice-normal-clean.png" }]
		},
		
		{ 
			url: "light-bulb.obj", name: "Light Bulb", y: 0, rx:90, scale: 0.18,
		  	materials: [
			  	{ color: "#aaa" },
			  	{ color: "#c0a84a" },
	  	  	]
		}
	],

	backgroundColor: "#000",
/*
	vertexShader: [
		"varying vec3 normalInterp;",
		"varying vec3 vertPos;",
		"",
		"void main(){",
		"    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
		"    vec4 vertPos4 = modelViewMatrix * vec4(position, 1.0);",
		"",
		"    vertPos = vec3(vertPos4) / vertPos4.w;",
		"    normalInterp = normalMatrix * normal;",
		"}"
	].join("\n"),

	fragmentShader: [
		"precision mediump float;",
		"",
		"varying vec3 normalInterp;",
		"varying vec3 vertPos;",
		"",
		"const vec3 lightPos 	= vec3(200,60,100);",
		"const vec3 ambientColor = vec3(0.2, 0, 0);",
		"const vec3 diffuseColor = vec3(0.5, 0 , 0);",
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
		"	gl_FragColor = vec4(ambientColor + lambertian * diffuseColor + specular * specColor, 1.0);",
		"}"
	].join("\n")
	*/
}