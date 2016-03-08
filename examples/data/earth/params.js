{
	meshes: [
		{ type: "sphere", name: "Sphere", scale: 1.2, subdivision: 64}
	],
	
	uniforms: {
		rotationSpeed: { type: "float", value: 0.25, min: 0, max: 1, displayName: "Rotation Speed" },
		cloudsSpeed:   { type: "float", value: 0.25, min: 0, max: 1, displayName: "Clouds Speed" },
		cloudsOn:      { type: "boolean", value: true, displayName: "Clouds" },
	},

	backgroundColor: 0x000000,
	animated: true,

	textures: [
		{ 
			url: "textures/day.jpg", 
			wrap: "repeat", // repeat (default), clamp
			uniformName: "texDay"
		},

		{ 
			url: "textures/night.jpg", 
			wrap: "repeat", // repeat (default), clamp
			uniformName: "texNight"
		},

		{ 
			url: "textures/clouds-specular.png", 
			wrap: "repeat", // repeat (default), clamp
			uniformName: "texCloudsSpecular"
		},

		{ 
			url: "textures/normal.jpg", 
			wrap: "repeat", // repeat (default), clamp
			uniformName: "texNormal"
		}
	],

	skybox: [
		"cubemap/a_right1.png", "cubemap/a_left2.png", 
		"cubemap/a_top3.png", "cubemap/a_bottom4.png", 
		"cubemap/a_front5.png", "cubemap/a_back6.png",
	],

	vertexShaderFile: "shaders/vertexShader.glsl",
	fragmentShaderFile: "shaders/fragmentShader.glsl"
}