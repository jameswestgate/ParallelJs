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
	ok(result.source, 'result has source attributes');
	ok(result.target, 'result has target attributes');

	ok(result.source.id === 'qunit-fixture', 'result source has correct attribute value');
	ok(result.target.id === 'qunit-fixture', 'result target has correct attribute value');
});


test('attribute tests', function() {

	$('#qunit-fixture').append('<p class="one two three" id="paragraph1">hello world</p>');

	ok(dom('#paragraph1'), 'paragraph element found.');
	ok(dom('#paragraph1').attr(), 'nodelist returned from empty attr');
	ok(dom('#paragraph1').attr().attr() instanceof dom.NodeList, 'attr chaining working.');

	//Attr function overwrites values which normally wouldnt be great for classes
	ok(dom('#paragraph1').attr('class') === 'one two three', 'attr returning target value');
	ok(dom('#paragraph1').attr('class', 'four') instanceof dom.NodeList, 'attr update chained');
	ok(dom('#paragraph1').attr('class') === 'four', 'attr update value working');
})





