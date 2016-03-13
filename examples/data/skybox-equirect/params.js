{
	meshes: [ 
		{type: "teapot", name: "Teapot", doubleSided: true},
		{type: "sphere", name: "Sphere"},
		{type: "torus", name: "Torus"},
	],

	skybox: [
		"textures/panorama.jpg"
	],

	textures: [
		{ 
			url: "textures/squares-normal.jpg", 
			wrap: "repeat", // repeat (default), clamp
			uniformName: "normalMap"
		}
	],

	uniforms: {
		bNormal: {type: "boolean", value: true, name: "Normal map"}
	},

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
		"// Normal Mapping Without Precomputed Tangents",
		"// http://www.thetenthplanet.de/archives/1180",
		"vec3 perturbNormal( vec3 p, vec3 N, vec2 uv, vec3 mapN )",
		"{",
		"    // get edge vectors of the pixel triangle",
		"    vec3 dp1 = dFdx( p );",
		"    vec3 dp2 = dFdy( p );",
		"    vec2 duv1 = dFdx( uv );",
		"    vec2 duv2 = dFdy( uv );",
		"",
		"    // solve the linear system",
		"    vec3 dp2perp = cross( dp2, N );",
		"    vec3 dp1perp = cross( N, dp1 );",
		"    vec3 T = dp2perp * duv1.x + dp1perp * duv2.x;",
		"    vec3 B = dp2perp * duv1.y + dp1perp * duv2.y;",
		"", 
		"    // construct a scale-invariant frame",
		"    float invmax = inversesqrt( max( dot(T,T), dot(B,B) ) );",
		"    mat3 TBN = mat3( T * invmax, B * invmax, N );",
		"",
		"	return normalize( TBN * mapN );",
		"}",
		"",
		"void main() {",
		"	vec3 mapN = texture2D( normalMap, texcoord ).xyz * 2.0 - 1.0;",
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