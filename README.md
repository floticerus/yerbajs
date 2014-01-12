# yerbajs
simple data management for javascript designed to work in node.js and (almost) any web browser.

## node
### installation
```javascript
npm install yerbajs
```

### usage
```javascript
var yerba = require( 'yerbajs' );
```

## browser
```html
<script src="yerba-min.js"></script>
```
yerba is added to window.yerba, which is available globally as yerba

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
var results = test.find({ 'foo': 'bar' });
```
