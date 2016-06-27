{
	tabColor: "#a00", editorTheme: "dark", backgroundColor: "#333", 

	uniforms: [
		{ type: "float", value: 1.0, min: 0.0, max: 4.0, name: "z_speed", GUIName: "Z Speed" },
		{ type: "float", value: 1.0, min: 0.0, max: 4.0, name: "rot_speed", GUIName: "Rotation Speed" },
		{ type: "float", value: 1.0, min: 0.0, max: 1.0, name: "twist", GUIName: "Twist" },
		{ type: "integer", value: 90, min: 60, max: 120, name: "fov", GUIName: "FOV" },
		{ type: "float", value: 0, min: -0.7, max: 0.7, name: "hOffset", GUIName: "Horiz Offset" },
		{ type: "float", value: 0, min: -0.7, max: 0.7, name: "vOffset", GUIName: "Vertical Offset" },
	],

	textures: [
		{ 
			url: "grid.jpg", 
			wrap: "repeat", // repeat (default), clamp
			name: "texture"
		}
	],

	fragmentShaderFile: "shader.glsl",
	animated: true
}