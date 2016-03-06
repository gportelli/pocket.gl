{
	meshes: [
		{ url: "light-bulb.obj", name: "Light Bulb", y: 0, rx:90, scale: 0.18,
		  materials: [
		  	{ color: 0xff0000 },
		  	{ color: 0x00ff00 },
	  	  ]
		},
		
		{ url: "dice.obj", name: "Dice", y: 0, ry: -55, scale: 1,
		  materials: [{ diffuseMap: "diceDiffuseMap.jpg", normalMap: "dice-normal-clean.png" }]
		}
	],

	backgroundColor: 0x000000
}