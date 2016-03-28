{
	disclaimer: "Images courtesy of <a href='http://visibleearth.nasa.gov/'>nasa</a>", disclaimerColor: "#C2C7CE", disclaimerLinkColor: "#96C3FF",

	meshes: [
		{ type: "sphere", name: "Sphere", scale: 1.2, subdivision: 64}
	],
	
	uniforms: [
		[
			{ groupName: "Speeds" },
			{ type: "float", value: 0.25, min: 0, max: 1, name: "rotationSpeed", GUIName: "Rotation Speed" },
			{ type: "float", value: 0.25, min: 0, max: 1, name: "cloudsSpeed", GUIName: "Clouds Speed" }
		],
		
		[
			{ groupName: "Textures", opened: true },
			{ type: "boolean", value: true, name: "cloudsOn", GUIName: "Clouds" },	
			{ type: "boolean", value: true, name: "normalOn", GUIName: "Normal Map" },
			{ type: "boolean", value: true, name: "specularOn", GUIName: "Specular Map" },
		]
	],

	backgroundColor: 0x000000,
	animated: true,

	textures: [
		{ 
			url: "textures/day.jpg", 
			wrap: "repeat", // repeat (default), clamp
			name: "texDay"
		},

		{ 
			url: "textures/night.jpg", 
			wrap: "repeat", // repeat (default), clamp
			name: "texNight"
		},

		{ 
			url: "textures/clouds-specular.png", 
			wrap: "repeat", // repeat (default), clamp
			name: "texCloudsSpecular"
		},

		{ 
			url: "textures/normal.jpg", 
			wrap: "repeat", // repeat (default), clamp
			name: "texNormal"
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