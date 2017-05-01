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
 
// The Three module will be loaded via AMD but we still need a global THREE object reference because we are using tools from the threejs/examples folder.
// This hack only works during development. When the final build is created, we first patch the three.js source file to patched/three.js
// The patch comments the third line of code of three.js in order to disable AMD and enable the global THREE variable.
define(
	[
		"three_builds/three",
	],

	function(THREE) {
		window.THREE = window.THREE || THREE;
	}
);