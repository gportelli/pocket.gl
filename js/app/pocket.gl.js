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
 
define([
	"text!css/style.css",
	
	"text!default_shaders/vertex.glsl",
	"text!default_shaders/fragment.glsl",

	"app/tabs",
	"app/config",

	"three_builds/three",

	"three_examples/Detector",
	"three_examples/controls/OrbitControls",
	"three_examples/loaders/DDSLoader",
	"three_examples/loaders/OBJLoader",
	"three_examples/loaders/MTLLoader",
	"three_examples/loaders/ColladaLoader",
	"three_examples/geometries/TeapotBufferGeometry",

	"dat_gui/dat.gui",

	"ace_builds/ace"],

	function(stylesheet, defaultVertex, defaultFragment, PocketGLTabs, config) {
		console.log("pocket.gl " + config.version);

		// Inject css
		var sheet = document.createElement("style");
		sheet.setAttribute("media", "screen")	
		sheet.appendChild(document.createTextNode(stylesheet));
	    document.head.appendChild(sheet);

		function PocketGL(containerID, params, baseURL)
		{
			if ( ! Detector.webgl ) {
				Detector.addGetWebGLMessage();
				return;
			}

			this.baseURL = baseURL == undefined ? "" : baseURL;
			if(this.baseURL != "" && this.baseURL[this.baseURL.length-1] != "/") this.baseURL += "/";

			if( ! this.readParams(params)) return;

			this.domContainer = document.getElementById(containerID);

			this.currentTab = 0;

			this.createDomElements();

			this.brightAceTheme = "crimson_editor";
			this.darkAceTheme = "vibrant_ink";

			this.clock = new THREE.Clock();

			this.init();

			this.frameCount = 0;

			this.animationPaused = false;
			if(this.params.animated)
				this.animate();
			else
				this.render();
		}

		PocketGL.prototype.readParams = function(params)
		{
			if(params.width == undefined) params.width = 620;
			this.canvasWidth = params.width;
			
			if(params.height == undefined) params.height = 400;			
			this.canvasHeight = params.height;

			if(params == undefined) params = {};
			if(params.backgroundColor == undefined) params.backgroundColor = config.backgroundColor;
			if(params.meshes == undefined) params.meshes = [];
			if(params.tabColor == undefined) params.tabColor = config.tabColor;
			if(params.doubleSided == undefined) params.doubleSided = config.doubleSided;
			if(params.animated == undefined) params.animated = config.animated;
			if(params.transparent == undefined) params.transparent= config.transparent;
			if(params.editorTheme == undefined) params.editorTheme = config.editorTheme;
			if(params.showTabs == undefined) params.showTabs = config.showTabs;

			var urlMeshesCount = 0;
			for(i in params.meshes) if(params.meshes[i].url !== undefined) urlMeshesCount++;

			this.shaderEditorEnabled = true;
			if(params.vertexShader == undefined && params.fragmentShader == undefined && urlMeshesCount > 0) {
				if(params.addDefaultShaders !== undefined && params.addDefaultShaders == true) {
					params.vertexShader = defaultVertex;
					params.fragmentShader = defaultFragment;
				}
				else this.shaderEditorEnabled = false;
			}
			else {
				if(params.vertexShader == undefined) params.vertexShader = defaultVertex;
				if(params.fragmentShader == undefined) params.fragmentShader = defaultFragment;
			}

			this.params = params;

			return true;
		}

		PocketGL.prototype.createDomElements = function()
		{
			// Tabs
			if(this.shaderEditorEnabled && this.params.showTabs) {
				var div = document.createElement("div");
				div.className = "pocketgl-tabs";
				var ul = document.createElement("ul");

				var tabNames = ["Render", "Vertex Shader", "Fragment Shader"];
				var tabs = [];
				for(i=0; i<3; i++) {
					var li = document.createElement("li");
					var a = document.createElement("a");
					a.href = "#";
					a.innerHTML = tabNames[i];
					li.appendChild(a);
					ul.appendChild(li);

					tabs.push(a);
				}
				
				div.appendChild(ul);

				var divHl = document.createElement("div");
				divHl.className = "hl animated";
				divHl.style = "width: 70px; left: 0px; background-color: " + this.params.tabColor + ";";
				div.appendChild(divHl);	

				this.domContainer.appendChild(div);

				new PocketGLTabs(this, tabs, divHl);
			}

			this.containers = [];
			for(i=0; i<4; i++) {
				this.containers[i] = document.createElement("div");
				
				if(i > 0) this.containers[i].style.display = "none";
				
				this.containers[i].style.width  = this.canvasWidth + "px";
				this.containers[i].style.height = this.canvasHeight + "px";
				this.containers[i].style.position = "relative";

				this.domContainer.appendChild(this.containers[i]);
			}

			this.containers[3].className = "pocketgl errorConsole";
		}

		PocketGL.prototype.getLogoDomEl = function()
		{
			var logo = document.createElement("a");
			logo.className = "pocketgl-logo";
			logo.href  = config.website;
			logo.target = "_blank";
			logo.title = "pocket.gl";
			logo.innerHTML = "<div class='pocketgl-logo-pocket'></div>";

			return logo;
		}

		PocketGL.prototype.switchTab = function(tabIndex)
		{
			if(tabIndex < 0 || tabIndex > 3) return;
			if(tabIndex == this.currentTab) return;
			
			this.containers[this.currentTab].style.display = "none";
			this.containers[tabIndex].style.display   = "block";

			this.currentTab = tabIndex;

			switch(tabIndex) {
				case 0:
					this.animationPaused = false;			
					this.updateShadersFromEditor();
					break;

				case 1:
					this.animationPaused = true;
					if(this.editorVertex == undefined)
						this.editorVertex = this.createEditor(this.containers[1], this.params.vertexShader);						
					break;

				case 2:
					this.animationPaused = true;
					if(this.editorFragment == undefined)
						this.editorFragment = this.createEditor(this.containers[2], this.params.fragmentShader);
					break;

				deafult:
					this.animationPaused = true;
					break;
			}
		}

		PocketGL.prototype.createEditor = function(container, text)
		{
			var editor = ace.edit(container);

			editor.$blockScrolling = Infinity;
			editor.setTheme("ace/theme/" + (this.params.editorTheme == "dark" ? this.darkAceTheme : this.brightAceTheme));
			editor.session.setMode("ace/mode/glsl");
			editor.setShowPrintMargin(false);
			editor.setValue(text, -1);
			editor.setOption("wrap", 80);

			return editor;
		}

		PocketGL.prototype.updateUniforms = function() {
			if(this.uniforms.time != undefined) this.uniforms.time.value += this.clock.getDelta();

			for(uniformid in this.params.uniforms) {
				var u = this.params.uniforms[uniformid];

				if(u.type == "float")
					this.uniforms[uniformid].value = this.GUIParams[u.displayName];
				else if(u.type == "color")
					this.uniforms[uniformid].value = new THREE.Color(this.GUIParams[u.displayName]);
				else if(u.type == "boolean")
					this.uniforms[uniformid].value = this.GUIParams[u.displayName] ? 1 : 0;
			}
		}

		PocketGL.prototype.animate = function() {
			var _this = this;
			requestAnimationFrame(function () { _this.animate() });

			if(!this.animationPaused)
				this.render();
		}

		PocketGL.prototype.render = function() {
			this.updateUniforms();

			this.renderer.render( this.scene, this.camera );

			this.logErrors();

			this.frameCount++;
			//console.log("render " + this.frameCount);
		}

		PocketGL.prototype.setObjectTransform = function(obj, params) {
			if(params.scale == undefined) params.scale = 1;
			if(params.x == undefined) params.x = 0;
			if(params.y == undefined) params.y = 0;
			if(params.z == undefined) params.z = 0;
			if(params.rx == undefined) params.rx = 0;
			if(params.ry == undefined) params.ry = 0;
			if(params.rz == undefined) params.rz = 0;

			obj.scale.x = obj.scale.y = obj.scale.z = params.scale;
			obj.updateMatrix();

			obj.position.x = params.x;
			obj.position.y = params.y;
			obj.position.z = params.z;

			obj.rotation.x = params.rx * 3.1415926 / 180;
			obj.rotation.y = params.ry * 3.1415926 / 180;
			obj.rotation.z = params.rz * 3.1415926 / 180;
		}

		PocketGL.prototype.loadMesh = function(mesh, material) {
			var _this = this;

			if (typeof this.currentmesh != "undefined") {
			   this.scene.remove(this.currentmesh);
			}

			if(mesh.type !== undefined) {
				this.currentmesh = this.createProceduralMesh(mesh, this.shaderEditorEnabled ? this.currentMaterial : new THREE.MeshPhongMaterial( { color: 0xff0000, specular: 0x220000, shininess: 40, shading: THREE.FlatShading } ));

				if(mesh.y === undefined) mesh.y = 0;
				if(mesh.scale === undefined) mesh.scale = 1;

				this.setObjectTransform(this.currentmesh, mesh);

				this.scene.add(this.currentmesh);
				this.render();
				return;
			}
			
			var manager = new THREE.LoadingManager();
			manager.onProgress = function ( item, loaded, total ) {
				console.log( item, loaded, total );
			};

			var onProgress = function ( xhr ) {
				if ( xhr.lengthComputable ) {
					var percentComplete = xhr.loaded / xhr.total * 100;
					console.log( Math.round(percentComplete, 2) + '% downloaded' );
				}
			};

			var onError = function ( xhr ) {
			};

			function endsWith(str, suffix) {
			    return str.indexOf(suffix, str.length - suffix.length) !== -1;
			}

			var meshurl = this.baseURL + mesh.url;
			
			if(endsWith(meshurl.toLowerCase(), ".dae")) {
				var loader = new THREE.ColladaLoader( manager );
				loader.options.convertUpAxis = true;
				loader.load(meshurl, function ( collada ) {
					dae = collada.scene;

					dae.traverse( function ( child ) {
						if ( child instanceof THREE.Mesh ) {
							if(_this.shaderEditorEnabled) child.material = material;
						}
					} );

					_this.setObjectTransform(dae, mesh);

					_this.scene.add( dae );
					_this.currentmesh = dae;
					_this.render();
				}, 
				onProgress, onError );
			}
			else if(endsWith(meshurl.toLowerCase(), ".obj") && mesh.mtl !== undefined && !_this.shaderEditorEnabled) {
				var mtlLoader = new THREE.MTLLoader();
				mtlLoader.setBaseUrl(_this.baseURL );
				mtlLoader.load( _this.baseURL + mesh.mtl, function( materials ) {

					materials.preload();
					
					for(i in materials.materials)
						_this.currentMaterial = materials.materials[i];

					var objLoader = new THREE.OBJLoader();
					objLoader.setMaterials( materials );
					objLoader.load( meshurl, function ( object ) {

						_this.setObjectTransform(object, mesh);

						_this.scene.add( object );
						_this.currentmesh = object;
						_this.render();
					}, onProgress, onError );
				}, onProgress, onError );
			}
			else if(endsWith(meshurl.toLowerCase(), ".obj")) {
				var loader = 
					endsWith(meshurl.toLowerCase(), ".fbx")
					? new THREE.FBXLoader( manager )
					: new THREE.OBJLoader( manager );

				loader.load(meshurl, function( object ) {

					object.traverse( function( child ) {
						if ( child instanceof THREE.Mesh ) {
							if(_this.shaderEditorEnabled) child.material = material;
						}
					} );

					_this.setObjectTransform(object, mesh);

					_this.scene.add(object);
					_this.currentmesh = object;
					_this.render();
				}, onProgress, onError );
			}

			this.currentMaterial = material;
		}

		PocketGL.prototype.createProceduralMesh = function(mesh, material) {
			var geometry = null;

			switch(mesh.type) {
				case "sphere":
					if(mesh.subdivision === undefined) mesh.subdivision = 32;
					if(mesh.subdivision < 10) mesh.subdivision = 10;
					if(mesh.subdivision > 64) mesh.subdivision = 64;
					geometry = new THREE.SphereGeometry(30, mesh.subdivision, mesh.subdivision);
					break;

				case "torus":
					if(mesh.subdivision === undefined) mesh.subdivision = 32;
					if(mesh.subdivision < 10) mesh.subdivision = 10;
					if(mesh.subdivision > 64) mesh.subdivision = 64;
					geometry = new THREE.TorusGeometry(30, 10, mesh.subdivision, mesh.subdivision * 4);
					break;

				case "cylinder":
					if(mesh.subdivision === undefined) mesh.subdivision = 32;
					if(mesh.subdivision < 10) mesh.subdivision = 10;
					if(mesh.subdivision > 64) mesh.subdivision = 64;
					geometry = new THREE.CylinderGeometry( 25, 25, 60, mesh.subdivision, 1);
					break;

				case "cube":
					geometry = new THREE.BoxGeometry(40, 40, 40);
					break;

				case "teapot":
				default:
					if(mesh.subdivision === undefined || mesh.subdivision <= 1) mesh.subdivision = 6;
					if(mesh.subdivision > 10) mesh.subdivision = 10;
					geometry = new THREE.TeapotBufferGeometry( 
						25,
						mesh.subdivision,
						true, true, true, false, true);
					break;
			}

			return new THREE.Mesh(geometry, material);
		}

		PocketGL.prototype.updateShadersFromEditor = function() {
			if(this.editorVertex != undefined)
				this.currentMaterial.setValues( {
					vertexShader: this.editorVertex.getValue()});

			if(this.editorFragment != undefined)
				this.currentMaterial.setValues( {
					fragmentShader: this.editorFragment.getValue() });

			this.currentMaterial.needsUpdate = true;
			
			this.render();
		}

		PocketGL.prototype.adjustLineNumbers = function(txt, offset) {
			var result = [];

			var rows = txt.split("\n");
			for(var i in rows) {		
				var lineNumber = /:([0-9]+):/i.exec(rows[i]);
				if(lineNumber != null) {
					var modifiedRow = rows[i].replace(/:([0-9]+):/i, ":" + (lineNumber[1] - offset) + ":");
					result.push(modifiedRow);
				}
				else result.push(rows[i]);
			}

			return result.join("<br/>");
		}

		PocketGL.prototype.logErrors = function() {
			if(! this.shaderEditorEnabled) return;

			var errorMessage = "";

			if(this.currentMaterial.program != undefined && this.currentMaterial.program.diagnostics != undefined) {
				var programLog = this.currentMaterial.program.diagnostics.programLog;
				var fragmentLog = this.currentMaterial.program.diagnostics.fragmentShader.log;
				var vertexLog = this.currentMaterial.program.diagnostics.vertexShader.log;
				
				// Subtracting from errors line numbers the lines of code included by three.js into the shader programs
				vertexLog   = this.adjustLineNumbers(vertexLog, config.vertexShaderPreambleLineCount);
				fragmentLog = this.adjustLineNumbers(fragmentLog, config.fragmentShaderPreambleLineCount);

				errorMessage = programLog + "<br/><br/>";

				if(vertexLog != "") 
					errorMessage += "Vertex Shader errors:<br/>" + vertexLog + "<br/><br/>";

				if(fragmentLog != "") 
					errorMessage += "Fragment Shader errors:<br/>" + fragmentLog;

				this.switchTab(3);

				this.animationPaused = true;
			}

			this.containers[3].innerHTML = errorMessage;
		}

		PocketGL.prototype.init = function() {
			var that = this;

			// Camera
			this.camera = new THREE.PerspectiveCamera( 45, this.canvasWidth/this.canvasHeight, 0.1, 1000 );
			this.camera.position.z = 100;
			this.camera.position.y = 50;

			// Scene
			var scene = new THREE.Scene();
			this.scene = scene;

			// Uniforms shader vars
			this.uniforms = {};
			if(this.params.animated)
				this.uniforms.time = {type: "f", value: 0};

			if(this.params.uniforms != undefined) {
				for(i in this.params.uniforms) {
					var u = this.params.uniforms[i];

					if(u.type == "boolean")
						this.uniforms[i] = {
							type: "f",
							value: u.type ? 1.0 : 0.0 
						};
					else if(u.type == "float")
						this.uniforms[i] = {
							type: "f",
							value: u.value
						};
					else if(u.type == "color")
						this.uniforms[i] = {
							type: "c",
							value: new THREE.Color(u.value)
						};
				}
			}

			// Textures
			if(this.params.textures != undefined) {
				for(i in this.params.textures) {
					this.uniforms[this.params.textures[i].uniformName] = { type: "t", value: null };

					var loader = new THREE.TextureLoader();
					loader.load(
						this.baseURL + this.params.textures[i].url,
						(function(texparams) {
							return function ( texture ) {
								texture.wrapS = texture.wrapT = texparams.wrap == "clamp" ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
								if(texparams.filter == "nearest") texture.minFilter = texture.magFilter =THREE.NearestFilter;
								that.uniforms[texparams.uniformName].value = texture;
								that.render();
							}
						})(that.params.textures[i])
					);			
				}
			}

			// Material
			if(this.shaderEditorEnabled) {
				var material = new THREE.ShaderMaterial( {
					uniforms: this.uniforms,
					vertexShader: this.params.vertexShader, fragmentShader: this.params.fragmentShader,
					side: this.params.doubleSided ? THREE.DoubleSide : THREE.FrontSide,
					transparent: this.params.transparent,
					extensions: {
						derivatives: true
					}
				} );

				this.currentMaterial = material;
			}

			// Renderer
			this.renderer = new THREE.WebGLRenderer({ antialias: true });				
			this.renderer.setPixelRatio( window.devicePixelRatio );
			this.renderer.setSize(this.canvasWidth, this.canvasHeight);
			this.renderer.setClearColor( this.params.backgroundColor );
			//this.renderer.sortObjects = false;

			if(! this.shaderEditorEnabled) {
				// Lights
				scene.add( new THREE.AmbientLight( 0xcccccc ) );

				var directionalLight = new THREE.DirectionalLight(0xffffff );
				directionalLight.position.x = 100;
				directionalLight.position.y = 60;
				directionalLight.position.z = 100;
				directionalLight.position.normalize();
				scene.add( directionalLight );

				var directionalLight1 = new THREE.DirectionalLight(0xaaaaaa );
				directionalLight1.position.x = -100;
				directionalLight1.position.y = 60;
				directionalLight1.position.z = -100;
				directionalLight1.position.normalize();
				scene.add( directionalLight1 );
			}

			// Orbit
			var cameraControls = new THREE.OrbitControls( this.camera, this.renderer.domElement );
			cameraControls.enablePan = false;
			cameraControls.target.set( 0, 0, 0 );
			cameraControls.addEventListener( 'change', function() { that.render() } );

			// Add webgl canvas renderer to DOM container	
			this.containers[0].appendChild( this.renderer.domElement );
			this.containers[0].appendChild(this.getLogoDomEl());

			// GUI	
			this.GUIParams = { Mesh: 0 };

			if(this.params.uniforms != undefined)
				for(i in this.params.uniforms) {
					var u = this.params.uniforms[i];

					if(u.type == "float" || u.type == "boolean") {
						this.GUIParams[u.displayName] = u.value;
					}
					else if(u.type == "color") {
						function toHex(v) { hex = v.toString(16); if(hex.length == 1) hex = "0" + hex; return hex;}
						this.GUIParams[u.displayName] = "#" + toHex(u.value[0]) + toHex(u.value[1]) + toHex(u.value[2]);
					}
				}

			var meshes = {};
			for(i in this.params.meshes)
				meshes[this.params.meshes[i].name] = i;

			var gui = false;
			if(this.params.meshes.length > 1 || this.params.uniforms != undefined)
				gui = new dat.GUI({ autoPlace: false });

			if(this.params.meshes.length > 1)
				gui.add(this.GUIParams, 'Mesh', meshes).onChange(function() {
					that.loadMesh(that.params.meshes[that.GUIParams['Mesh']], material);
				});
			else if(this.params.meshes.length == 0) {
				material.side = THREE.DoubleSide;
				this.scene.add(this.createProceduralMesh({id:"teapot"}, material));
			}

			for(i in this.params.uniforms) {
				var u = this.params.uniforms[i];

				if(u.type == "float") 
					gui.add(this.GUIParams, u.displayName, u.min, u.max).onChange(function() {
						that.render();
					});
				else if(u.type == "color")
					gui.addColor(this.GUIParams, "Color").onChange(function() {
						that.render();
					});
				else if(u.type == "boolean")
					gui.add(this.GUIParams, u.displayName).onChange(function() {
						that.render();
					});
			}

			if(gui) {
				var guiContainer = document.createElement('div');
				guiContainer.style.position = "absolute";
				guiContainer.style.right = "0px";
				guiContainer.style.top = "0px";
				guiContainer.appendChild(gui.domElement);
				this.containers[0].appendChild(guiContainer);
			}

			// Load mesh
			if(this.params.meshes.length != 0) {
				// setup dds format texture loader
				THREE.Loader.Handlers.add( /\.dds$/i, new THREE.DDSLoader() );

				this.loadMesh(this.params.meshes[0], material);
			}
		}

		return PocketGL;
	}
);