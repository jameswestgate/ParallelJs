/* Library to enable javascript dom manipulation from another browser process  */
/* https://github.com/jameswestgate/paralleljs */
/* version 0.4 */
/* Copyright James Westgate 2013 */
/* Dual licensed under the MIT and GPL licenses */


/// Core Module ///
(function(context) {

	// -- Node Class --
	function Node() {
		
		//idx, source, target
 		this.source = {};
		this.target = {};
	}

	//-- NodeList Class --
	function NodeList() {
		
		var self = this;

		Array.prototype.slice.call(arguments).forEach(function(arg) {

			//Copy contents of existing NodeList
			if (arg instanceof NodeList) {

				arg.forEach(function(node) {
					self.push(node);
				})
			}
		})
	}

	//Create the function hook for plug-ins
	context.fn = {

		extend: function(name, fn) {

			NodeList.prototype[name] = function() {

				if (this.length === 0) return this;

				var result = fn.apply(this, arguments);

				if (typeof result !== 'undefined') return result;

				return this;
			}
		}
	}

	//#todo: Methods such as concat will return new arrays instead of NodeLists
	//So we need to make this array-like instead
	NodeList.prototype = new Array(); 

	
	//-- UI Singleton --
	function UI() {
		this.elements = []; //contains an array of each element that has been returned
		this.nodes = []; //contains an array of Nodes that need updating
		this.inits = []; //array of functions that are called for each node being initialized
		this.callbacks = []; //array of functions that are called for each node being updated
	}

	//Main element selection function
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

		//Turn elements into nodes
		for (var i=0, len=results.length; i < len; ++i) {

			var element = results[i];

			//Push to array of elements and store index on the element
			if (!element._pidx) {
				this.elements.push(element);
				element._pidx = this.elements.length - 1;
			}

			//Setup a new node object
			//A node memoises the state of an element so more than one can exist for each element
			var node = new Node();
			node.idx = element._pidx;
			node.tagName = element.tagName;

			//Initialise nodes
			this.inits.forEach(function(fn) {
				fn.call(this, node, element);
			});

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
		var elements = this.elements;

		while (node) {

			//Update via generic callbacks array
			this.callbacks.forEach(function(fn) {
				fn.call(this, node, elements);
			});

			node = this.nodes.shift();
		}
	}

	UI.prototype.frameRequest = function() {

		//Force all updates
		context.ui.flush();

		window.requestAnimationFrame(context.ui.frameRequest);
	}

	UI.prototype.initialise = function(fn) {
		this.inits.push(fn);
	}

	UI.prototype.notify = function(fn) {
		this.callbacks.push(fn);
	}

	//-- Exports
	context.dom = function(q) {
		return context.ui.select.call(context.ui, q);
	}

	context.dom.Node = Node;
	context.dom.NodeList = NodeList;

	//-- Begin callback loop
	context.ui = new UI();
	context.ui.frameRequest();

})(this);


/// Internal plug-ins ///
(function(context) {
	
	//Append
	context.fn.extend('append', function(n) {
		
		if (!n || !n.fragment) return;

		var node = this[0];

		//#todo: unnessesary creation of another object, should extend existing array instead
		node.append = (node.append) ? new context.dom.NodeList(node.append, n) : n; 

		context.ui.enqueue(node);
	});

	//Each
	context.fn.extend('each', function(fn) {
	
		this.forEach(function(node, i, a) {
			fn.call(node, i, a);
		});
	});

	//Text
	context.fn.extend('text', function(s) {
		
		var node = this[0];

		if (!s) return node.source.text;
		
		this.forEach(function(node) {
			node.target.text = s;
			context.ui.enqueue(node);
		});
	});

	//Attr
	//Query or set attribute values. Converts value to string at present
	context.fn.extend('attr', function(k, v) {

		if (!k && !v) return;

		//Read value of first attribute in results
		if (!v) return this[0].target.attrs[k];

		//Update results
		this.forEach(function(node) {

			node.target.attrs[k.toString()] = v.toString();
			context.ui.enqueue(node);
		});
	});

	//-- Event handlers --
	context.fn.extend('on', function(n, fn) {
			
		//2 arguments = bind
		//1 argument = trigger

		this.forEach(function(node) {
			
			if (n) n = n.toLowerCase();

			//Bind
			if (n && fn) {
				if (!node.on) node.on = [];
				node.on.push([n, fn])
			}
			//Trigger
			else if (n) {
				
				//Loop through and add triggers for all matching handles
				node.handles.forEach(function(handler) {
					if (handler[0] === n) node.triggers.push(handler);
				});
			}
		});

	});

	context.fn.extend('off', function(n, fn) {
		
		//1 argument - remove all
		//2 args - remove mzatching

		this.forEach(function(node) {
			
			if (!node.off) node.off = [];
			node.off.push([n, fn])
		});

	});


	//-- Generic initialization
	context.ui.initialise(function(node, element) {

		node.handles = [];

		//Add old and new values
		node.source.text = element.textContent;
		node.target.text = element.textContent;

		//Populate node attributes
		var attrs = element.attributes;
 		node.source.attrs = {};
 		node.target.attrs = {};
      
      	for (var i=0, len=attrs.length; i < len; ++i) {
      		var attr = attrs[i];

      		node.source.attrs[attr.name] = attr.value;
      		node.target.attrs[attr.name] = attr.value;
      	}
	})
	

	//-- Generic update handler
	context.ui.notify(function(node, elements) {

		var parentElement = elements[node.idx];

		//-- Append any new nodes
		if (node.append && node.append.length) {

			var child = node.append.shift();

			while (child) {

				parentElement.appendChild(elements[child.idx])
				
				child = node.append.shift();
			}
		}


		//-- Update any text values
		if (node.source.text !== node.target.text) parentElement.textContent = node.target.text;
		
		
		//-- Update or remove any attribute changes (todo: this needs a dirty flag)
		var target = node.target.attrs;

		//Loop through the target attributes and compare to the source
		for (var key in target) {

			//Check if key has been added or changed
			if (target[key] !== node.source.attrs[key]) {
				parentElement.setAttribute(key, target[key]);
			}
		}

		//Remove any attributes that no longer exist in target
		for (var key in target) {
			if (typeof target[key] === 'undefined') parentElement.removeAttribute(key);
		}


      	//-- Detect any new event handlers
      	if (node.on && node.on.length) {
      		
      		var on = node.on.shift();
	      		
	      	while (on) {
	      		
	      		//Wrap the actual event and use it to call the bound function
	      		//How on earth do you stop events going up the dom?
	      		//You cant in an async environment
	      		//Which means we might as well bind everything as live events to the document
	      		//todo: This could be a big problem for eg cancelling or continuing navigation
	      		//suggestion - in worker thread, prevent default is flipped to on and cant be changed
	      		//implementation would bind directly in browser threads, but user would have to flip with 'continueDefault'
	   			parentElement.addEventListener(on[0], function(e) {

	   				if (!node.triggers) node.triggers = [];
	   				node.triggers.push(on);
	   			});

	   			node.handles.push(on);
	   			on = node.on.shift();
   			}
      	}

      	//-- Trigger any events
      	if (node.triggers && node.triggers.length) {

      		var trigger = node.triggers.shift();
	      		
	      	while (trigger) {
	      		
	      		//todo: In a true async environment, the worker thread is going to have to lookup the node reference
	      		trigger[1].call(node);
	   			trigger = node.trigger.shift();
   			}
      	}
	})

})(this);
	

