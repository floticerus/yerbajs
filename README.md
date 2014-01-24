# yerbajs
simple data management for javascript designed to work in node.js and (almost) any web browser.

## browser
```html
<script src="yerba-min.js"></script>
```
yerba is added to `window.yerba`, which is available globally as `yerba`

## node
currently does not work properly in node - attempting to have builtin cluster support.

### installation
```javascript
npm install yerbajs
```

### usage
```javascript
var yerba = require( 'yerbajs' );
```

## basic example
```javascript
var test = new yerba();

test.add({
	'foo': 'bar'
});

test.add({
	'foo': 'not bar'
});

// returns the first object added
test.find({
	'query': { 'foo': 'bar' },
	'done': function ( doc ) {
		// doc holds an array containing matches
	}
});
```
