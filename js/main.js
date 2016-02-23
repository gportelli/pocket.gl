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
		"three-libs/TeapotBufferGeometry": ['three.min'],
    }
});

var url =
	//"examples/animation/";
	//"examples/mesh-viewer/";
	//"examples/derivatives/";
	//"examples/flat-shader/";
	//"examples/flat-bump/";
	//"examples/empty/";
	//"examples/random-colors/";
	"examples/redout-shader/";

require(
	["app/pocket.gl",
	url+"params"
	],

	function(widget, params1) {
	    new widget("container1", params1, url); 
	}
);