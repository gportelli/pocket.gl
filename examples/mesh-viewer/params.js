define({
	meshes: [
		{ url: "submarina.obj", mtl: "submarina.mtl", name: "Submarine", y: 0, scale: 0.005},
		{ url: "monster.dae", name: "Monster", y: 0, scale: 0.04},
		{ url: "cube.obj", mtl: "cube.mtl", name: "Cube Obj", y: -10, scale: 2},
		{ url: "cube.dae", name: "Cube Collada", y: -10, scale: 2},
		{ type: "teapot", subdivision: 20, name: "Teapot procedural"},
		{ type: "cube", subdivision: 20, name: "Cube procedural"},
		{ type: "sphere", subdivision: 24, name: "Sphere procedural"},
		{ type: "torus", subdivision: 20, name: "Torus procedural"},
		{ type: "cylinder", subdivision: 20, name: "Cylinder procedural"},
	],

	//addDefaultShaders: true
});