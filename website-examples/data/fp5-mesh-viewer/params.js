{
	tabColor: "#a00", editorTheme: "dark", fluidWidth: true, backgroundColor: "#333",
	
	meshes: [
		{ 
			url: "dice.obj", name: "Dice", y: 0, ry: -55, scale: 1,
		  	materials: [{ diffuseMap: "diffuse.jpg", normalMap: "normal.png" }]
		},
		
		{ 
			url: "light-bulb.obj", name: "Light Bulb", y: 0, rx:90, scale: 0.18,
		  	materials: [
			  	{ color: "#aaa" },
			  	{ color: "#c0a84a" },
	  	  	]
		}
	],
}