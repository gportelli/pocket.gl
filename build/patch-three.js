// The patch comments the third line of code of three.js in order to disable AMD and enable the global THREE variable.
// We need a global THREE object reference because we are using tools from the threejs/examples folder.
// During the build phase, the three.js file dir is set to bower_components/threejs/build/patched to enable the use of the newly patched file 

src_dir = '../bower_components/threejs/build';
src_filename = 'three.js';

dst_dir = '../bower_components/threejs/build/patched';

string_to_search  = "typeof define === 'function' && define.amd ? define(['exports'], factory) :";
string_to_replace = "\n\t// The following line has been commented to obtain a global THREE object compatible with THREE examples modules\n\t//typeof define === 'function' && define.amd ? define(['exports'], factory) :\n";

console.log("Patching " + src_dir + '/' + src_filename + "...");

fs = require('fs')
fs.readFile(src_dir + '/' + src_filename, 'utf8', function (err,data) {
	if (err) {
		return console.log(err);
	}

	data = data.replace(string_to_search, string_to_replace);

	//console.log(data);

	if (!fs.existsSync(dst_dir)){
		fs.mkdirSync(dst_dir);
	}

	fs.writeFile(dst_dir + '/' + src_filename, data, function() { console.log("Patch done!")} )
});