/**
 * pocket.gl - A fully customizable webgl shader sandbox to embed in your pages - http://pocket.gl
 *
 * Copyright 2016 Giuseppe Portelli <giuseppe.portelli@gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
 
define([
	"text!src/css/style.css",
	
	"text!src/default_shaders/vertex.glsl",
	"text!src/default_shaders/fragment.glsl",

	"app/utils",
	"app/tabs",
	"app/config",
	"app/loadingManager",
	"app/meshLoader",

	"clipboard",

	"three_builds/three",

	"three_examples/Detector",
	"three_examples/controls/OrbitControls",	

	"dat_gui/dat.gui",

	"ace_builds/ace"
	],

	function(stylesheet, defaultVertex, defaultFragment, Utils, PocketGLTabs, config, LoadingManager, MeshLoader, Clipboard) {
		console.log("pocket.gl " + config.version);

		// Inject css
		var sheet = document.createElement("style");
		sheet.setAttribute("media", "screen")	
		sheet.appendChild(document.createTextNode(stylesheet));
	    document.head.appendChild(sheet);

		function PocketGL(containerIDorDomEl, params, baseURL)
		{
			var scope = this;

			// all the views
			this.containerNames = ["render", "errors", "loading", "vertex_shader", "fragment_shader"];

			if(params == undefined) params = {};

			if(typeof params === 'string' || params instanceof String)
			{
				if(baseURL == undefined) {
					var lastSlash = params.lastIndexOf("/");
					if(lastSlash == -1) lastSlash = params.lastIndexOf("\\");
					baseURL = lastSlash == -1
						? "./"
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

			this.domContainer.className += " pocketgl";

			this.baseURL = baseURL == undefined ? "" : baseURL;
			if(this.baseURL != "" && this.baseURL[this.baseURL.length-1] != "/") this.baseURL += "/";

			if( ! this.readParams(params)) return;

			if ( ! Detector.webgl ) {
				this.domContainer.style.border = "1px solid #aaa";
				this.domContainer.appendChild(Detector.getWebGLErrorMessage());
				return;
			}

			this.currentView = "render";

			this.createDomElements();

			this.clock = new THREE.Clock();

			this.frameCount = 0;			

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
			if(params == undefined) params = {};
			if(params.meshes == undefined) params.meshes = [];

			for(id in config)
				if(params[id] == undefined) params[id] = config[id];

			this.shaderEditorEnabled = true;

			if(params.vertexShaderFile != undefined)
				params.vertexShader = "loading...";

			if(params.fragmentShaderFile != undefined)
				params.fragmentShader = "loading...";

			var meshWithEmbeddedMaterial = false;
			for(var i in params.meshes) if(params.meshes[i].materials !== undefined) {
				meshWithEmbeddedMaterial = true;
				break;
			}

			this.fragmentOnly = false;

			if(params.vertexShader == undefined && params.fragmentShader == undefined && meshWithEmbeddedMaterial) {
				// mesh viewer
				this.shaderEditorEnabled = false;
			}
			else {
				// fragment only
				if(params.vertexShader == undefined && params.fragmentShader != undefined)
				{
					this.fragmentOnly = true;
					params.vertexShader = "void main(){ gl_Position = vec4( position, 1.0 ); }";
					params.meshes = [];
					this.shaderEditorEnabled = true;
				}
				else {
					if(params.vertexShader   == undefined) params.vertexShader   = defaultVertex;
					if(params.fragmentShader == undefined) params.fragmentShader = defaultFragment;
				}
			}

			this.params = params;

			return true;
		}

		PocketGL.prototype.createDomElements = function()
		{
			var scope = this;

			// Tabs
			if(this.shaderEditorEnabled && this.params.showTabs) 				
				this.tabs = new PocketGLTabs(this.domContainer, this.params.tabColor, this.params.tabTextColor, !this.fragmentOnly, function (view) { scope.switchView(view); });

			if(!this.params.fluidWidth) {
				this.domContainer.style.width = this.params.width + "px";
				this.domContainer.style.position = "relative";
			}

			this.containers = {};
			for(var i in this.containerNames) {
				var id = this.containerNames[i];

				this.containers[id] = document.createElement("div");
				
				if(i > 0) this.containers[id].style.display = "none";
				

				if(!this.params.fluidWidth)  
					this.containers[id].style.width  = this.params.width + "px";
				else { 
					// Fluid layout
					this.params.width = Utils.getElementSize(this.domContainer).width;
					window.addEventListener( 'resize', function() { scope.onWindowResize(); }, false );
				}

				this.containers[id].style.height = this.params.height + "px";
				this.containers[id].style.position = "relative";

				this.domContainer.appendChild(this.containers[id]);
			}

			this.containers.errors.className = "errorConsole";

			// Loading Manager progress bar
			this.containers.loading.className = "loadingProgress";

			this.containers.loading.innerHTML = 
				"<div class='pocketglProgress'><div class='pocketglProgressBar'></div></div>";

			var progressBar = this.containers.loading.getElementsByTagName("div")[1];
			this.LoadingManager = new LoadingManager(
				progressBar,
				function() { scope.onLoadingComplete(); }
			);
		}

		PocketGL.prototype.onWindowResize = function() {
			if(Utils.isFullscreen()) return;

			var containerSize = Utils.getElementSize(this.domContainer);

			this.renderer.setSize( containerSize.width, this.params.height );

			if(!this.fragmentOnly) {
				var containerWidth = containerSize.width;

				this.camera.aspect = containerWidth / this.params.height;
				this.camera.updateProjectionMatrix();
			}
			else {
				this.uniforms.resolution.value.x = this.renderer.domElement.width;
				this.uniforms.resolution.value.y = this.renderer.domElement.height;
			}

			this.render();

			// repositioning and resizing tab cursor
			if(this.tabs) this.tabs.refresh();
		}

		PocketGL.prototype.onLoadingComplete = function()
		{
			//console.log("loading complete");

			if(this.loadingShaders) {
				this.loadingShaders = false;
				this.init();
			}
			else
				this.switchView("render");
		}

		PocketGL.prototype.addSkybox = function() 
		{
			if(typeof this.params.skybox == "string")
				this.params.skybox = [this.params.skybox];

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
				this.LoadingManager.setReady();

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
				this.showLoading();
				
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
				this.LoadingManager.setReady();

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

		PocketGL.prototype.addCopyButtons = function() {
			var scope = this;

			var buttons = document.createElement("div");
			buttons.className = "pocketgl-copyButtons";
			buttons.style.display = "none";			

			var copyButton = document.createElement("button");
			copyButton.className = "pocketgl-copyButton";
			copyButton.innerHTML = "copy";

			copyButton.title = "Copy to clipboard";			

			var copyButtonJS = document.createElement("button");
			copyButtonJS.className = "pocketgl-copyButton";
			copyButtonJS.innerHTML = "copy js";

			copyButtonJS.title = "Copy as js string";

			buttons.appendChild(copyButton);
			buttons.appendChild(copyButtonJS);

			this.domContainer.appendChild(buttons);

			this.copyButtons = buttons;
			this.copyButton = copyButton;
			this.copyButtonJS = copyButtonJS;

			this.clipboard = new Clipboard(copyButton, {
			    text: function(trigger) {
			        return scope.getEditorText(false);
			    }
			});

			this.clipboardJS = new Clipboard(copyButtonJS, {
			    text: function(trigger) {
			        return scope.getEditorText(true);
			    }
			});
		}

		PocketGL.prototype.addCopyright = function(domElement) {
			if(this.params.copyright == "") return;

			var copyright = document.createElement("div");
			copyright.innerHTML = this.params.copyright;
			copyright.className = "pocketgl-copyright pocketgl";
			copyright.style.color = this.params.copyrightColor;

			var style = document.createElement("style");
			style.innerHTML = [
				".pocketgl-copyright a,",
				".pocketgl-copyright a:hover,",
				".pocketgl-copyright a:active,",
				".pocketgl-copyright a:visited,",
				".pocketgl-copyright a:focus { color: " + this.params.copyrightLinkColor + "; }"].join("\n");

			domElement.appendChild(copyright);
			domElement.appendChild(style);
		}

		PocketGL.prototype.getEditorText = function(jsFormat) {
			var text;

			if(this.currentView == "vertex_shader" && this.editorVertex) 
				text = this.editorVertex.getValue();

			if(this.currentView == "fragment_shader" && this.editorFragment) 
				text = this.editorFragment.getValue();

			if(text == undefined) return;

			return jsFormat ? Utils.toJSString(text) : text;
		}

		PocketGL.prototype.addPlayButtons = function(domElement)
		{
			var scope = this;

			this.playButton = document.createElement("a");
			this.playButton.href = "#";
			this.playButton.innerHTML = " ";
			this.playButton.title = "Play";
			this.playButton.className = "pocketgl-playbutton";
			this.playButton.style.display = "none";
			this.playButton.onclick = function() { scope.play(); return false; }

			domElement.appendChild(this.playButton);

			this.pauseButton = document.createElement("a");
			this.pauseButton.href = "#";
			this.pauseButton.innerHTML = " ";
			this.pauseButton.title = "Pause";
			this.pauseButton.className = "pocketgl-pausebutton";
			this.pauseButton.onclick = function() { scope.pause(); return false; }

			domElement.appendChild(this.pauseButton);

			this.stopButton = document.createElement("a");
			this.stopButton.href = "#";
			this.stopButton.innerHTML = " ";
			this.stopButton.title = "Stop";
			this.stopButton.className = "pocketgl-stopbutton";
			this.stopButton.onclick = function() { scope.stop(); return false; }

			domElement.appendChild(this.stopButton);
		}

		PocketGL.prototype.addFullscreenButton = function(domElement)
		{
			var fullscreenButton = document.createElement("a");
			fullscreenButton.href = "#";
			fullscreenButton.innerHTML = " ";
			fullscreenButton.title = "Fullscreen";
			fullscreenButton.className = "pocketgl-fullscreenbutton";

			fullscreenButton.onclick = function() { 
				scope.fullscreenMode = true;

				// save windowed size
				scope.windowedSize = Utils.getElementSize(scope.renderer.domElement);

				// pause the animation while going fullscreen on iexplorer
				if(document.msFullscreenEnabled) scope.pauseBeforeFullscreen(); 

				Utils.goFullscreen(scope.renderer.domElement);
				
				return false; 
			}

			var scope = this;
			document.addEventListener('mozfullscreenchange', function() { scope.onFullscreenChange(); } );
			document.addEventListener('webkitfullscreenchange', function() { scope.onFullscreenChange(); } );
			document.addEventListener('MSFullscreenChange', function() { scope.onFullscreenChange(); } );
			document.addEventListener('fullscreenChange', function() { scope.onFullscreenChange(); } );

			domElement.appendChild(fullscreenButton);
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

		PocketGL.prototype.onFullscreenChange = function()
		{
			if(! this.fullscreenMode) return;
			if(!Utils.isFullscreen()) this.fullscreenMode = false;

			var size;
			if(Utils.isFullscreen()) {
				size = Utils.getWindowSize();
			}
			else {
				size = this.windowedSize;
			}

			this.renderer.setSize( size.width, size.height );

			if(this.fragmentOnly) {
				this.uniforms.resolution.value.x = this.renderer.domElement.width;
				this.uniforms.resolution.value.y = this.renderer.domElement.height;
			}
			else {
				this.camera.aspect = size.width / size.height;
				this.camera.updateProjectionMatrix();
			}

			this.render();

			var scope = this;
			if(this.params.animated)
				window.setTimeout( 
					function() { 
						scope.resumeAfterFullscreen();
					}, 500);
		}

		PocketGL.prototype.switchView = function(view)
		{			if(this.containers[view] == undefined) return;
			if(!Utils.isFullscreen()) this.fullscreenMode = false;

			if(view == this.currentView) return;
			
			this.containers[this.currentView].style.display = "none";
			this.containers[view].style.display   = "block";

			this.currentView = view;
			if(this.tabs != undefined) this.tabs.enable();
			if(this.copyButtons) this.copyButtons.style.display = "none";

			switch(view) {
				case "render":
					if(this.shaderEditorEnabled) this.updateShadersFromEditor();
					break;

				case "vertex_shader":
					if(this.editorVertex == undefined) {
						this.editorVertex = this.createEditor(this.containers["vertex_shader"], this.params.vertexShader);
						if(this.params.fluidWidth) this.containers[view].style.width = "";
					}

					if(!Utils.mobileAndTabletcheck())
						this.editorVertex.focus();	

					if(this.copyButtons) 
						this.copyButtons.style.display = "block";
					break;

				case "fragment_shader":
					if(this.editorFragment == undefined) {
						this.editorFragment = this.createEditor(this.containers["fragment_shader"], this.params.fragmentShader);
						if(this.params.fluidWidth) this.containers[view].style.width = "";
					}
	
					if(!Utils.mobileAndTabletcheck())
						this.editorFragment.focus();

					if(this.copyButtons)
						this.copyButtons.style.display = "block";
					break;

				case "loading":
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
			editor.getSession().setUseWrapMode(this.params.editorWrap);

			return editor;
		}

		PocketGL.prototype.updateUniforms = function() {
			if(!this.uniforms) return;

			if(this.uniforms.time != undefined && this.params.animated && this.isPlaying()) 
				this.uniforms.time.value += this.clock.getDelta();

			function update(u, scope) {
				if(u.type == "float" || u.type == "integer")
					scope.uniforms[u.name].value = scope.GUIParams[u.GUIName];
				else if(u.type == "color")
					scope.uniforms[u.name].value = new THREE.Color(scope.GUIParams[u.GUIName]);
				else if(u.type == "boolean")
					scope.uniforms[u.name].value = scope.GUIParams[u.GUIName] ? 1 : 0;
			}

			for(uniformid in this.params.uniforms) {
				var u = this.params.uniforms[uniformid];

				if(u.length == undefined)
					update(u, this);
				else for(var i=1; i<u.length; i++) 
					update(u[i], this);				
			}
		}

		PocketGL.prototype.play = function() {		
			if(! this.params.animated) return;

			this.clock.start();

			this.animationStopped = this.animationPaused = false;

			this.pauseButton.style.display = "block";
			this.playButton.style.display = "none";

			this.animate();
		}

		PocketGL.prototype.isPlaying = function() {
			return 	this.params.animated   && 
					!this.animationStopped && 
					!this.animationPaused  && 
					!this.stoppedByError   && 
					!this.pausedBeforeFullscreen;
		}

		PocketGL.prototype.stop = function() {
			if(! this.params.animated) return;

			// reset time
			if(this.uniforms && this.uniforms.time != undefined) {
				this.uniforms.time.value = 0;
				this.frameCount = 0;
			}

			this.animationStopped = true;
			this.clock.stop();

			this.pauseButton.style.display = "none";
			this.playButton.style.display = "block";

			this.render();
		}

		PocketGL.prototype.errorStop = function() {
			if(! this.params.animated) return;

			this.stoppedByError = true;
		}

		PocketGL.prototype.errorResume = function() {
			if(! this.params.animated || !this.stoppedByError) return;

			this.stoppedByError = false;

			if(this.isPlaying())
				this.play();
		}

		PocketGL.prototype.pauseBeforeFullscreen = function() {
			if(! this.params.animated) return;

			this.pausedBeforeFullscreen = true;
		}

		PocketGL.prototype.resumeAfterFullscreen = function() {
			if(! this.params.animated || !this.pausedBeforeFullscreen) return;

			this.pausedBeforeFullscreen = false;

			if(this.isPlaying())
				this.play();
		}

		PocketGL.prototype.pause = function() {
			if(! this.params.animated)	 return;

			this.animationPaused = true;
			this.clock.stop();

			this.pauseButton.style.display = "none";
			this.playButton.style.display = "block";
		}

		PocketGL.prototype.animate = function() {			
			var _this = this;

			if(this.isPlaying())
				requestAnimationFrame(function () { _this.animate() });

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

			// retrieve cached mesh
			// if the quaternion propery is defined, the mesh has already been loaded
			if(mesh.quaternion) {
				if (typeof this.currentmesh != "undefined")
				   this.scene.remove(scope.currentmesh);

				this.currentmesh = mesh;
				this.scene.add(mesh);

				this.currentMaterial = material;

				this.render();
				return;
			}

			if(mesh.type == undefined) {
				this.showLoading();
			}

			var loader = new MeshLoader(mesh, material, this.baseURL, this.LoadingManager, 
				function(loadedMesh) {
					if (typeof scope.currentmesh != "undefined") {
					   scope.scene.remove(scope.currentmesh);
					}

					// cache the mesh
					for(i in scope.params.meshes) {
						if(scope.params.meshes[i] == mesh)
							scope.params.meshes[i] = loadedMesh;
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
			this.switchView("loading");
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

				this.switchView("errors");

				this.errorStop();
			}
			else this.errorResume();

			this.containers.errors.innerHTML = errorMessage;
		}

		PocketGL.prototype.init = function() {
			var scope = this;

			// Camera
			if(!this.fragmentOnly) {
				this.camera = new THREE.PerspectiveCamera( 45, this.params.width/this.params.height, 0.1, 1000 );
				this.camera.position.z = 100;
				this.camera.position.y = 50;
			}
			else {
				this.camera = new THREE.Camera();
				this.camera.position.z = 1;
			}

			// Scene
			var scene = new THREE.Scene();
			this.scene = scene;

			// Uniforms shader vars
			this.uniforms = {};
			if(this.params.animated)
				this.uniforms.time = {type: "f", value: 0};

			if(this.fragmentOnly)
				this.uniforms.resolution = {type: "v2", value: new THREE.Vector2()};

			function addUniform(u) {
				if(u.type == "boolean")
					scope.uniforms[u.name] = {
						type: "f",
						value: u.type ? 1.0 : 0.0 
					};
				else if(u.type == "float")
					scope.uniforms[u.name] = {
						type: "f",
						value: u.value
					};
				else if(u.type == "integer")
					scope.uniforms[u.name] = {
						type: "f",
						value: parseInt(u.value)
					};
				else if(u.type == "color") {
					scope.uniforms[u.name] = {
						type: "c",
						value: new THREE.Color(u.value)
					};
				}
			}

			if(this.params.uniforms != undefined) {
				for(var i in this.params.uniforms) {
					var u = this.params.uniforms[i];

					if(u.length != undefined) // folder
						for(var j=1; j<u.length; j++) addUniform(u[j]);
					else
						addUniform(u);
				}
			}

			// Textures
			if(this.params.textures != undefined) {
				for(var i in this.params.textures) {
					var texparams = this.params.textures[i];
					this.uniforms[texparams.name] = { type: "t", value: null };

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
						}(loader),
						function(xhr) { scope.LoadingManager.onError(xhr); }
					);

					texture.wrapS = texture.wrapT = texparams.wrap == "clamp" ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
					if(texparams.filter == "nearest") texture.minFilter = texture.magFilter =THREE.NearestFilter;
					this.uniforms[texparams.name].value = texture;
				}
			}

			if(this.params.skybox != undefined)
				this.addSkybox();

			// Material
			if(this.shaderEditorEnabled) {
				var material = new THREE.ShaderMaterial( {
					uniforms: this.uniforms,
					vertexShader: this.params.vertexShader, fragmentShader: this.params.fragmentShader,					
					extensions: {
						derivatives: true
					}
				} );

				this.currentMaterial = material;
			}

			// Renderer
			this.renderer = new THREE.WebGLRenderer({ antialias: true });				
			this.renderer.setPixelRatio( window.devicePixelRatio );
			this.renderer.setSize(this.params.width, this.params.height);
			this.renderer.setClearColor( this.params.backgroundColor );
			//this.renderer.sortObjects = false;

			if(! this.shaderEditorEnabled) {
				// Lights
				scene.add( new THREE.AmbientLight( 0xcccccc ) );

				var directionalLight = new THREE.DirectionalLight(0xaaaaaa);
				directionalLight.position.x = 100;
				directionalLight.position.y = 60;
				directionalLight.position.z = 100;
				directionalLight.position.normalize();
				scene.add( directionalLight );

				var directionalLight1 = new THREE.DirectionalLight(0x666666);
				directionalLight1.position.x = -100;
				directionalLight1.position.y = 60;
				directionalLight1.position.z = -100;
				directionalLight1.position.normalize();
				scene.add( directionalLight1 );
			}

			// Orbit
			if(!this.fragmentOnly) {
				var cameraControls = new THREE.OrbitControls( this.camera, this.renderer.domElement );
				cameraControls.enablePan = false;
				cameraControls.enableZoom   = this.params.zoom;
				cameraControls.enableRotate = this.params.orbiting;
				cameraControls.target.set( 0, 0, 0 );
				cameraControls.addEventListener( 'change', function() { scope.render() } );
			}

			// Add webgl canvas renderer to DOM container	
			this.containers.render.appendChild( this.renderer.domElement );
			this.containers.render.appendChild(this.getLogoDomEl());
			if(Utils.hasFullscreen()) this.addFullscreenButton(this.containers.render);

			if(this.params.animated && this.params.playButtons)
				this.addPlayButtons(this.containers.render);

			if(this.tabs)
				this.addCopyButtons();

			this.addCopyright(this.containers.render);

			// GUI	
			this.GUIParams = { Mesh: 0 };

			function addGuiParams(u) {
				if(u.type == "float" || u.type == "boolean") {
					scope.GUIParams[u.GUIName] = u.value;
				}
				else if(u.type == "color") {
					scope.GUIParams[u.GUIName] = u.value;
				}
				else if(u.type == "integer") {
					scope.GUIParams[u.GUIName] = parseInt(u.value);
				}
			}

			if(this.params.uniforms != undefined)
				for(var i in this.params.uniforms) {
					var u = this.params.uniforms[i];

					if(u.length == undefined) {
						addGuiParams(u);
					}
					else {
						for(var j=1; j<u.length; j++) addGuiParams(u[j]);
					}
				}

			var meshes = {};
			for(var i in this.params.meshes)
				meshes[this.params.meshes[i].name] = i;

			var gui = false;
			if(this.params.meshes.length > 1 || this.params.uniforms != undefined) {
				gui = new dat.GUI({ autoPlace: false });
				if(this.params.GUIClosed) gui.close();
			}

			if(this.params.meshes.length > 1)
				gui.add(this.GUIParams, 'Mesh', meshes).onChange(function() {
					scope.loadMesh(scope.params.meshes[scope.GUIParams['Mesh']], material);
					scope.LoadingManager.setReady();
				});
			else if(this.params.meshes.length == 0) {
				if(this.fragmentOnly) {
					var geometry = new THREE.PlaneBufferGeometry(2, 2);
					var mesh = new THREE.Mesh( geometry, material );
					scene.add( mesh );
				}
				else {
					this.loadMesh({type:"teapot", doubleSided: true}, material);
				}
			}

			function addGuiData(u, gui) {
				if(u.type == "float") 
					gui.add(scope.GUIParams, u.GUIName, u.min, u.max).onChange(function() {
						scope.render();
					});
				if(u.type == "integer") 
					gui.add(scope.GUIParams, u.GUIName, parseInt(u.min), parseInt(u.max)).step(1).onChange(function() {
						scope.render();
					});
				else if(u.type == "color")
					gui.addColor(scope.GUIParams, u.GUIName).onChange(function() {
						scope.render();
					});
				else if(u.type == "boolean")
					gui.add(scope.GUIParams, u.GUIName).onChange(function() {
						scope.render();
					});
			}

			for(var i in this.params.uniforms) {
				var u = this.params.uniforms[i];

				if(u.length != undefined) {
					var folder = gui.addFolder(u[0].groupName);
					for(var j=1; j<u.length; j++) addGuiData(u[j], folder);	

					if(u[0].opened) folder.open();
				}
				else addGuiData(u, gui);
			}

			if(gui) {
				var guiContainer = document.createElement('div');
				guiContainer.style.position = "absolute";
				guiContainer.style.right = "0px";
				guiContainer.style.top = "0px";
				guiContainer.appendChild(gui.domElement);
				this.containers.render.appendChild(guiContainer);
			}

			// adjust resolution uniform value
			this.onWindowResize();

			// Load mesh
			if(this.params.meshes.length != 0)
				this.loadMesh(this.params.meshes[0], material);

			if(this.params.animated)
				this.play();
			else
				this.render();

			if(this.LoadingManager.objects.length == 0)
				this.switchView("render");
			else
				this.LoadingManager.setReady();
		}

		return PocketGL;
	}
);