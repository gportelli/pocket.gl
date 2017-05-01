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
 
define(
	[
		"app/utils",
		"app/dirtyHack",
		"three_examples/loaders/OBJLoader",
		"three_examples/loaders/ColladaLoader",
		"three_examples/geometries/TeapotBufferGeometry"
	],

	function(Utils) {

		function MeshLoader(mesh, material, baseURL, loadingManager, onLoaded) { 
			this.mesh = mesh;
			this.material = material;
			if(material) {
				this.material.side =  mesh.doubleSided ? THREE.DoubleSide : THREE.FrontSide;
				this.material.transparent = mesh.transparent;
			}
			this.baseURL = baseURL;
			this.onLoaded = onLoaded;
			this.LoadingManager = loadingManager;

			this.materials = [];

			this.loadMesh();
		}

		MeshLoader.prototype.loadMesh = function() {
			var _this = this;

			// Procedural mesh
			if(this.mesh.type !== undefined) {
				procMesh = this.createProceduralMesh(
					this.mesh, 
					this.material != undefined 
					? this.material 
					: new THREE.MeshPhongMaterial( { 
						color: 0xaa0000, specular: 0x220000, shininess: 40, shading: THREE.SmoothShading,
						side: this.mesh.doubleSided ? THREE.DoubleSide : THREE.FrontSide,
						transparent: this.mesh.transparent})
				);

				if(this.mesh.y === undefined) this.mesh.y = 0;
				if(this.mesh.scale === undefined) this.mesh.scale = 1;

				this.setObjectTransform(procMesh, this.mesh);

				if(this.onLoaded != undefined) this.onLoaded(procMesh);
				return;
			}

			this.LoadingManager.setExtraCompleteCallback(
				function() {
					// set materials
					console.log("Mesh loading complete!");

					if(_this.materials.length <= 1) {
						var m = undefined;
						if(_this.materials.length == 0) 
							m = _this.material; 
						else 
							m = _this.createMaterial(_this.materials[0]);

						_this.loadedMesh.traverse( function ( child ) {
							if ( child instanceof THREE.Mesh )
								child.material = m;						
						} );
					}
					else {
						var multiMaterials = [];

						for(i in _this.materials) 
							multiMaterials.push(_this.createMaterial(_this.materials[i]));

						for(var i in _this.loadedMesh.children) {
							var m = i < multiMaterials.length ? multiMaterials[i] : multiMaterials[multiMaterials.length-1];

							_this.loadedMesh.children[i].material = m;
						}
					}
					
					_this.setObjectTransform(_this.loadedMesh, _this.mesh);

					if(_this.onLoaded != undefined) _this.onLoaded(_this.loadedMesh);
				}
			);

			// Embedded materials
			if(this.mesh.materials != undefined) {
				for(var i in this.mesh.materials) {
					var m = this.mesh.materials[i];

					this.materials.push(m);					
					if(m.diffuseMap != undefined)
						this.materials[i].diffuseMap = this.loadTexture(this.baseURL + m.diffuseMap);	

					if(m.normalMap != undefined)
						this.materials[i].normalMap = this.loadTexture(this.baseURL + m.normalMap);				
				}
			}

			var meshurl = this.baseURL + this.mesh.url;

			if(Utils.endsWith(meshurl.toLowerCase(), ".dae")) {
				var loader = new THREE.ColladaLoader();
				this.LoadingManager.addObject(loader);
				loader.options.convertUpAxis = true;
				loader.load(
					meshurl, 
					function ( collada ) {
						_this.LoadingManager.onProgress(loader, 1);

						dae = collada.scene;

						dae.traverse( function ( child ) {
							if ( child instanceof THREE.Mesh ) {
								if(_this.material != undefined) child.material = _this.material;
							}
						} );

						_this.setObjectTransform(dae, _this.mesh);
						_this.loadedMesh = dae;
						if(_this.onLoaded != undefined) _this.onLoaded(dae);
					}, 
					function ( xhr ) {
						if ( xhr.lengthComputable ) {
							var percentComplete = xhr.loaded / xhr.total;
							_this.LoadingManager.onProgress(loader, percentComplete);
						}
					},
					function(xhr) { _this.LoadingManager.onError(xhr); }
				);
			}
			else if(Utils.endsWith(meshurl.toLowerCase(), ".obj")) {
				var loader = new THREE.OBJLoader();
				this.LoadingManager.addObject(loader);
				loader.load(
					meshurl, 
					function( object ) {
						_this.LoadingManager.onProgress(loader, 1);

						object.traverse( function( child ) {
							if ( child instanceof THREE.Mesh ) {
								if(_this.material != undefined) child.material = _this.material;
							}
						} );

						_this.setObjectTransform(object, _this.mesh);
						_this.loadedMesh = object;
						if(_this.onLoaded != undefined) _this.onLoaded(object);
					},
					function ( xhr ) {
						if ( xhr.lengthComputable ) {
							var percentComplete = xhr.loaded / xhr.total;
							_this.LoadingManager.onProgress(loader, percentComplete);
						}
					},
					function(xhr) { _this.LoadingManager.onError(xhr); }
				);
			}
		}

		MeshLoader.prototype.createMaterial = function(params) {
			var color    = params.color != undefined 	? params.color 		: 0xaaaaaa;
			var specular = params.specular != undefined ? params.specular 	: 0x222222;
			var shininess= params.shininess != undefined ? params.shininess 	: 100;

			var mdata = { 
				color: color, specular: specular, shininess: shininess, side: this.mesh.doubleSided ? THREE.DoubleSide : THREE.FrontSide,
				transparent: this.mesh.transparent
			};

			if(params.diffuseMap) mdata.map = params.diffuseMap;
			if(params.normalMap)  mdata.normalMap = params.normalMap;

			return new THREE.MeshPhongMaterial(mdata);
		}

		MeshLoader.prototype.loadTexture = function(url) {
			var _this = this;

			var loader = new THREE.TextureLoader();
			this.LoadingManager.addObject(loader);

			return loader.load(
				url,

				function(loader) {
					return function (texture) {
						_this.LoadingManager.onProgress(loader, 1);
					}
				}(loader),
				
				function(loader) {
					return function ( xhr ) {
						if ( xhr.lengthComputable ) {
							var percentComplete = xhr.loaded / xhr.total;
							console.log( Math.round(percentComplete * 100, 2) + '% downloaded' );
							_this.LoadingManager.onProgress(loader, percentComplete);
						}
					}
				}(loader),
				function(xhr) { _this.LoadingManager.onError(xhr) }
			);
		}

		MeshLoader.prototype.createProceduralMesh = function(mesh, material) {
			var geometry = null;

			switch(mesh.type) {
				case "sphere":
					if(mesh.subdivision === undefined) mesh.subdivision = 32;
					if(mesh.subdivision < 10) mesh.subdivision = 10;
					if(mesh.subdivision > 64) mesh.subdivision = 64;
					geometry = new THREE.SphereGeometry(30, mesh.subdivision, mesh.subdivision);
					break;

				case "torus":
					if(mesh.subdivision === undefined) mesh.subdivision = 16;
					if(mesh.subdivision < 4) mesh.subdivision = 4;
					if(mesh.subdivision > 64) mesh.subdivision = 64;
					geometry = new THREE.TorusGeometry(30, 10, mesh.subdivision, mesh.subdivision * 4);
					break;

				case "cylinder":
					if(mesh.subdivision === undefined) mesh.subdivision = 32;
					if(mesh.subdivision < 4) mesh.subdivision = 4;
					if(mesh.subdivision > 64) mesh.subdivision = 64;
					geometry = new THREE.CylinderGeometry( 25, 25, 60, mesh.subdivision, 1);
					break;

				case "cube":
					if(mesh.subdivision === undefined) mesh.subdivision = 1;
					geometry = new THREE.BoxGeometry(40, 40, 40, mesh.subdivision, mesh.subdivision, mesh.subdivision);
					break;

				case "plane":
					if(mesh.subdivision === undefined) mesh.subdivision = 1;
					var geometry = new THREE.PlaneGeometry(60, 60, mesh.subdivision, mesh.subdivision);
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

		MeshLoader.prototype.setObjectTransform = function(obj, params) {
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

		return MeshLoader;
	}
);