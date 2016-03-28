{
	tabColor: "#a00", editorTheme: "dark", fluidWidth: true,

	uniforms: [
		[
			{ groupName: "Group1" },
			{ type: "float", value: 0.5, min: 0, max: 1, name: "v1", GUIName: "Var 1" },
			{ type: "boolean", value: true, name: "v2", GUIName: "Var 2" }
		],

		[
			{ groupName: "Group2" },
			{ type: "float", value: 0.5, min: 0, max: 1, name: "v3", GUIName: "Var 3" },
			{ type: "boolean", value: true, name: "v4", GUIName: "Var 4" }
		],

		[
			{ groupName: "Group3", opened: true },
			{ type: "float", value: 0.5, min: 0, max: 1, name: "v5", GUIName: "Var 5" },
			{ type: "boolean", value: true, name: "v6", GUIName: "Var 6" }
		]
	],
}