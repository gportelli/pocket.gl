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

	function PocketGLTabs(callback, tabs, hl) {
		this.callback = callback;
		this.tabs = tabs;
		this.hl = hl;

		this.setupEvents();

		this.repositionHighlight(tabs[0]);
	}

	PocketGLTabs.prototype.setupEvents = function() {
		var _this = this;
		var i=0;

		while(i < this.tabs.length) {
			this.tabs[i].addEventListener("click", (function (action, index) {
					return function(event) {
						_this.switchTab(event, action, index);
					}
				})(this.tabs[i], i) 
			);

			i++;
		}
	};

	PocketGLTabs.prototype.switchTab = function(event, action, index) {
		event.preventDefault();
		event.stopPropagation();
		this.repositionHighlight(action);

		this.callback(index);
	};

	PocketGLTabs.prototype.repositionHighlight = function(action) {
		var position;
		position = action.getBoundingClientRect();
		container = this.tabs[0].getBoundingClientRect();
		return this.setStyles(this.hl, {
			left: (position.left - container.left) + "px",
			width: position.width + "px"
		});
	};

	PocketGLTabs.prototype.setStyles = function(element, styles) {
		var key, results;
		results = [];
		
		for (key in styles) {
			results.push(element.style[key] = styles[key]);
		}

		return results;
	};

	PocketGLTabs.prototype.disable = function() {
		for(var i in this.tabs)
			this.tabs[i].style.visibility = "hidden";

		this.hl.style.visibility = "hidden";
	};

	PocketGLTabs.prototype.enable = function() {
		for(var i in this.tabs)
			this.tabs[i].style.visibility = "visible";

		this.hl.style.visibility = "visible";
	};

	return PocketGLTabs;
});