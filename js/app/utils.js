define(function(){
	Utils = function() {}

	Utils.prototype.getElementSize = function(element) {
		if(element.getBoundingClientRect != undefined)
			return element.getBoundingClientRect();
		else
			return { width: element.offsetWidth, height: element.offsetHeight };
	}

	Utils.prototype.countLines = function(text) { return text.split("\n").length }

	Utils.prototype.toHex = function(v) { hex = v.toString(16); if(hex.length == 1) hex = "0" + hex; return hex; }
	
	return new Utils();
});