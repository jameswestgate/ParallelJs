/* Library to enable javascript dom manipulation from another browser process  */
/* https://github.com/jameswestgate/paralleljs */
/* version 0.1 */
/* Copyright James Westgate 2013 */
/* Dual licensed under the MIT and GPL licenses */


/// Core Module ///
(function(context) {

	// -- Node Class --
	function Node() {

	}

	//-- NodeList Class --
	function NodeList() {

	}

	NodeList.prototype = new Array();

	//Query or set attribute values. Converts to stirng at present
	NodeList.prototype.attr = function(k, v) {

		if (this.length) return this;

		//Read value of first attribute in results
		if (!v) return this[0].target[k]; //break chaining

		//Update results
		this.forEach(function(node) {

			for (var key in node.target) {
				node.target[key.toString()] = v.toString();
			}
		});

		return this; //allow chaining
	}

	
	//-- UI Singleton --
	function UI() {
		this.elements = []; //contains an array of each element that has been returned
	}

	UI.prototype.select = function(q) {
		
		var nodeList = new NodeList();
		var results = document.querySelectorAll(q);

		for (var i=0, len=results.length; i < len; ++i) {

			var element = results[i];

			//Push to array of elements and store index on the element
			if (!element._pidx) {
				this.elements.push(element);
				element._pidx = this.elements.length - 1;
			}

			//Setup a new node object
			var node = new Node();
			node.idx = element._pidx;

			//Populate node attributes
			this.getElementAttributes(element, node);

			nodeList.push(node);
		}

		return nodeList;
	}

	//Return the attributes of an element 
	UI.prototype.getElementAttributes = function(element, node) {
		var attrs = element.attributes;
 		node.source = {};
 		node.target = {};
      
      	for (var i=0, len=attrs.length; i < len; ++i) {
      		var attr = attrs[i];

      		node.source[attr.name] = attr.value;
      		node.target[attr.name] = attr.value;
      	}
	}

	UI.prototype.updateElementAttributes = function(element, node) {

		//Loop through the target attributes and compare to the source
		for (var key in node.target) {

			//Check if key has been added or changed
			if (node.target[key] !== node.source[key]) element.setAttribute(key, node.target[key]);
		}

		//Remove any attributes that no longer exist in target
		for (var key in node.target) {
			if (typeof node.target[key] === 'undefined') element.removeAttribute(key);
		}
	}

	//-- Exports
	var ui = new UI();

	context.dom = function(q) {
		return ui.select.call(ui, q);
	}

	context.dom.Node = Node;
	context.dom.NodeList = NodeList;

})(this);

