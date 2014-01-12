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

        _helper.prototype = {
            _init: function () {
                
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
                var argh = this.toArray( arguments );

                if ( argh.length === 1 && this.isArray( argh[ 0 ] ) )
                    argh = argh[ 0 ];

                var first = argh[ 0 ] || [];

                if ( argh.length >= 2 )
                    for ( var i = 1, l = argh.length; i < l; ++i )
                        if ( typeof argh[ i ] !== 'undefined' )
                            for ( var key2 in argh[ i ] )
                                typeof key2 !== 'undefined' && ( first[ key2 ] = argh[ i ][ key2 ] );
                    
                return first;
            },

            // generates an id that can start with a number or letter
            // default is 16 characters
            /* genId: function ( numberOfCharacters ) {
                for ( var s = '', i = 0, l = numberOfCharacters || 16; i < l; ++i )
                    s += ( Math.random() * 36 | 0 ).toString( 36 );

                return s;
            }, */ 

            // generates an id that always starts with a lowercase letter
            // default is 16 characters
            genId: function ( numberOfCharacters ) {
                var i = 0,
                    l = ( numberOfCharacters || 16 ) - 1,
                    s = ( ( Math.random() * 26 ) + 10 | 0 ).toString( 36 );

                for ( ;i < l; ++i ) {
                    var n = Math.random() * 36 | 0,
                        c = n.toString( 36 );

                    if ( n > 9 && ( Math.random() + 0.3 | 0 ) === 1 )
                        c = c.toUpperCase();

                    s += c;
                }

                return s;
            }
        };

        return _helper;

    })();

    /* ------------------------------/
o=== *  yerba code                  /
    \* ---------------------------*/

    ( function ( $, undefined ) {
        var timeMethod = Date.prototype.toISOString ? 'toISOString' : 'getTime';

        function _yerba(){

        }

        _yerba.prototype = {
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
        };

        function yerba( obj ) {
            if ( this._init ) {
                return this._init( obj );
            } else {
                // after yerba keeps track of all yerbas, make yerba( 'foo' ) a search function
            }
        }

        /* function yerbaInit( arr ) {
            return new yerba( arr );
        } */

        yerba.prototype = {
            _init: function ( arr ) {
                arr = arr || [];

                // id name for internal use
                // default is _id, which plays nicely with mongodb and other databases that use _id
                // if your data uses 'id' for example, just use yerba( 'idName', 'id' );
                this.idName = '_id';

                this.idLength = 8;

                this.lastUpdate = 0;

                this.length = 0;

                this._resetIndices();

                if ( typeof arr !== 'undefined' )
                    this.add( arr );

                if ( yerba.logLevel <= 3 )
                    this.log( 3, 'yerba initialized' );
                else {
                    this.log( 4, JSON.stringify( this ) );
                }

                return this;
            },

            // used internally
            _setLastUpdate: function () {
                // fallback to getTime if toISOString is not available
                this.lastUpdate = new Date()[ timeMethod ]();
            },

            // used internally
            _generateId: function () {
                var r = $.genId( this.idLength );

                while ( this.indices[ this.idName ].hasOwnProperty( r ) )
                    r = $.genId( this.idLength );

                return r;
            },

            _resetIndices: function () {
                this.indices = {};

                this.indices[ this.idName ] = {};

                console.log( this.indices );

                this.each( function ( yerbaKey, yerbaValue ) {
                    this.indices[ this.idName ][ yerbaValue[ this.idName ] ] = yerbaKey;
                });

                // return this so it's chainable
                return this;
            },

            // yerbas can have their own logs and log levels
            log: function ( targetLevel, msg ) {
                return targetLevel <= yerba.logLevel ? console.log( 'yerba:' + targetLevel + ':> ' + msg ) : false;
            },

            set: function ( key, val ) {
                if ( this.hasOwnProperty( key ) )
                    this[ key ] = val;

                switch ( key ) {
                    case 'idName':
                        this._resetIndices();
                }
            },

            each: function ( callback ) {
                for ( var i = 0, l = this.length; i < l; ++i ) {
                    var r = callback.call( this, i, this[ i ] );
                    if ( !r && typeof r !== 'undefined' )
                        break;
                }

                return this;
            },

            getDataById: function ( dataID ) {
                return this.indices[ this.idName ].hasOwnProperty( dataID ) ? this[ this.indices[ this.idName ][ dataID ] ] : false;
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

                        // needs == instead of === to cast between String and Number
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

                this._resetIndices();

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

                data[ this.idName ] = data.data[ this.idName ] || this._generateId();

                if ( this.indices[ this.idName ].hasOwnProperty( data[ this.idName ] ) ) {
                    this[ this.indices[ this.idName ][ data[ this.idName ] ] ] = data;
                } else {
                    var nl = this.length++;

                    this[ nl ] = data;

                    this.indices[ this.idName ][ data[ this.idName ] ] = nl;
                }

                // set this.lastUpdate
                this._setLastUpdate();

                return this;
            },

            // allows you to add multiple items
            // like... data.addMultiple( [ 'one' ], [ 'two' ], [ 'three' ] );
            add: function ( arr ) {
                if ( !$.isArray( arr ) )
                    arr = [ arr ];

                for ( var i = 0, l = arr.length; i < l; ++i )
                    this.addOne( arr[ i ] );

                return this;
            },

            /* remove: function ( dataID ) {
                // need to rewrite
                var current = this.getDataById( data._id );

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

                // could skip the _resetIndices and just delete the last one...
                this._resetIndices();

                return r;
            },

            // removes the first item and returns it
            shift: function () {
                var r = Array.prototype.shift.call( this );
                
                this._resetIndices();

                return r;
            },

            flush: function () {
                // reset
                this.each( function ( yerbaKey, yerbaValue ) {
                    delete this[ yerbaKey ];
                });

                this._resetIndices();

                this.lastUpdate = 0;

                this.length = 0;

                return this;
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

        $.extend( yerba, _yerba.prototype, { 'fn': yerba.prototype } );

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

        else if ( typeof window !== 'undefined' )
            // probably in a web browser
            window.yerba = yerba;

    })( new helper(), undefined );

})();
