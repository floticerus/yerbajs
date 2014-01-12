# yerbajs
simple data management for javascript designed to work in node.js and (almost) any web browser.

## node
### installation
`npm install yerbajs`

### usage

```javascript
var yerba = require( 'yerbajs' );

var parent = new yerba();

var child = new yerba([ 'string', 36, { 'foo': 'bar' }, true, [ 1, 2, 3 ] ]);

parent.add( child );
```

## browser
`<script src="yerba-min.js"></script>`
