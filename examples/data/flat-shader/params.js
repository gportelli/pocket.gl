{
	meshes: [
		{ type: "teapot", name: "Teapot", y: 0},
		{ type: "sphere",  name: "Sphere",  y: 0}
	],

	uniforms: {
		bFlat:   { type: "boolean", value: true, displayName: "Flat enabled" },
	},

	//editorTheme: "bright",
	editorTheme: "dark",

	doubleSided: true,

	vertexShaderFile: "shaders/vertexShader.glsl",
	fragmentShaderFile: "shaders/fragmentShader.glsl"
}