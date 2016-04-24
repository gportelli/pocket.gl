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

define({
	version: "1.0.6",
	website: "http://pocket.gl",

	brightAceTheme: "crimson_editor",
	darkAceTheme: "vibrant_ink",

	// default values
	fluidWidth: true,
	width: 620,
	height: 400,
	backgroundColor: "#ddd",
	tabColor: "#1c90f3",
	tabTextColor: "#333",
	animated: false,
	playButtons: true,
	transparent: false,
	editorTheme: "dark",
	editorWrap: true,
	showTabs: true,
	GUIClosed: false,

	orbiting: true,
	autoOrbit: false,
	autoOrbitSpeed: 2,
	zoom: false,

	copyright: "",
	copyrightColor: "#666",
	copyrightLinkColor: "#a00",

	// camera
	cameraDistance: 112,
	cameraPitch: 27,
	cameraYaw: 0,
	cameraFOV: 45,
});