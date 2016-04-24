{
	meshes: [ 
		{type: "sphere", name: "Sphere", scale: 0.8},
	],

	skybox: [
		"cubemap/px.jpg", "cubemap/nx.jpg", 
		"cubemap/py.jpg", "cubemap/ny.jpg", 
		"cubemap/pz.jpg", "cubemap/nz.jpg",
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
		"uniform samplerCube tCube;",
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
		"	vec3 normal = normalize(wNormalInterp);",
		"",
		"	vec3 reflectVec = normalize(reflect(viewVector, normal));",
		"	reflectVec.x *= -1.0;",
		"	gl_FragColor = textureCube(tCube, reflectVec);",
		"}"
	].join("\n")
}