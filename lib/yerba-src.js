/** @preserve yerbajs - simple javascript data management
 *  @copyright 2014 Kevin von Flotow <vonflow@gmail.com>
 *  @license MIT License <http://opensource.org/licenses/MIT>
 */

(function () {
	var timeMethod = Date.prototype.toISOString ? 'toISOString' : 'getTime';

	// arr must be an array of items
	function yerba( arr ) {
		this._init( arr );
	}

	// http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
	function genUID() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace( /[xy]/g, function( c ) {
			var r = Math.random() * 16 | 0, v = c == 'x' ? r : ( r & 0x3 | 0x8 );
			return v.toString( 16 );
		});
	}

	function isFunction( func ) {
		return Object.prototype.toString.call( func ) === '[object Function]';
	}

	function isString( str ) {
		return typeof( str ) === 'string' || str instanceof String;
	}

	function isNumber( num ) {
		return !isNaN( parseFloat( num ) ) && isFinite( num );
	}

	yerba.prototype = {
		_init: function ( arr ) {
			arr = arr || [];

			this.indices = { '_id': {} };

			this.lastUpdate = 0;

			this.length = 0;

			for ( var i = 0, l = arr.length; i < l; i++ )
				this.add( arr[ i ] );

			// return this so it's chainable
			return this;
		},

		// used internally
		_setLastUpdate: function () {
			// fallback to getTime if toISOString is not available
			this.lastUpdate = new Date()[ timeMethod ]();
		},

		// used internally
		_generateUID: function () {
			var r = genUID();

			while ( this.get( r ) ) {

			}

			if ( !this.get( r ) )
				return r;
			else
				return this._generateUID();
		},

		reMap: function () {
			this.indices = { '_id': {} };

			this.each( function ( yerbaKey, yerbaValue ) {
				this.map[ yerbaValue._id ] = yerbaKey;
			});

			// return this so it's chainable
			return this;
		},

		each: function ( callback ) {
			for ( var i = 0, l = this.length; i < l; ++i ) {
				var r = callback.call( this, i, this[ i ] );
				if ( !r && typeof r !== 'undefined' )
					break;
			}

			// return this so it's chainable
			return this;
		},

		get: function ( dataID ) {
			return this.indices._id.hasOwnProperty( dataID ) ? this[ this.indices._id[ dataID ] ] : false;
		},

		find: function ( obj ) {
			// does not take indices into consideration yet
			//
			// determine all query fields, check against indices.
			// only return indexed results if all query fields are indexed

			/*
				obj: {
					query: { 'foo': 'bar' },
					opts: { caseSensitive: true },
					done: function ( err, item )
				}
			*/
			if ( !obj )
				return false;

			var c = {
				query: undefined,
				opts: {},
				done: function ( item ) {}
			};

			if ( isFunction( obj ) ) {
				c.done = arguments[ 0 ];
			} else {
				// assume it's an object
				c.query = typeof obj.query !== 'undefined' ? obj.query : c.query;
				c.opts = obj.opts || c.opts;
				c.done = obj.done || c.done;
			}

			c.opts.caseSensitive = typeof c.opts.caseSensitive !== 'undefined' ? c.opts.caseSensitive : true;

			// check if it's a number, floor the result
			c.opts.limit = typeof c.opts.limit !== 'undefined' && isNumber( c.opts.limit ) ? c.opts.limit | 0 : 0;

			var r = [];

			this.each( function ( yerbaKey, yerbaValue ) {
				var total = 0, successes = 0;

				if ( isString( c.query ) || isNumber( c.query ) ) {
					total = 1;

					// think it might need == instead of === but we'll see
					if ( typeof yerbaValue.value !== 'undefined' && yerbaValue.value == c.query )
						successes = 1;
				} else {
					for ( var key in c.query ) {
						// incoming long line...
						if ( yerbaValue.hasOwnProperty( key ) && ( ( c.opts.caseSensitive && yerbaValue[ key ] === c.query[ key ] ) || ( !c.opts.caseSensitive && yerbaValue[ key ].toLowerCase() === c.query[ key ].toLowerCase() ) ) )
							successes++;

						total++;
					}
				}

				if ( successes === total ) {
					r.push( yerbaValue );

					if ( c.opts.limit > 0 && r.length >= c.opts.limit )
						return false;
				}
			});

			c.done.call( this, r );

			// return this so it's chainable
			return this;
		},

		shuffle: function () {
			var i = this.length,
				j, t;

			while ( --i > 0 ) {
				j = ( Math.random() * ( i + 1 ) ) | 0;
				t = this[ j ];
				this[ j ] = this[ i ];
				this[ i ] = t;
			}

			// return this so it's chainable
			return this;
		},

		clone: function () {
			return this.slice( 0 );
		},

		random: function () {
			// clone and shuffle, then return random from that object instead - makes it much more 'random'
			var n = this.clone().shuffle();

			return n[ ( Math.random() * n.length ) | 0 ];
		},

		addOne: function ( data ) {
			if ( isString( data ) || isNumber( data ) ) {
				data = {
					value: data
				};
			}

			data._id = data._id || this._generateUID();

			if ( this.indices._id.hasOwnProperty( data._id ) ) {
				// key exists, update it

				this[ this.indices._id[ data._id ] ] = data;
			} else {
				// key does not exist, create it

				// calculate the position in the object
				var nl = this.length++;

				// save
				this[ nl ] = data;

				// index the _id field
				this.indices._id[ data._id ] = nl;
			}

			// set this.lastUpdate
			this._setLastUpdate();

			// return this so it's chainable
			return this;
		},

		// allows you to add multiple items
		// like... data.addMultiple( [ 'one' ], [ 'two' ], [ 'three' ] );
		add: function () {
			for ( var i = 0, l = arguments.length; i < l; ++i )
				this.addOne( arguments[ i ] );

			// return this so it's chainable
			return this;
		},

		/* remove: function ( dataID ) {
			// need to rewrite
			var current = this.get( data._id );

			if ( current ) {
				delete current;

				this.length--;

				return true;
			}

			return false;
		}, */

		// converts yerba object to a normal array
		toArray: function () {
			var r = [];

			this.each( function ( yerbaKey, yerbaValue ) {
				r.push( yerbaValue );
			});

			return r;
		},

		slice: function ( start, end ) {
			return new yerba( Array.prototype.slice.call( this, start, end ) );
		},

		// removes the last item and returns it
		pop: function () {
			var r = Array.prototype.pop.call( this );

			this.reMap();

			return r;
		},

		// removes the first item and returns it
		shift: function () {
			var r = Array.prototype.shift.call( this );
			
			this.reMap();

			return r;
		},

		flush: function () {
			// reset
			for ( var i = 0, l = this.length; i < l; ++i )
				delete this[ i ];

			// return this so it's chainable
			return this._init();
		}
	};

	/* var test = new yerba(),
		testStrings = new yerba();

	test.add( { 'foo': 'bar' } );

	testStrings.add( 'testone', 'testtwo', { 'mixed': 'type' }, 3 );

	testStrings.find({
		query: '3',
		opts: { 'caseSensitive': false },
		done: function ( item ) {
			console.log( item );
		}
	}); */


	if ( typeof module !== 'undefined' && module.exports )
		// probably in nodejs
		module.exports = yerba;

	else if ( window )
		// in a web browser
		window.yerba = yerba;

	else
		// not in node or a browser... so just return it?
		return yerba;

})();
