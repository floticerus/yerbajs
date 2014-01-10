/** @preserve yerbajs - simple javascript data management
 *  @copyright 2014 Kevin von Flotow <vonflow@gmail.com>
 *  @license MIT License <http://opensource.org/licenses/MIT>
 */

(function () {
	var timeMethod = Date.prototype.toISOString ? 'toISOString' : 'getTime';

	// obj must be an array of items
	function yerba( obj ) {
		this._init( obj );
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
		_init: function ( obj ) {
			obj = obj || [];

			this.lastUpdate = 0;

			this.length = 0;

			for ( var i = 0, l = obj.length; i < l; i++ )
				this.add( obj[ i ] );
		},

		// used internally
		_setLastUpdate: function () {
			// fallback to getTime if toISOString is not available
			this.lastUpdate = new Date()[ timeMethod ]();
		},

		// used internally
		_generateUID: function () {
			var r = genUID();

			if ( !this.get( r ) )
				return r;
			else
				return this._generateUID();
		},

		each: function ( callback ) {
			for ( var i = 0, l = this.length; i < l; ++i ) {
				var r = callback.call( this, i, this[ i ] );
				if ( !r && typeof r !== 'undefined' )
					break;
			}

			return this;
		},

		get: function ( dataID ) {
			for ( var i = 0, l = this.length; i < l; ++i )
				if ( this[ i ]._id === dataID )
					return this[ i ];

			// return false if nothing found
			return false;
		},

		find: function ( obj ) {
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

			return c.done( r );

			//return r;
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

			if ( this.get( data._id ) ) {
				for ( var i = 0, l = this.length; i < l; ++i ) {
					if ( this[ i ]._id === data._id ) {
						this[ i ] = data;

						break;
					}
				}
			} else {
				this[ this.length++ ] = data;
			}

			// set this.lastUpdate
			this._setLastUpdate();
		},

		// allows you to add multiple items
		// like... data.addMultiple( [ 'one' ], [ 'two' ], [ 'three' ] );
		add: function () {
			for ( var i = 0, l = arguments.length; i < l; ++i )
				this.addOne( arguments[ i ] );
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
			return Array.prototype.pop.call( this );
		},

		// removes the first item and returns it
		shift: function () {
			return Array.prototype.shift.call( this );
		},

		flush: function () {
			// reset
			for ( var i = 0, l = this.length; i < l; ++i )
				delete this[ i ];

			this.length = 0;
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
