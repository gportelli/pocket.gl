require.onError = function (err) {
    console.log("Error [" + err.requireType + "]" + ' modules: ' + err.requireModules);
    throw err;
};

require.config({
    baseUrl: 'js/libs/',

    paths: {
        app: '../app',
        default_shaders: '../../default_shaders',
        css: '../../css',
        examples: '../../examples'
    },

    shim: {
    	"three-libs/Detector": ['three.min'],
		"three-libs/OrbitControls": ['three.min'],
		"three-libs/DDSLoader": ['three.min'],
		"three-libs/OBJLoader": ['three.min'],
		"three-libs/MTLLoader": ['three.min'],
		"three-libs/ColladaLoader": ['three.min'],
		"three-libs/FBXLoader": ['three.min'],
		"three-libs/TeapotBufferGeometry": ['three.min']
    }
});

require(
	["app/pocket.gl",
	//"examples/animation/params",
	//"examples/mesh-viewer/params",
	//"examples/derivatives/params"
	"examples/flat-shader/params"
	//"examples/flat-bump/params"
	//"examples/empty/params"
	],

	function(widget, params1, params2) {
	    //new widget("container1", params1, "examples/animation"); 
	    //new widget("container1", params1, "examples/derivatives"); 
	    //new widget("container2", params2, "examples/mesh-viewer");
	    new widget("container2", params1);
	    //new widget("container2", params1, "examples/flat-bump");
	    //new widget("container2", params2, "examples/empty");
	}
);