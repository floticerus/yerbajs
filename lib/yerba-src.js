/** @preserve yerbajs - simple javascript data management
 *  @copyright 2014 Kevin von Flotow <vonflow@gmail.com>
 *  @license MIT License <http://opensource.org/licenses/MIT>
 */

// TODO: when running on nodejs, find a way to take clusters into consideration
//       without using an external db. THEN, offer a way to link any type of db
//       and save data in the background, while still serving the local data

;( function () {
    /* ------------------------------/
o=== *  helper code                 /
    \* ---------------------------*/
	var helper = ( function () {
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create
		var createObject = Object.create || ( function () {
			function F(){}

			return function( o ) {
				if ( arguments.length != 1 )
					throw new Error( 'Object.create implementation only accepts one parameter.' );

				F.prototype = o
					return new F()
			}
		})();

		function _helper() {}

		_helper.prototype = {
			// http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
			genUID: function () {
				return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace( /[xy]/g, function( c ) {
					var r = Math.random() * 16 | 0, v = c === 'x' ? r : ( r & 0x3 | 0x8 );

					return v.toString( 16 );
				});
			},

			// type checks
			isFunction: function ( func ) {
				return Object.prototype.toString.call( func ) === '[object Function]';
			},

			isString: function ( str ) {
				return typeof( str ) === 'string' || str instanceof String;
			},

			isNumber: function ( num ) {
				return !isNaN( parseFloat( num ) ) && isFinite( num );
			},

			isObject: function ( obj ) {
				return obj === Object( obj ) && Object.prototype.toString.call( obj ) !== '[object Array]';
			},

			isArray: Array.isArray || function ( arr ) {
				return Object.prototype.toString.call( arr ) === '[object Array]';
			},

			// utilities
			toArray: function ( obj ) {
				var r = [];

				for ( var i = 0, l = obj.length; i < l; ++i )
					r.push( obj[ i ] );

				return r;
			},

			extend: function () {
				var a = arguments;

				if ( a.length === 0 )
					return false;

				for ( var i = 0, l = a.length, n = createObject( a[ 0 ] ); i < l; i++ )
					for ( var obj in a[ i ] )
						n[ obj ] = a[ i ][ obj ];

				return n;
			}
		};

		return new _helper();
	}).call( this );

    /* ------------------------------/
o=== *  yerba code                  /
    \* ---------------------------*/
	( function ( $, undefined ) {
		var timeMethod = Date.prototype.toISOString ? 'toISOString' : 'getTime';

		function yerba( obj ) {
			if ( this._init ) {
				return this._init( obj );
			} else {
				// after yerba keeps track of all yerbas, make yerba( 'foo' ) a search function
			}
		}

		function yerba_init( arr ) {
			arr = arr || [];

			this.indices = { '_id': {} };

			this.lastUpdate = 0;

			this.length = 0;

			for ( var i = 0, l = arr.length; i < l; i++ )
				this.add( arr[ i ] );
		}

		function yerba_find( obj ) {
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
			c.opts.limit = typeof c.opts.limit !== 'undefined' && $.isNumber( c.opts.limit ) ? c.opts.limit | 0 : 0;

			var r = [];

			this.each( function ( yerbaKey, yerbaValue ) {
				var total = 0, successes = 0;

				if ( $.isString( c.query ) || $.isNumber( c.query ) ) {
					total = 1;

					// think it might need == instead of === but we'll see
					if ( typeof yerbaValue.data !== 'undefined' && yerbaValue.data == c.query )
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

			return this;
		}

		function yerba_add() {
			for ( var i = 0, l = arguments.length; i < l; ++i )
				this.addOne( arguments[ i ] );

			return this;
		}

		// removes the last item and returns it
		function yerba_pop() {
			var r = Array.prototype.pop.call( this );

			this._reIndex();

			return r;
		}

		function yerba_flush() {
			// reset
			for ( var i = 0, l = this.length; i < l; ++i )
				delete this[ i ];

			return this._init();
		}

		function yerba_shuffle() {
			var i = this.length,
				j, t;

			while ( --i > 0 ) {
				j = ( Math.random() * ( i + 1 ) ) | 0;
				t = this[ j ];
				this[ j ] = this[ i ];
				this[ i ] = t;
			}

			return this;
		}

		yerba.prototype = {
			_init: yerba_init,
			brew: yerba_init,

			// used internally
			_setLastUpdate: function () {
				// fallback to getTime if toISOString is not available
				this.lastUpdate = new Date()[ timeMethod ]();
			},

			// used internally
			_generateUID: function () {
				for ( var r = $.genUID(); this.get( r ); r = $.genUID() ){}

				return r;
			},

			_reIndex: function () {
				this.indices = { '_id': {} };

				this.each( function ( yerbaKey, yerbaValue ) {
					this.indices._id[ yerbaValue._id ] = yerbaKey;
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

				return this;
			},

			get: function ( dataID ) {
				return this.indices._id.hasOwnProperty( dataID ) ? this[ this.indices._id[ dataID ] ] : false;
			},

			find: yerba_find,
			bombilla: yerba_find,

			shuffle: yerba_shuffle,
			stir: yerba_shuffle,

			clone: function () {
				return this.slice( 0 );
			},

			random: function () {
				// clone and shuffle, then return random from that object instead - makes it much more 'random'
				var n = this.clone().shuffle();

				return n[ ( Math.random() * n.length ) | 0 ];
			},

			addOne: function ( data ) {
				data = {
					data: data
				};

				data._id = data.data._id || this._generateUID();

				if ( this.indices._id.hasOwnProperty( data._id ) ) {
					this[ this.indices._id[ data._id ] ] = data;
				} else {
					var nl = this.length++;

					this[ nl ] = data;

					this.indices._id[ data._id ] = nl;
				}

				// set this.lastUpdate
				this._setLastUpdate();

				return this;
			},

			// allows you to add multiple items
			// like... data.addMultiple( [ 'one' ], [ 'two' ], [ 'three' ] );
			add: yerba_add,
			pour: yerba_add,

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
				return $.toArray( this );
			},

			slice: function ( start, end ) {
				return new yerba( Array.prototype.slice.call( this, start, end ) );
			},

			pop: yerba_pop,
			sip: yerba_pop, // take some off the top...

			// removes the first item and returns it
			shift: function () {
				var r = Array.prototype.shift.call( this );
				
				this._reIndex();

				return r;
			},

			flush: yerba_flush,
			spill: yerba_flush,

			extend: function () {
				for ( var i = 0, l = arguments.length; i < l; ++i ) {
					console.log( yerba.isYerba( arguments[ i ] ) );

					if ( typeof arguments[ i ] === 'yerba' )
						console.log( 'yerbaaa' );
				}
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

		yerba.isYerba = function ( obj ) {
			return obj instanceof yerba;
		};

		// provide a public reference to the helper methods
		yerba._$ = $;

		if ( typeof module !== 'undefined' && module.exports )
			// probably in nodejs
			module.exports = yerba;

		else if ( window )
			// in a web browser
			window.yerba = yerba;

		else
			// not in node or a browser... so just return it?
			return yerba;
	}).call( this, helper, undefined );
}).call( this );
