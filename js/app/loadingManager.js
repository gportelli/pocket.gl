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
				setTimeout(function() { scope.onComplete(); }, 100);
				this.reset();
			}
		},

		setReady: function() {
			this.ready = true;
			this.update();
		},

		reset: function() {
			this.objects = [];
			this.ready = false;
			this.error = false;
			this.setProgress(0);
		}
	}

	return LoadingManager;
});