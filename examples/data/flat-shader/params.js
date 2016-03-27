{
	meshes: [
		{ type: "teapot", name: "Teapot", doubleSided: true},
		{ type: "sphere",  name: "Sphere"}
	],

	uniforms: [
		{ type: "boolean", value: true, name: "bFlat", GUIName: "Flat enabled" },
	],

	//editorTheme: "bright",
	editorTheme: "dark",

	doubleSided: true,

	vertexShaderFile: "shaders/vertexShader.glsl",
	fragmentShaderFile: "shaders/fragmentShader.glsl"
}