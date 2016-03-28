{
	textures: [
		{ 
			url: "squares-normal.jpg", 
			name: "normalMap"
		}
	],

	uniforms: [
		{type: "boolean", value: true, name: "bMethod", GUIName: "Toggle method"}
	],

	vertexShaderFile: "shaders/vertexShader.glsl",
	fragmentShaderFile: "shaders/fragmentShader.glsl"
}