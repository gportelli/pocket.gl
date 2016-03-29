{
	copyright: "Equirectangular panorama by <a href='http://paulbourke.net/miscellaneous/sphericalpano/'>Paul Bourke</a>", copyrightColor: "#fff", copyrightLinkColor: "#FFECCE",

	meshes: [ 
		{type: "teapot", name: "Teapot", doubleSided: true},
		{type: "sphere", name: "Sphere"},
		{type: "torus", name: "Torus"},
	],

	skybox: "textures/panorama.jpg",

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
		"	vec4 vertPos4 = modelViewMatrix * vec4(position, 1.0);",
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
		"uniform sampler2D tCube;",
		"uniform float bNormal;",
		"",
		"#define RECIPROCAL_PI2 0.15915494",
		"#define saturate(a) clamp( a, 0.0, 1.0 )",
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
		"void main() {",
		"	vec3 mapN = texture2D( normalMap, texcoord ).xyz * 2.0 - 1.0;",
		"	mapN = mix(mapN, vec3(0,0,1), 0.8);",
		"	vec3 normal = normalize(wNormalInterp);",
		"",
		"	normal = mix(normal, perturbNormal(vertPos, normal, texcoord, mapN), bNormal);",
		"",
		"	vec3 reflectVec = normalize(reflect(viewVector, normal));",
		"	vec2 uv;",
		"	uv.y = saturate( reflectVec.y * 0.5 + 0.5 );",
		"	uv.x = atan( -reflectVec.z, -reflectVec.x ) * RECIPROCAL_PI2 + 0.5;",
		"	gl_FragColor = texture2D( tCube, uv );",
		"}"
	].join("\n")
}