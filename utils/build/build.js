({
 	baseUrl: '../../js/libs/',

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
        "three-libs/ColladaLoader2": ['three.min'],
        "three-libs/TeapotBufferGeometry": ['three.min']
    },

	out: "../../build/pocket.gl.min.js",

	optimize: "uglify2",
    //optimize: "none",

    name: 'almond',
    
    include: [
        'app/pocket.gl',
        'ace/mode-glsl',

        // Ace Themes
        'ace/theme-vibrant_ink.js', // dark
        'ace/theme-crimson_editor.js', // bright
    ],

    wrap: {
    	startFile: "start.frag.js",
    	endFile: "end.frag.js"
    }
})