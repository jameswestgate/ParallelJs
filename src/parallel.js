/* Library to enable javascript dom manipulation from another browser process  */
/* https://github.com/jameswestgate/paralleljs */
/* version 0.3 */
/* Copyright James Westgate 2013 */
/* Dual licensed under the MIT and GPL licenses */


/// Core Module ///
(function(context) {

	// -- Node Class --
	function Node() {
		
		//idx, source, target
	}

	//-- NodeList Class --
	function NodeList() {
		
		var len = arguments.length;

		//Loop through each argument and add node references
		if (len) {
			for (var i=0; i<len; i++) {
				
				var arr = arguments[i];
				var len2 = arr.length;
				
				if (len2) {
					for (var j=0; j<len2; j++) {
						if (arr[j] instanceof Node) this.push(arr[j]);
					}
				}
			}
		}
		
	}

	//#todo: Methods such as concat will return new arrays instead of NodeLists
	//So we need to make this array-like instead
	NodeList.prototype = new Array(); 

	//Query or set attribute values. Converts to string at present
	NodeList.prototype.attr = function(k, v) {

		if (this.length === 0 || (!k && !v)) return this;

		//Read value of first attribute in results
		if (!v) return this[0].target.attrs[k];

		//Update results
		this.forEach(function(node) {

			node.target.attrs[k.toString()] = v.toString();
			context.ui.enqueue(node);
			
		});

		return this; //allow chaining
	}

	NodeList.prototype.append = function(n) {
		
		if (this.length === 0 || !n) return this;
		if (!n.fragment) return;

		var node = this[0];

		//#todo: unnessesary creation of another object, should extend existing array instead
		node.append = (node.append) ? new NodeList(node.append, n) : n; 

		context.ui.enqueue(node);

		return this;
	}

	NodeList.prototype.text = function(s) {
		
		if (this.length === 0) return this;

		var node = this[0];

		if (!s) return node.source.text;
		
		node.target.text = s;
		context.ui.enqueue(node);

		return this;
	}

	NodeList.prototype.each = function(fn) {

		this.forEach(function(node, i, a) {

			fn.call(node, i, a);
		});

		return this;
	}

	
	//-- UI Singleton --
	function UI() {
		this.elements = []; //contains an array of each element that has been returned
		this.nodes = []; //contains an array of Nodes that need updating
	}

	UI.prototype.select = function(q) {
		
		var nodeList = new NodeList();
		var results;

		//Passed in a node
		if (q instanceof Node) {
			nodeList.push(q);
			return nodeList;
		}

		//HTML fragment creator
		if (q.charAt(0) === '<' && q.charAt(q.length-1) === '>') {

			//Get elements by placing inside a div
			var div = document.createElement('div');
			div.innerHTML = q;
			results = div.childNodes;

			//Mark the nodelist as a fragment
			nodeList.fragment = true;
		}

		//Query based selector
		else {
			results = document.querySelectorAll(q);
		}

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
			node.tagName = element.tagName;

			//Create a container for old and new values
			//Will want to create a 'copy object' method here instead
	 		node.source = {};
 			node.target = {};

 			node.source.text = element.textContent;
 			node.target.text = element.textContent;

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
			this.appendElements(node);
			this.updateValues(node);


			node = this.nodes.shift();
		}
	}

	//Return the attributes of an element 
	UI.prototype.getElementAttributes = function(element, node) {
		var attrs = element.attributes;
 		node.source.attrs = {};
 		node.target.attrs = {};
      
      	for (var i=0, len=attrs.length; i < len; ++i) {
      		var attr = attrs[i];

      		node.source.attrs[attr.name] = attr.value;
      		node.target.attrs[attr.name] = attr.value;
      	}
	}

	UI.prototype.updateElementAttributes = function(node) {

		var target = node.target.attrs;

		//Loop through the target attributes and compare to the source
		for (var key in target) {

			//Check if key has been added or changed
			if (target[key] !== node.source.attrs[key]) {
				this.elements[node.idx].setAttribute(key, target[key]);
			}
		}

		//Remove any attributes that no longer exist in target
		for (var key in target) {
			if (typeof target[key] === 'undefined') element.removeAttribute(key);
		}
	}

	UI.prototype.appendElements = function(node) {
		
		if (node.append && node.append.length) {

			var parentElement = this.elements[node.idx];
			var child = node.append.shift();

			while (child) {

				parentElement.appendChild(this.elements[child.idx])
				
				child = node.append.shift();
			}
		}
	}

	UI.prototype.updateValues = function(node) {
		
		var parentElement = this.elements[node.idx];

		if (node.source.text !== node.target.text) parentElement.textContent = node.target.text;
	}

	UI.prototype.frameRequest = function() {

		//Force all updates
		context.ui.flush();

		window.requestAnimationFrame(context.ui.frameRequest);
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

