{
	meshes: [
		{ type: "teapot", name: "Teapot", doubleSided: true},
		{ type: "sphere",  name: "Sphere"}
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