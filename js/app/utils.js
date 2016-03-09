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
	Utils = function() {}

	Utils.prototype.getElementSize = function(element) {
		if(element.getBoundingClientRect != undefined)
			return element.getBoundingClientRect();
		else
			return { width: element.offsetWidth, height: element.offsetHeight };
	}

	Utils.prototype.countLines = function(text) { return text.split("\n").length; }

	Utils.prototype.hasFullscreen = function() {
		var r =  
			document.FullscreenEnabled ||
			document.webkitFullscreenEnabled ||
			document.mozFullScreenEnabled ||
			document.msFullscreenEnabled;

		return r;
	}

	Utils.prototype.isFullscreen = function() {
		return 	document.fullscreen || 
				document.mozFullScreen || 
				document.webkitIsFullScreen || 
				document.msFullscreenElement || 
				false;
	}

	Utils.prototype.getWindowSize = function() {
		if(document.webkitFullscreenEnabled)
			return { width: screen.width, height: screen.height };

		return { width: window.outerWidth, height: window.outerHeight };
	}

	Utils.prototype.goFullscreen = function(canvas) {
		if(canvas.webkitRequestFullscreen != undefined)
			canvas.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT); 

		else if(canvas.mozRequestFullScreen != undefined)
			canvas.mozRequestFullScreen(); 

		else if(canvas.msRequestFullscreen != undefined)
			canvas.msRequestFullscreen(); 

		else if(canvas.requestFullscreen != undefined)
			canvas.requestFullscreen(); 
	}

	return new Utils();
});