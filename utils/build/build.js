({
 	baseUrl: '../../bower_components/',

    paths: {
        app:                '../js/app',
        default_shaders:    '../default_shaders',
        css:                '../css',
        examples:           '../examples',
        three_examples:     'three.js/examples/js',
        three_builds:       'three.js/build',
        text:               'text/text',
        ace_builds:         'ace-builds/src-noconflict'
    },

    shim: {
        "three_examples/Detector":                          ['three_builds/three'],
        "three_examples/controls/OrbitControls":            ['three_builds/three'],
        "three_examples/loaders/DDSLoader":                 ['three_builds/three'],
        "three_examples/loaders/OBJLoader":                 ['three_builds/three'],
        "three_examples/loaders/MTLLoader":                 ['three_builds/three'],
        "three_examples/loaders/ColladaLoader":             ['three_builds/three'],
        "three_examples/geometries/TeapotBufferGeometry":   ['three_builds/three']
    },

    name: 'almond/almond',
    
    include: [
        'app/pocket.gl',

        // Ace glsl language
        'ace_builds/mode-glsl',

        // Ace Themes
        'ace_builds/theme-vibrant_ink',    // dark
        'ace_builds/theme-crimson_editor', // bright
    ],

    wrap: {
    	startFile: "start.frag.js",
    	endFile:   "end.frag.js"
    }
})