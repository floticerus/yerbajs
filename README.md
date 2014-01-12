# yerbajs
simple data management for javascript designed to work in node.js and (almost) any web browser.

## node
### installation
`npm install yerbajs`

### browser
`<script src="yerba-min.js"></script>`

## usage

```javascript
var yerba = require( 'yerbajs' );

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
