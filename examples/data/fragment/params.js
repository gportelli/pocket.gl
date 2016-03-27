{
	uniforms: [
		{ type: "float", value: 3.0, min: 0.0, max: 4.0, name: "z_speed", GUIName: "Z Speed" },
		{ type: "float", value: 1.0, min: 0.0, max: 4.0, name: "rot_speed", GUIName: "Rotation Speed" },
		{ type: "float", value: 0.15, min: 0.0, max: 1.0, name: "twist", GUIName: "Twist" }
	],

	textures: [
		{ 
			url: "grid.jpg", 
			wrap: "repeat", // repeat (default), clamp
			uniformName: "texture"
		}
	],

	fragmentShaderFile: "shader.glsl",
	animated: true
}