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

	"app/utils",
	"app/tabs",
	"app/config",
	"app/loadingManager",
	"app/meshLoader",

	"three_builds/three",

	"three_examples/Detector",
	"three_examples/controls/OrbitControls",	

	"dat_gui/dat.gui",

	"ace_builds/ace"],

	function(stylesheet, defaultVertex, defaultFragment, Utils, PocketGLTabs, config, LoadingManager, MeshLoader) {
		console.log("pocket.gl " + config.version);

		// Inject css
		var sheet = document.createElement("style");
		sheet.setAttribute("media", "screen")	
		sheet.appendChild(document.createTextNode(stylesheet));
	    document.head.appendChild(sheet);

		function PocketGL(containerIDorDomEl, params, baseURL)
		{
			var scope = this;

			if(typeof params === 'string' || params instanceof String)
			{
				if(baseURL == undefined) {
					var lastSlash = params.lastIndexOf("/");
					if(lastSlash == -1) lastSlash = params.lastIndexOf("\\");
					baseURL = lastSlash == -1
						? "/"
						: params.substring(0, lastSlash);
				}
				var loaderV = new THREE.XHRLoader();
				loaderV.load( 
					params, 
					function(text) { 
						eval("params = " + text);
			            scope.initObject(containerIDorDomEl, params, baseURL);  
			        }
				);
			}
			else {
				this.initObject(containerIDorDomEl, params, baseURL);
			}
		}

		PocketGL.prototype.initObject = function(containerIDorDomEl, params, baseURL)
		{
			var scope = this;

			this.domContainer = 
				(typeof containerIDorDomEl === 'string' || containerIDorDomEl instanceof String) 
				? document.getElementById(containerIDorDomEl) 
				: containerIDorDomEl;

			this.baseURL = baseURL == undefined ? "" : baseURL;
			if(this.baseURL != "" && this.baseURL[this.baseURL.length-1] != "/") this.baseURL += "/";

			if( ! this.readParams(params)) return;

			if ( ! Detector.webgl ) {
				this.domContainer.style.border = "1px solid #aaa";
				this.domContainer.appendChild(Detector.getWebGLErrorMessage());
				return;
			}

			this.currentTab = 0;

			this.createDomElements();

			this.clock = new THREE.Clock();

			this.frameCount = 0;

			this.animationPaused = false;

			if(params.vertexShaderFile != undefined || params.fragmentShaderFile != undefined) {
				this.showLoading();
				this.loadingShaders = true;

				if(params.vertexShaderFile != undefined) {
					var loaderV = new THREE.XHRLoader();
					this.LoadingManager.addObject(loaderV);
					loaderV.load( 
						this.baseURL + params.vertexShaderFile, 
						function(text) { params.vertexShader = text;  },
						function ( xhr ) {
							if ( xhr.lengthComputable ) {
								var percentComplete = xhr.loaded / xhr.total;
								scope.LoadingManager.onProgress(loaderV, percentComplete);
							}
						},
						function(xhr) { scope.LoadingManager.onError(xhr); }
					);
				}

				if(params.fragmentShaderFile != undefined) {
					var loader = new THREE.XHRLoader();
					this.LoadingManager.addObject(loader);
					loader.load( 
						this.baseURL + params.fragmentShaderFile, 
						function(text) { params.fragmentShader = text; scope.LoadingManager.onProgress(loader, 1); },
						function ( xhr ) {
							if ( xhr.lengthComputable ) {
								var percentComplete = xhr.loaded / xhr.total;
								scope.LoadingManager.onProgress(loader, percentComplete);
							}
						},
						function(xhr) { scope.LoadingManager.onError(xhr); }
					);
				}

				this.LoadingManager.setReady();
			}
			else {
				this.loadingShaders = false;

				this.init();
			}		
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
			for(var i in params.meshes) if(params.meshes[i].url !== undefined) urlMeshesCount++;

			this.shaderEditorEnabled = true;

			if(params.vertexShaderFile != undefined)
				params.vertexShader = "loading...";

			if(params.fragmentShaderFile != undefined)
				params.fragmentShader = "loading...";

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
			var scope = this;

			// Tabs
			if(this.shaderEditorEnabled && this.params.showTabs) {
				var div = document.createElement("div");
				div.className = "pocketgl-tabs";
				var ul = document.createElement("ul");

				var tabNames = ["Render", "Vertex Shader", "Fragment Shader"];
				var tabs = [];
				for(var i=0; i<3; i++) {
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
				divHl.style.width = "70px";
				divHl.style.left = "0px";
				divHl.style.backgroundColor = this.params.tabColor;
				
				div.appendChild(divHl);	

				this.domContainer.appendChild(div);
				this.tabs = new PocketGLTabs(function (tabIndex) { scope.switchTab(tabIndex); }, tabs, divHl);
			}

			this.containers = [];
			for(var i=0; i<5; i++) {
				this.containers[i] = document.createElement("div");
				
				if(i > 0) this.containers[i].style.display = "none";
				

				if(this.canvasWidth != "")  this.containers[i].style.width  = this.canvasWidth + "px";
				else { 
					// Fluid layout
					this.canvasWidth = Utils.getElementSize(this.domContainer).width;
					window.addEventListener( 'resize', function() { scope.onWindowResize(); }, false );
				}

				this.containers[i].style.height = this.canvasHeight + "px";
				this.containers[i].style.position = "relative";

				this.domContainer.appendChild(this.containers[i]);
			}

			this.containers[3].className = "pocketgl errorConsole";

			// Loading Manager progress bar
			this.containers[4].className = "pocketgl loadingProgress";

			this.containers[4].innerHTML = 
				"<div class='pocketglProgress'><div class='pocketglProgressBar'></div></div>";

			var progressBar = this.containers[4].getElementsByTagName("div")[1];
			this.LoadingManager = new LoadingManager(
				progressBar,
				function() { scope.onLoadingComplete(); }
			);
		}

		PocketGL.prototype.onWindowResize = function() {
			var containerWidth = Utils.getElementSize(this.domContainer).width;

			this.camera.aspect = containerWidth / this.canvasHeight;
			this.camera.updateProjectionMatrix();

			this.renderer.setSize( containerWidth, this.canvasHeight );

			this.render();
		}

		PocketGL.prototype.onLoadingComplete = function()
		{
			//console.log("loading complete");

			if(this.loadingShaders) {
				this.loadingShaders = false;
				this.init();
			}
			else
				this.switchTab(0);
		}

		PocketGL.prototype.addSkybox = function() 
		{
			var scope = this;

			var urls = [];

			for(var i in this.params.skybox)
				urls[i] = this.baseURL + this.params.skybox[i];

			var textureCube;

			if(urls.length == 1) {
				this.showLoading();

				var loader = new THREE.TextureLoader();
				this.LoadingManager.addObject(loader);
				
				var equirectangularTexture = loader.load( 
					urls[0], 
					function() { scope.LoadingManager.onProgress(loader, 1); },
					function ( xhr ) {
						if ( xhr.lengthComputable ) {
							var percentComplete = xhr.loaded / xhr.total;
							scope.LoadingManager.onProgress(loader, percentComplete);
						}
					},
					function(xhr) { scope.LoadingManager.onError(xhr); }
				);

				equirectangularTexture.wrapS = THREE.ClampToEdgeWrapping;
				equirectangularTexture.wrapT = THREE.ClampToEdgeWrapping;
				equirectangularTexture.minFilter = equirectangularTexture.magFilter =THREE.LinearFilter;

				var geometry = new THREE.SphereGeometry( 500, 60, 40 );
				geometry.scale( - 1, 1, 1 );

				var material = new THREE.MeshBasicMaterial( {
					map: equirectangularTexture
				} );

				mesh = new THREE.Mesh( geometry, material );

				this.skybox = mesh;
				this.scene.add( mesh );

				this.uniforms["tCube"] = { type:"t", value: equirectangularTexture };
			}
			else {
				var loader = new THREE.CubeTextureLoader();
				this.LoadingManager.addObject(loader);

				var textureCube = loader.load( 
					urls,

					function() { scope.LoadingManager.onProgress(loader, 1); },
					function ( xhr ) {
						if ( xhr.lengthComputable ) {
							var percentComplete = xhr.loaded / xhr.total;
							scope.LoadingManager.onProgress(loader, percentComplete);
						}
					},
					function(xhr) { scope.LoadingManager.onError(xhr); }
				);

				textureCube.mapping = THREE.CubeReflectionMapping;

				var shader = THREE.ShaderLib[ "cube" ];
				shader.uniforms[ "tCube" ].value = textureCube;

				var material = new THREE.ShaderMaterial( {

					fragmentShader: shader.fragmentShader,
					vertexShader: shader.vertexShader,
					uniforms: shader.uniforms,
					side: THREE.BackSide

				} ),

				mesh = new THREE.Mesh( new THREE.BoxGeometry( 1000, 1000, 1000 ), material );
				this.skybox = mesh;
				this.scene.add( mesh );

				this.uniforms["tCube"] = { type:"t", value: textureCube };
			}
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
			if(tabIndex < 0 || tabIndex > 4) return;
			if(tabIndex == this.currentTab) return;
			
			this.containers[this.currentTab].style.display = "none";
			this.containers[tabIndex].style.display   = "block";

			this.currentTab = tabIndex;
			this.animationPaused = tabIndex != 0;
			if(this.tabs != undefined) this.tabs.enable();

			switch(tabIndex) {
				case 0:
					if(this.shaderEditorEnabled) this.updateShadersFromEditor();
					break;

				case 1:
					if(this.editorVertex == undefined)
						this.editorVertex = this.createEditor(this.containers[1], this.params.vertexShader);						
					break;

				case 2:
					if(this.editorFragment == undefined)
						this.editorFragment = this.createEditor(this.containers[2], this.params.fragmentShader);
					break;

				case 4:
					if(this.tabs != undefined) this.tabs.disable();
					break;

				deafult:
					break;
			}
		}

		PocketGL.prototype.createEditor = function(container, text)
		{
			var editor = ace.edit(container);

			editor.$blockScrolling = Infinity;
			editor.setTheme("ace/theme/" + (this.params.editorTheme == "dark" ? config.darkAceTheme : config.brightAceTheme));
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

			if(this.skybox != undefined)
				this.skybox.position.copy(this.camera.position);

			this.renderer.render( this.scene, this.camera );

			this.logErrors();

			this.frameCount++;
			//console.log("render " + this.frameCount);
		}

		PocketGL.prototype.loadMesh = function(mesh, material) {
			var scope = this;

			if(mesh.type == undefined) {
				this.showLoading();
			}

			var loader = new MeshLoader(mesh, material, this.baseURL, this.LoadingManager, 
				function(loadedMesh) {
					if (typeof scope.currentmesh != "undefined") {
					   scope.scene.remove(scope.currentmesh);
					}

					scope.currentmesh = loadedMesh;
					scope.scene.add(loadedMesh);

					scope.currentMaterial = material;

					scope.render();
				}
			);
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
					var modifiedRow = rows[i].replace(/:([0-9]+):/i, " line: " + (lineNumber[1] - offset + 1)+ " ");
					result.push(modifiedRow);
				}
				else result.push(rows[i]);
			}

			return result.join("<br/>");
		}

		PocketGL.prototype.showLoading = function() {
			this.switchTab(4);
		}

		PocketGL.prototype.logErrors = function() {
			if(! this.shaderEditorEnabled) return;

			var errorMessage = "";

			if(this.currentMaterial.program != undefined && this.currentMaterial.program.diagnostics != undefined) {
				var programLog = this.currentMaterial.program.diagnostics.programLog;
				var fragmentLog = this.currentMaterial.program.diagnostics.fragmentShader.log;
				var vertexLog = this.currentMaterial.program.diagnostics.vertexShader.log;
				
				// Subtracting from errors line numbers the lines of code included by three.js into the shader programs
				vertexLog   = this.adjustLineNumbers(vertexLog, Utils.countLines(this.currentMaterial.program.diagnostics.vertexShader.prefix));
				fragmentLog = this.adjustLineNumbers(fragmentLog, Utils.countLines(this.currentMaterial.program.diagnostics.fragmentShader.prefix));

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
			var scope = this;

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
				for(var i in this.params.uniforms) {
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
				for(var i in this.params.textures) {
					var texparams = this.params.textures[i];
					this.uniforms[texparams.uniformName] = { type: "t", value: null };

					this.showLoading();

					var loader = new THREE.TextureLoader();
					this.LoadingManager.addObject(loader);

					var texture = loader.load(
						this.baseURL + this.params.textures[i].url,

						function(loader) {
							return function (texture) {
								scope.LoadingManager.onProgress(loader, 1);
							}
						}(loader),
						
						function(loader) {
							return function ( xhr ) {
								if ( xhr.lengthComputable ) {
									var percentComplete = xhr.loaded / xhr.total;
									console.log( Math.round(percentComplete * 100, 2) + '% downloaded' );
									scope.LoadingManager.onProgress(loader, percentComplete);
								}
							}
						}(loader)
					);

					texture.wrapS = texture.wrapT = texparams.wrap == "clamp" ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
					if(texparams.filter == "nearest") texture.minFilter = texture.magFilter =THREE.NearestFilter;
					this.uniforms[texparams.uniformName].value = texture;
				}
			}

			if(this.params.skybox != undefined)
				this.addSkybox();

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
			cameraControls.addEventListener( 'change', function() { scope.render() } );

			// Add webgl canvas renderer to DOM container	
			this.containers[0].appendChild( this.renderer.domElement );
			this.containers[0].appendChild(this.getLogoDomEl());

			// GUI	
			this.GUIParams = { Mesh: 0 };

			if(this.params.uniforms != undefined)
				for(var i in this.params.uniforms) {
					var u = this.params.uniforms[i];

					if(u.type == "float" || u.type == "boolean") {
						this.GUIParams[u.displayName] = u.value;
					}
					else if(u.type == "color") {
						this.GUIParams[u.displayName] = "#" + Utils.toHex(u.value[0]) + Utils.toHex(u.value[1]) + Utils.toHex(u.value[2]);
					}
				}

			var meshes = {};
			for(var i in this.params.meshes)
				meshes[this.params.meshes[i].name] = i;

			var gui = false;
			if(this.params.meshes.length > 1 || this.params.uniforms != undefined)
				gui = new dat.GUI({ autoPlace: false });

			if(this.params.meshes.length > 1)
				gui.add(this.GUIParams, 'Mesh', meshes).onChange(function() {
					scope.loadMesh(scope.params.meshes[scope.GUIParams['Mesh']], material);
					scope.LoadingManager.setReady();
				});
			else if(this.params.meshes.length == 0) {
				material.side = THREE.DoubleSide;
				this.loadMesh({type:"teapot"}, material);
			}

			for(var i in this.params.uniforms) {
				var u = this.params.uniforms[i];

				if(u.type == "float") 
					gui.add(this.GUIParams, u.displayName, u.min, u.max).onChange(function() {
						scope.render();
					});
				else if(u.type == "color")
					gui.addColor(this.GUIParams, "Color").onChange(function() {
						scope.render();
					});
				else if(u.type == "boolean")
					gui.add(this.GUIParams, u.displayName).onChange(function() {
						scope.render();
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
			if(this.params.meshes.length != 0)
				this.loadMesh(this.params.meshes[0], material);

			if(this.params.animated)
				this.animate();
			else
				this.render();

			if(this.LoadingManager.objects.length == 0)
				this.switchTab(0);
			else
				this.LoadingManager.setReady();
		}

		return PocketGL;
	}
);