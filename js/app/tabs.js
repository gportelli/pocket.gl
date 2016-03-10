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
		"app/utils"
	],

	function(Utils) {

	function PocketGLTabs(container, tabColor, addVertex, callback) {
		var _this = this;

		this.callback = callback;
		this.container = container;

		var div = document.createElement("div");
		div.className = "pocketgl pocketgl-tabs";
		var ul = document.createElement("ul");

		var tabNames = ["Render", "Vertex Shader", "Fragment Shader"];
		var tabIDs = ["render", "vertex_shader", "fragment_shader"];
		var tabs = [];

		for(var i=0; i<3; i++) {
			if(!addVertex && i == 1) continue;

			var li = document.createElement("li");
			var a = document.createElement("a");
			a.href = "#";
			a.innerHTML = tabNames[i];
			li.appendChild(a);
			ul.appendChild(li);

			a.addEventListener("click", (function (action, index) {
					return function(event) {
						_this.switchTab(event, action, index);
					}
				})(a, tabIDs[i]) 
			);

			tabs.push(a);
		}
		
		div.appendChild(ul);

		var divHl = document.createElement("div");
		divHl.className = "hl animated";
		divHl.style.width = "70px";
		divHl.style.left = "0px";
		divHl.style.backgroundColor = tabColor;

		div.appendChild(divHl);	

		this.container.appendChild(div);

		this.hl = divHl;
		this.tabs = tabs;

		this.repositionHighlight(tabs[0]);
	}

	PocketGLTabs.prototype.switchTab = function(event, action, index) {
		event.preventDefault();
		event.stopPropagation();
		this.repositionHighlight(action);

		this.callback(index);
	};

	PocketGLTabs.prototype.repositionHighlight = function(action) {
		var position;
		position = Utils.getElementSize(action);
		container = Utils.getElementSize(this.tabs[0]);
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