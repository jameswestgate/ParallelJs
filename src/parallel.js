/* Library to enable javascript dom manipulation from another browser process  */
/* https://github.com/jameswestgate/paralleljs */
/* version 0.2 */
/* Copyright James Westgate 2013 */
/* Dual licensed under the MIT and GPL licenses */


/// Core Module ///
(function(context) {

	// -- Node Class --
	function Node() {
		this.idx = null, 
		this.source = null,
		this.target = null
	}

	//-- NodeList Class --
	function NodeList() {

	}

	NodeList.prototype = new Array();

	//Query or set attribute values. Converts to string at present
	NodeList.prototype.attr = function(k, v) {

		if (this.length === 0 || (!k && !v)) return this;

		//Read value of first attribute in results
		if (!v) return this[0].target[k];

		//Update results
		this.forEach(function(node) {

			node.target[k.toString()] = v.toString();
			context.ui.enqueue(node);
			
		});

		return this; //allow chaining
	}

	
	//-- UI Singleton --
	function UI() {
		this.elements = []; //contains an array of each element that has been returned
		this.nodes = []; //contains an array of Nodes that need updating
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

	//Push the node to be updated onto the update queue
	UI.prototype.enqueue = function(node) {
		this.nodes.push(node);
	}

	//Update and remove all nodes out of the update queue
	UI.prototype.flush = function() {

		var node = this.nodes.shift();

		while (node) {

			//Update attributes (at this stage even if they havent changed)
			this.updateElementAttributes(node);

			node = this.nodes.shift();
		}
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

	UI.prototype.updateElementAttributes = function(node) {

		//Loop through the target attributes and compare to the source
		for (var key in node.target) {

			//Check if key has been added or changed
			if (node.target[key] !== node.source[key]) {
				this.elements[node.idx].setAttribute(key, node.target[key]);
			}
		}

		//Remove any attributes that no longer exist in target
		for (var key in node.target) {
			if (typeof node.target[key] === 'undefined') element.removeAttribute(key);
		}
	}

	UI.prototype.frameRequest = function() {

		//Force all updates
		context.ui.flush();

		context.requestAnimationFrame(context.ui.frameRequest);
	}

	//-- Exports
	context.dom = function(q) {
		return context.ui.select.call(context.ui, q);
	}

	context.ui = new UI();
	context.dom.Node = Node;
	context.dom.NodeList = NodeList;

	//-- Begin callback loop
	context.ui.frameRequest();

})(this);

