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