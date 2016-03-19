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
 
define(function() {
	LoadingManager = function(domEl, onComplete)
	{
		this.domEl = domEl;
		this.onComplete = onComplete;
		this.reset();
	}

	LoadingManager.prototype = {
		constructor: LoadingManager,

		setProgress: function(progress) {
			if(this.error) return;

			this.domEl.style.width = (progress * 100) + "%";
			this.domEl.style.backgroundColor = "#fff";
		},

		addObject: function(object) {
			this.objects.push({obj: object, progress: 0});			
		},

		onProgress: function(object, progress) {
			if(this.objects.length == 0) return;

			console.log("onProgress " + progress);

			for(i in this.objects) {
				var obj = this.objects[i];
				if(object != obj.obj) continue;

				obj.progress = progress;
			}

			this.update();
		},

		onError: function( xhr ) {
			console.log("Error loading: " + xhr);
			this.error = true;

			this.domEl.style.width = "100%";
			this.domEl.style.backgroundColor = "#a00";
		},

		update: function() {
			var scope = this;
			var progress = 0;

			for(i in this.objects) {
				var obj = this.objects[i];

				progress += obj.progress;
			}

			progress /= this.objects.length;

			this.setProgress(progress);

			if(progress == 1 && this.ready) {
				setTimeout(function() { 					
					if(scope.extraOnComplete) {
						scope.extraOnComplete();
						scope.extraOnComplete = undefined;
					}

					scope.onComplete(); 
				}, 100);

				this.reset();
			}
		},

		// to avoid calling onComplete before adding all the objects to the manager
		setReady: function() {
			this.ready = true;
			this.update();
		},

		reset: function() {
			this.objects = [];
			this.ready = false;
			this.error = false;
			this.setProgress(0);
		},

		setExtraCompleteCallback: function(callback) {
			this.extraOnComplete= callback; // will be reset after call
		}
	}

	return LoadingManager;
});