/**
 * pocket.gl http://pocketgl.aclockworkberry.com
 *
 * Copyright 2016 Giuseppe Portelli <info@aclockworkberry.com>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
 
require.onError = function (err) {
    console.log("Error [" + err.requireType + "]" + ' modules: ' + err.requireModules);
    throw err;
};

require.config({
    baseUrl: '..',

    paths: {
        app: 				'js/app',
        three_examples: 	'bower_components/three.js/examples/js',
        three_builds: 		'bower_components/three.js/build',
        text: 				'bower_components/text/text',
        ace_builds: 		'bower_components/ace-builds/src-noconflict',
        dat_gui:  			'bower_components/dat-gui/build'
    },

    shim: {
    	"three_examples/Detector": 							['three_builds/three'],
		"three_examples/controls/OrbitControls": 			['three_builds/three'],
		"three_examples/loaders/DDSLoader": 				['three_builds/three'],
		"three_examples/loaders/OBJLoader": 				['three_builds/three'],
		"three_examples/loaders/MTLLoader": 				['three_builds/three'],
		"three_examples/loaders/ColladaLoader": 			['three_builds/three'],
		"three_examples/geometries/TeapotBufferGeometry": 	['three_builds/three'],
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
	"test/" + url + "params"
	],

	function(widget, params) {
	    new widget("container", params, url); 
	}
);