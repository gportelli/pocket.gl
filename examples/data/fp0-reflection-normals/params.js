{
	copyright: "Skybox from the Cairo map of <a href='http://34bigthings.com/portfolio/redout/'>Redout</a>", copyrightColor: "#fff", copyrightLinkColor: "#c00",

	cameraPitch: 10,
	cameraYaw: 30,
	cameraFOV: 70,

	autoOrbit: true,
	autoOrbitSpeed: 1,	

	tabColor: "#a00",

	meshes: [ 
		{type: "teapot", name: "Teapot", doubleSided: true, scale: 1.4},
		{type: "sphere", name: "Sphere", scale: 1.3},
		{type: "torus", name: "Torus", scale: 1.2},
	],

	skybox: [
		"cubemap/px.jpg", "cubemap/nx.jpg",
		"cubemap/py.jpg", "cubemap/ny.jpg",
		"cubemap/pz.jpg", "cubemap/nz.jpg" ],

	textures: [
		{ 
			url: "textures/squares-normal.jpg", 
			wrap: "repeat", // repeat (default), clamp
			name: "normalMap"
		}
	],

	uniforms: [
		{type: "boolean", value: true, name: "bNormal", GUIName: "Normal map"}
	],

	vertexShader: [
		"varying vec3 viewVector;",
		"varying vec3 wNormalInterp;",
		"varying vec3 vertPos;",
		"varying vec2 texcoord;",
		"",
		"attribute vec2 uv2;",
		"",
		"void main(){",
		"	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
		"	vec4 vertPos4 = modelMatrix * vec4(position, 1.0);",
		"",
		"	vertPos = vec3(vertPos4) / vertPos4.w;",
		"	viewVector = position - cameraPosition;",
		"	wNormalInterp = normal;",
		"",
		"	texcoord = uv;",
		"}"
	].join("\n"),

	fragmentShader: [
		"varying vec3 wNormalInterp;",
		"varying vec3 viewVector;",
		"varying vec3 vertPos;",
		"varying vec2 texcoord;",
		"",
		"uniform sampler2D normalMap;",
		"uniform samplerCube tCube;",
		"uniform float bNormal;",
		"uniform float time;",
		"",
		"// Per-Pixel Tangent Space Normal Mapping",
		"// http://hacksoflife.blogspot.ch/2009/11/per-pixel-tangent-space-normal-mapping.html",
		"vec3 perturbNormal( vec3 eye_pos, vec3 surf_norm, vec2 uv_coords, vec3 normal_perturbation ) {",
		"	vec3 q0 = dFdx( eye_pos.xyz );",
		"	vec3 q1 = dFdy( eye_pos.xyz );",
		"	vec2 st0 = dFdx( uv_coords.st );",
		"	vec2 st1 = dFdy( uv_coords.st );",
		"",
		"	vec3 S = normalize( q0 * st1.t - q1 * st0.t );",
		"	vec3 T = normalize( -q0 * st1.s + q1 * st0.s );",
		"	vec3 N = normalize( surf_norm );",
		"",
		"	mat3 tsn = mat3( S, T, N );",
		"	return normalize( tsn * normal_perturbation );",
		"}",
		"",
		"#define PERIOD 8.0",
		"#define PERIOD_INV (1.0 / PERIOD)",
		"#define STILL_PERIOD (0.8 / 2.0)",
		"#define RAISE_PERIOD (0.5 - STILL_PERIOD)",
		"#define M (1.0 / RAISE_PERIOD)",
		"#define H (1.0 + STILL_PERIOD / (2.0 * RAISE_PERIOD))",
		"",
		"void main() {",
		"	vec3 mapN = texture2D( normalMap, texcoord ).xyz * 2.0 - 1.0;",
		"	",
		"	float t = fract(time * PERIOD_INV);",
		"	float alpha = clamp(H - abs(M * t - H), 0.0, 1.0);",
		"	",
		"	mapN = mix(vec3(0,0,1), mapN, alpha);",
		"	vec3 normal = normalize(wNormalInterp);",
		"",
		"	normal = mix(normal, perturbNormal(vertPos, normal, texcoord, mapN), bNormal);",
		"	vec3 reflectVec = normalize(reflect(viewVector, normal));",
		"	reflectVec.x *= -1.0;",
		"	gl_FragColor = textureCube(tCube, reflectVec);",
		"}"
	].join("\n")
}