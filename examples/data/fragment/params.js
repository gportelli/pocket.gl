{
	uniforms: {
		z_speed: { type: "float", value: 3.0, min: 0.0, max: 4.0, name: "Z Speed" },
		rot_speed: { type: "float", value: 1.0, min: 0.0, max: 4.0, name: "Rotation Speed" },
		twist: { type: "float", value: 0.15, min: 0.0, max: 1.0, name: "Twist" },
	},

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