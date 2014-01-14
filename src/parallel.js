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

	function Document() {
		this.filter = '';
	}

	Document.prototype = new Node();
	

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
	UI.prototype.select = function(q, s) {
		
		var nodeList = new NodeList();
		var results;

		//Passed in actual document or internal document
		if (q === document || q instanceof Document) {
			
			var doc = (q === document) ? new Document() : q;

			if (s) doc.filter = s;

			nodeList.push(doc);
			return nodeList;
		}

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
			if (!element.__pidx) {
				this.elements.push(element);
				element.__pidx = this.elements.length - 1;
			}

			//Setup a new node object
			//A node memoises the state of an element so more than one can exist for each element
			var node = context.ui.createNode(element);

			//Initialise node
			this.inits.forEach(function(fn) {
				fn.call(this, node, element);
			});

			nodeList.push(node);
		}

		return nodeList;
	}

	UI.prototype.createNode = function(element) {
		var node = new Node();
		
		node.idx = element.__pidx;
		node.tagName = element.tagName;

		return node;
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
	context.dom = function(q, s) {
		return context.ui.select.call(context.ui, q, s);
	}

	context.dom.Node = Node;
	context.dom.NodeList = NodeList;
	context.dom.Document = Document;

	//-- Begin callback loop
	context.ui = new UI();
	document.addEventListener('DOMContentLoaded', context.ui.frameRequest, false);

})(this);


/// Events ///
(function(context) {

	//-- Setup and process a collection of all document event handlers
	var handles = {};

	var eventClasses = {
		'MouseEvents': ['click', 'mousedown', 'mouseup'],
		'HTMLEvents': ['focus', 'change', 'blur', 'select']
	};

	//Add mouse events listeners to the document
	eventClasses.MouseEvents.forEach(function(name){

		handles[name] = [];
		
		document.addEventListener(name, handleEvent);
	});

	//Add html events listeners to the document
	eventClasses.HTMLEvents.forEach(function(name){

		handles[name] = [];
		
		document.addEventListener(name, handleEvent);
	});

	//Generic handler for all events
	function handleEvent(e) {
		
		//We need to know the event name and also the event target
		handles[e.type].forEach(function(handle){
			handle.call(context.ui.createNode(e.target), e);
		});
	}

	//Plug-ins to add event handlers
	context.fn.extend('on', function(n, fn) {
			
		if (n) {
			
			n = n.toLowerCase();

			this.forEach(function(node) {
				
				//todo: combine node.on and node.triggers into single array
				if (fn) {
					
					if (!node.on) node.on = [];
					node.on.push([n, fn]);

					context.ui.enqueue(node);
				}
				else {
				
					//Add unvalidated trigger
					if (!node.triggers) node.triggers = [];
					node.triggers.push(n);

					context.ui.enqueue(node);
				}
			});
		}

	});

	context.fn.extend('off', function(n, fn) {
		
		//1 argument - remove all
		//2 args - remove matching

		this.forEach(function(node) {
			
			if (!node.off) node.off = [];
			node.off.push([n, fn])

			context.ui.enqueue(node);
		});

	});

	//-- Handle node updates
	context.ui.notify(function(node, elements) {

      	//Detect any new event handlers
      	//todo: combine node.on and node.triggers into single array
      	if (node.on && node.on.length) {
      		
      		var on = node.on.shift();
	      		
	      	while (on) {
	      		
	      		//How on earth do you stop events going up the dom?
	      		//You cant in an async environment
	      		//Which means we might as well bind everything as live events to the document
	      		//todo: This could be a big problem for eg cancelling or continuing navigation
	      		//suggestion - in worker thread, prevent default is flipped to on and cant be changed
	      		//implementation would bind directly in browser threads and preventDefault & continueDefault would manually change this
	      		handles[on[0]].push(on[1]);

	   			on = node.on.shift();
   			}
      	}

      	//Trigger any events
      	if (node.triggers && node.triggers.length) {

      		var eventName = node.triggers.shift();
	      		
	      	while (eventName) {
	      	
		        //Different events have different event classes.
		        //If you can't map an eventName to an eventClass then the event firing is going to fail.
		        var eventClass = (eventClasses.MouseEvents.indexOf(eventName) !== -1) ? 'MouseEvents' : 'HTMLEvents';

		        var evt = document.createEvent(eventClass);		        
		        evt.initEvent(eventName, eventName !== 'change', true); // All events created as bubbling and cancelable.
		        evt.synthetic = true; // allow detection of synthetic events
		        
		        //The second parameter says go ahead with the default action
		        elements[node.idx].dispatchEvent(evt, true);

	   			eventName = node.triggers.shift();
   			}
      	}
	})

})(this);


/// Internal plug-ins ///
(function(context) {

	//Ready 
	context.fn.extend('ready', function(fn) {

		var node = this[0];

		if (node instanceof context.dom.Document) {

			node.ready = fn;
			context.ui.enqueue(node);
		}
	});

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


	//-- Generic initialization
	context.ui.initialise(function(node, element) {

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

		if (node instanceof context.dom.Document) {

			var flag = (!node.filter) || document.querySelectorAll(node.filter).length;
			if (flag) node.ready.call();

			return;
		}

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
		//todo: need heuristic to bypass iterative check
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
	})

})(this);
	

