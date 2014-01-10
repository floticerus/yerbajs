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
		/* var createObject = Object.create || ( function () {
			function F(){}

			return function( o ) {
				if ( arguments.length !== 1 )
					throw new Error( 'Object.create implementation only accepts one parameter.' );

				F.prototype = o
					return new F()
			}
		})(); */

		function _helper() {
			this._init();
		}

		function doExtend( argh ) {
			var first = argh[ 0 ] || [];

			if ( argh.length >= 2 )
				for ( var i = 1, l = argh.length; i < l; ++i )
					if ( typeof argh[ i ] !== 'undefined' )
						for ( var key2 in argh[ i ] )
							typeof key2 !== 'undefined' && ( first[ key2 ] = argh[ i ][ key2 ] );
				
			return first;
		}

		_helper.prototype = {
			_init: function () {
				this.logging = true;
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

			// converts an array like object to a normal array
			toArray: function ( obj ) {
				var r = [];

				for ( var i = 0, l = obj.length; i < l; ++i )
					r.push( obj[ i ] );

				return r;
			},

			extend: function () {
				doExtend( this.toArray( arguments ) );
			},

			// http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
			genUID: function () {
				return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace( /[xy]/g, function( c ) {
					var r = Math.random() * 16 | 0, v = c === 'x' ? r : ( r & 0x3 | 0x8 );

					return v.toString( 16 );
				});
			}
		};

		return _helper;
	})();

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

		$.extend( yerba, {
			// provide a public reference to the helper methods
			_$: $,

			logLevel: 3,

			brew: function ( arr ) {
				return new yerba( arr );
			},

			isYerba: function ( obj ) {
				return obj instanceof yerba;
			},

			set: function ( key, val ) {
				if ( yerba.hasOwnProperty( key ) )
					this[ key ] = val;
			}
		});

		/* function yerbaInit( arr ) {
			return new yerba( arr );
		} */

		yerba.prototype = {
			_init: function ( arr ) {
				arr = arr || [];

				this.indices = { '_id': {} };

				this.lastUpdate = 0;

				this.length = 0;

				this.add( arr );

				if ( yerba.logLevel <= 3 )
					this.log( 3, 'yerba initialized' );
				else {
					this.log( 4, JSON.stringify( this ) );
				}

				return this;
			},

			brew: function ( arr ) {
				return this._init( arr );
			},

			// used internally
			_setLastUpdate: function () {
				// fallback to getTime if toISOString is not available
				this.lastUpdate = new Date()[ timeMethod ]();
			},

			// used internally
			_generateUID: function () {
				var r = $.genUID();

				while ( this.indices._id.hasOwnProperty( r ) )
					r = $.genUID();

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

			log: function ( targetLevel, msg ) {
				return targetLevel <= yerba.logLevel ? console.log( 'yerba:' + targetLevel + ':> ' + msg ) : false;
			},

			set: function ( key, val ) {
				// set the helper if it has the same option name
				if ( $.hasOwnProperty( key ) )
					$[ key ] = val;

				if ( this.hasOwnProperty( key ) )
					this[ key ] = val;
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

				if ( $.isFunction( obj ) ) {
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
			add: function ( arr ) {
				for ( var i = 0, l = arr.length; i < l; ++i )
					this.addOne( arr[ i ] );

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
				return $.toArray( this );
			},

			slice: function ( start, end ) {
				return new yerba( Array.prototype.slice.call( this, start, end ) );
			},

			// removes the last item and returns it
			pop: function () {
				var r = Array.prototype.pop.call( this );

				// could skip the reindex and just delete the last one...
				this._reIndex();

				return r;
			},

			// removes the first item and returns it
			shift: function () {
				var r = Array.prototype.shift.call( this );
				
				this._reIndex();

				return r;
			},

			flush: function () {
				// reset
				this.each( function ( yerbaKey, yerbaValue ) {
					delete this[ yerbaKey ];
				});

				// init clears everything else
				return this._init();
			},

			// merge data from other yerba objects into this object - basically an extend
			// should add a filter on merge
			merge: function ( arr ) {
				if ( yerba.isYerba( arr ) )
					arr = [ arr ];

				for ( var r = [], i = 0, l = arr.length; i < l; ++i )
					if ( yerba.isYerba( arr[ i ] ) )
						arr[ i ].each( function ( yerbaKey, yerbaValue ) {
							r.push( yerbaValue.data );
						});

				this.add( r );

				return this;
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
		
		//var tempYerba = $.extend( yerbaInit, yerba );

		if ( typeof module !== 'undefined' && module.exports )
			// probably in nodejs
			module.exports = yerba;

		else if ( window )
			// in a web browser
			window.yerba = yerba;

		else
			// not in node or a browser... so just return it?
			return yerba;
	})( new helper(), undefined );

})();
