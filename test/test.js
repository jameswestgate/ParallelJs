test('interface tests', function() {

	ok(window.dom, 'dom is present');
	ok(typeof window.dom === 'function', 'dom is a function');

	ok(window.dom.Node, 'Node class present.');
	ok(window.dom.NodeList, 'NodeList class present.');
	ok(new window.dom.NodeList().length === 0, 'NodeList behaves like an array');
	
});


test('simple dom selection tests', function() {
  
	var results = window.dom('#qunit-fixture');

  	ok(results instanceof window.dom.NodeList, 'dom function returns NodeList');

	ok(results.length === 1, 'dom function returns a result');
	
	var result = results[0];
	ok(result.source.attrs, 'result has source attributes');
	ok(result.target.attrs, 'result has target attributes');

	ok(result.source.attrs.id === 'qunit-fixture', 'result source has correct attribute value');
	ok(result.target.attrs.id === 'qunit-fixture', 'result target has correct attribute value');

	//Reselect node
	ok(dom(result) instanceof dom.NodeList, 'reselect node as nodelist');
});


test('attribute tests', function() {

	$('#qunit-fixture').append('<p class="one two three" id="paragraph1">hello world</p>');

	ok(dom('#paragraph1').length === 1, 'paragraph element found.');
	ok(dom('#paragraph1').attr(), 'nodelist returned from empty attr');
	ok(dom('#paragraph1').attr().attr() instanceof dom.NodeList, 'attr chaining working.');

	//Attr function overwrites values which normally wouldnt be great for classes
	ok(dom('#paragraph1').attr('class') === 'one two three', 'attr returning target value');
	ok(dom('#paragraph1').attr('class', 'four') instanceof dom.NodeList, 'attr update chained');

	//Make sure changes are applied to dom 
	ui.flush();
	ok(dom('#paragraph1').attr('class') === 'four', 'attr update value working');

	//todo: add attribute removal test
})

test('append tests', function() {

	$('#qunit-fixture').append('<div id="div1">');

	//Create a simple fragment -> nodeList
	var nodeList = dom('<p id="paragraph2"></p>');
	
	ok(nodeList instanceof dom.NodeList, 'dom fragment as nodeList created');
	ok(nodeList.length === 1, 'fragment returned with paragraph2 element.');
	ok(nodeList[0] instanceof dom.Node, 'fragment nodeList contains Node');

	//Append to test div
	dom('#div1').append(nodeList);
	ui.flush();

	ok(dom('#paragraph2').length === 1, 'paragraph element appended');

	//Simple fragment with attribute manipulation
	nodeList = dom('<p id="paragraph3" class="five"></p>');
	ok(nodeList.length === 1, 'fragment returned with paragraph3 element.');
	ok(nodeList.attr('class') === 'five', 'attr update value working pre append');
	
	dom('#div1').append(nodeList);
	ui.flush();
	ok(dom('#paragraph3').attr('class') === 'five', 'attr update value working post append');

	//Multiple child elements
	nodeList = dom('<p id="paragraph4"></p><p id="paragraph5"></p>');
	dom('#div1').append(nodeList);
	ui.flush();

	ok(dom('#paragraph4, #paragraph5').length === 2, 'paragraph elements 4 and 5 appended');

	//Nested child elements
	nodeList = dom('<p id="paragraph6"><span id="span1">hello world</span></p>');
	
	ok(nodeList.length === 1, 'fragment returned with paragraph6 element.');

	dom('#div1').append(nodeList);
	ui.flush();

	ok(dom('#paragraph6, #span1').length === 2, 'paragraph element 6 and span1 appended');
	ok(dom('#paragraph6 #span1').length === 1, 'span1 appended as child of paragraph6');

	//Multiple chained appends same node
	var nodeList1 = dom('<p id="paragraph7"></p>');
	var nodeList2 = dom('<p id="paragraph8"></p>');
	
	dom('#div1').append(nodeList1).append(nodeList2);
	ui.flush();

	ok(dom('#paragraph7, #paragraph8').length === 2, 'paragraph elements 7 and 8 appended');

	//Pass markup directly to append
	//todo: write test
});

test('value tests', function() {

	$('#qunit-fixture').append('<div id="div2">');

	var nodeList = dom('<p id="paragraph9"><span id="span2">hello world</span></p>');
	ok(nodeList.length === 1, 'fragment returned with paragraph9 element.');

	dom('#div2').append(nodeList);
	ui.flush();

	//Read text
	ok(dom('#paragraph9').length === 1, 'paragraph 9 added');
	ok(dom('#paragraph9 #span2').length === 1, 'span 2 added');
	ok(dom('#span2').text() === 'hello world', 'text read correctly');

	//Update text
	dom('#span2').text('test');
	ui.flush();

	ok(dom('#span2').text() === 'test', 'text updated correctly');

	//Read text multiple nodes

	//Write text multiple nodes
});

test('callback tests', function() {

	$('#qunit-fixture').append('<div id="div3">');

	var nodeList = dom('<ul id="list1"><li>alpha</li><li>bravo</li><li>charlie</li></ul>');

	dom('#div3').append(nodeList);
	ui.flush();

	ok(dom('#list1 li').length === 3, 'unsorted list 1 with 3 list items added');

	var count = 0;
	dom('#list1 li').each(function(i, a) {
		if (this instanceof dom.Node && this.tagName.toLowerCase() === 'li' && (i >=0 && i<=2) && a.length) count ++;
	});

	ok(count === 3, 'each list item enumerated');

	//Select item inside each
	count = 0;
	dom('#list1 li').each(function(i, a) {
		var self = dom(this);
		var text = self.text();

		if (self.length) count++;
	});

	ok(count === 3, 'each list item converted to sub nodeList');

});

test('event tests', function() {

	var result = false;

	$('#qunit-fixture').append('<div id="div4"><a href="#">link</a></div>');

	dom('#div4 a').on('click', function(e) {
		result = true;
	});
	
	ui.flush();

	//Now trigger the click manually
	dom('#div4 a').on('click');
	ui.flush();

	ok(result, 'Test anchor was manually clicked');

	//Event prevention test
	//Multiple events test
	//Event off tests
	//Correct event parameter
	//Creat nodelist from node context
});

test('document tests', function() {

	expect(6);

	$('#qunit-fixture').append('<div id="div5">');

	var doc = new dom.Document();
	ok(doc instanceof dom.Document , 'Document instance created');

	var results = dom(document);

  	ok(results instanceof window.dom.NodeList, 'dom document function returns NodeList');
	ok(results.length === 1, 'dom function returns a list with one item');
	ok(results[0] instanceof dom.Document , 'dom function returns a Document instance');
	
	dom(document).ready(function() {
		
		ok(true, 'Document is ready');
		start();
	});

	dom(document, '#div5').ready(function() {
		
		ok(true, 'Document is ready with filter');
		start();
	});

	dom(document, '#no-exists').ready(function() {
		
		ok(true, 'This should not be called');
		start();
	});

	stop();

	ui.flush();
});

