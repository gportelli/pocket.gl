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
	"app/dirtyHack",
	//"three_builds/three", // the dirtyHack module will load the three module

	"text!src/css/style.css",
	
	"text!src/default_shaders/vertex.glsl",
	"text!src/default_shaders/fragment.glsl",

	"app/utils",
	"app/tabs",
	"app/config",
	"app/loadingManager",
	"app/meshLoader",

	"clipboard",

	"three_examples/Detector",
	"three_examples/controls/OrbitControls",	

	"dat_gui/dat.gui",

	"ace_builds/ace"
	],

	function(dummy, stylesheet, defaultVertex, defaultFragment, Utils, PocketGLTabs, config, LoadingManager, MeshLoader, Clipboard) {
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
				var loaderV = new THREE.FileLoader();
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
				this.domContainer.style.backgroundColor = "#fff";

				var link = document.createElement("div");
				link.style.textAlign = "center";
				link.innerHTML = "<a href='" + config.website + "' title='pocket.gl: a fully customizable and embeddable webgl shader sandbox'><h1>pocket.gl</h1></a>";
				this.domContainer.appendChild(link);

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
					var loaderV = new THREE.FileLoader();
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
					var loader = new THREE.FileLoader();
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

			// fluidWidth is true by default, but if only width is defined, it overrides the fluidWidth 
			if(params.width != undefined && params.fluidWidth == undefined)
				params.fluidWidth = false;

			// turn on animation if autoOrbit is true
			if(params.autoOrbit == true)
				params.animated = true;

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

			if(this.currentmesh != undefined) {
				var scale = 1;

				if(containerSize.width < this.params.height)		
					scale = containerSize.width / this.params.height;

				this.currentmesh.scale.x = 
				this.currentmesh.scale.y = 
				this.currentmesh.scale.z = this.currentmesh.baseScale * scale;
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

		// Will add a cubemap based skybox or equrectangular based skybox, depending on the param skybox
		PocketGL.prototype.addSkybox = function() 
		{
			// if the param skybox is a string (equirectangular skybox case) transform it into an array of one element
			// so that the next code, based on an array of strings can process it
			if(typeof this.params.skybox == "string")
				this.params.skybox = [this.params.skybox];

			var scope = this;

			var urls = [];

			for(var i in this.params.skybox)
				urls[i] = this.baseURL + this.params.skybox[i];

			// only one texture, equirectangular skybox
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

				// Map the equirectangular texture to a sphere centered on the camera
				var geometry = new THREE.SphereGeometry( 500, 60, 40 );

				// need to flip x: face up will flip to backside (don't need for backside on material)
				// and texture orientation will look correctly
				geometry.scale( - 1, 1, 1 ); 

				var material = new THREE.MeshBasicMaterial( {
					map: equirectangularTexture
				} );

				mesh = new THREE.Mesh( geometry, material );

				this.skybox = mesh;
				this.scene.add( mesh );

				this.uniforms["tEquirect"] = { type:"t", value: equirectangularTexture };
			}
			// more than one texture, cubemapped skybox
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

				var shader = THREE.ShaderLib[ "cube" ];
				// need to clone the shader.uniforms, otherwise all the cubemaps will share the same uniform object
				var uniforms = Utils.cloneObj(shader.uniforms);
				uniforms["tCube"].value = textureCube;
				uniforms["tFlip"].value = -1; // texture flipping, positive x is leftside

				var material = new THREE.ShaderMaterial( {

					fragmentShader: shader.fragmentShader,
					vertexShader: shader.vertexShader,
					uniforms: uniforms,
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

			var className = "pocketgl-copyright-";
			if(this.domContainer.id != "") className += this.domContainer.id;
			else className += Utils.guid();

			var copyright = document.createElement("div");
			copyright.innerHTML = this.params.copyright;
			copyright.className =  className + " pocketgl-copyright pocketgl";
			copyright.style.color = this.params.copyrightColor;

			var style = document.createElement("style");
			style.innerHTML = [
				"." + className + " a,",
				"." + className + " a:hover,",
				"." + className + " a:active,",
				"." + className + " a:visited,",
				"." + className + " a:focus { color: " + this.params.copyrightLinkColor + "; }"].join("\n");

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
		{			
			if(this.containers[view] == undefined) return;
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
			if(! this.params.animated || ! this.loaded) return;

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
			if(! this.params.animated || ! this.loaded) return;

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
			if(! this.params.animated || ! this.loaded)	 return;

			this.animationPaused = true;
			this.clock.stop();

			this.pauseButton.style.display = "none";
			this.playButton.style.display = "block";
		}

		PocketGL.prototype.animate = function() {			
			var _this = this;

			if(this.isPlaying())
				requestAnimationFrame(function () { _this.animate() });

			if(this.params.autoOrbit)
				this.cameraControls.update();
			
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

					// save current scale
					loadedMesh.baseScale = loadedMesh.scale.x;

					// cache the mesh
					for(i in scope.params.meshes) {
						if(scope.params.meshes[i] == mesh)
							scope.params.meshes[i] = loadedMesh;
					}

					scope.currentmesh = loadedMesh;
					scope.scene.add(loadedMesh);

					scope.currentMaterial = material;

					scope.render();

					// Schedule a second render in the case the first render was too early
					setTimeout(function() { scope.render(); }, 200);
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

			var programLog = "";
			var vertexLog = "";
			var fragmentLog = "";

			if(this.currentMaterial.program != undefined && this.currentMaterial.program.diagnostics != undefined) {
				var stack = new Error().stack;
				console.log( stack );

				programLog = this.currentMaterial.program.diagnostics.programLog.trim();
				fragmentLog = this.currentMaterial.program.diagnostics.fragmentShader.log.trim();
				vertexLog = this.currentMaterial.program.diagnostics.vertexShader.log.trim();
				
				// Fix for strange string value on chrome 57.0.2987.133
				if(programLog.length==1 && programLog.charCodeAt(0) == 0) programLog = "";
			}

			if(fragmentLog != "" || vertexLog != "")
			{
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

		PocketGL.prototype.rotateCamera = function(pitch, yaw) {
			var x = this.params.cameraDistance * Math.cos(pitch);
			var y = this.params.cameraDistance * Math.sin(pitch);

			this.camera.position.x = x * Math.sin(yaw);
			this.camera.position.y = y;
			this.camera.position.z = x * Math.cos(yaw);
		}

		PocketGL.prototype.onMouseDown = function(e) {
			e.preventDefault();

			this.mouseDragging = true;

			// Values needed to compute the z,w coordinates where we will store the relative values accumulated during dragging
			this.mouseClickPosition    = [e.offsetX, e.offsetY];
			this.mouseRelativePosition = [this.uniforms.mouse.value.z, this.uniforms.mouse.value.w];

			this.uniforms.mouse.value = new THREE.Vector4(e.offsetX, e.offsetY, this.mouseRelativePosition[0], this.mouseRelativePosition[1]);
			//console.log(this.uniforms.mouse.value.x + ", " + this.uniforms.mouse.value.y, this.uniforms.mouse.value.z + ", " + this.uniforms.mouse.value.w);
		}

		PocketGL.prototype.onMouseMove = function(e) {
			e.preventDefault();

			if(this.mouseDragging) {
				this.uniforms.mouse.value = new THREE.Vector4(
					e.offsetX, 
					e.offsetY, 
					this.mouseRelativePosition[0] + e.offsetX - this.mouseClickPosition[0], 
					this.mouseRelativePosition[1] + e.offsetY - this.mouseClickPosition[1]);

				this.render();
				//console.log(this.uniforms.mouse.value.x + ", " + this.uniforms.mouse.value.y, this.uniforms.mouse.value.z + ", " + this.uniforms.mouse.value.w);
			}
		}

		PocketGL.prototype.onMouseUp = function(e) {
			this.mouseDragging = false;
		}

		PocketGL.prototype.init = function() {
			var scope = this;

			// Camera
			if(!this.fragmentOnly) {
				this.camera = new THREE.PerspectiveCamera( this.params.cameraFOV, this.params.width/this.params.height, 0.1, 1000 );
				this.rotateCamera(Utils.deg2Rad(this.params.cameraPitch), Utils.deg2Rad(this.params.cameraYaw));
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

			if(this.fragmentOnly) {
				this.uniforms.resolution = {type: "v2", value: new THREE.Vector2()};
				this.uniforms.mouse = {type: "v4", value: new THREE.Vector4()};
			}

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
					//else texture.minFilter = texture.magFilter =THREE.LinearFilter;

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
						derivatives: true,
						shaderTextureLOD: true
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

			if(this.fragmentOnly) {
				this.renderer.domElement.addEventListener("mousedown", function(e) {scope.onMouseDown(e);});
				this.renderer.domElement.addEventListener("mousemove", function(e) {scope.onMouseMove(e);});
				this.renderer.domElement.addEventListener("mouseup", 	 function(e) {scope.onMouseUp(e);});
				this.renderer.domElement.addEventListener("mouseout",  function(e) {scope.onMouseUp(e);});
			}

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
				cameraControls.autoRotate = this.params.autoOrbit;
				cameraControls.autoRotateSpeed = this.params.autoOrbitSpeed;
				cameraControls.enablePan = false;
				cameraControls.enableZoom   = this.params.zoom;
				cameraControls.enableRotate = this.params.orbiting;
				cameraControls.target.set( 0, 0, 0 );
				cameraControls.addEventListener( 'change', function() { scope.render() } );

				this.cameraControls = cameraControls;
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

					if(u.length == undefined) { // Not an array
						addGuiParams(u);
					}
					else { // It's a folder (array). Let's add all its elements.
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
					gui.add(scope.GUIParams, u.GUIName, u.min, u.max).step((u.max - u.min)/100).onChange(function() {
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

			if(this.LoadingManager.objects.length == 0)
				this.switchView("render");
			else
				this.LoadingManager.setReady();

			this.loaded = true;

			if(this.params.animated)
				this.play();
			else
				this.render();
		}

		return PocketGL;
	}
);