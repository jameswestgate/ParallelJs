test('interface tests', function() {

	ok(window.Node, 'Node class present.');
	ok(window.NodeList, 'NodeList class present.');
	ok(new window.NodeList().length === 0, 'NodeList behaves like an array');
	ok(window.dom, 'dom is present');
	ok(typeof window.dom === 'function', 'dom is a function');

});

test('simple dom selection tests', function() {
  
	var results = window.dom('#qunit-fixture');

  	ok(results instanceof NodeList, 'dom function returns NodeList');

	ok(results.length === 1, 'dom function returns a result');
	
	var result = results[0];
	ok(result.source, 'result has source attributes');
	ok(result.target, 'result has target attributes');

	ok(result.source.id === 'qunit-fixture', 'result source has correct attribute value');
	ok(result.target.id === 'qunit-fixture', 'result target has correct attribute value');
});





