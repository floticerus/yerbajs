;(function () {
    var util = require( 'util' ),
        events = require( 'events' ),
        yerba = require( '../yerba-src' ),

        $ = yerba._$,

        yerbaTriggers = {
            initialize: function () {
                /* sendToMaster({
                    'su': 'brew',
                    'args': [ [ 1, 2, 3 ] ]
                }); */
                //process.send({ 'yerba': { 'su': 'brew', 'args': [ 'test' ] } });
            }
        };

    function nullFunc(){}

    function suOrFn( which, worker, fn, data, done ) {
        var myCallbackId = this.genCallbackId();

        done = typeof done !== 'undefined' && $.isFunction( done ) ? done : nullFunc;

        this._callbacks[ myCallbackId ] = done;

        var obj = {};
        obj[ which ] = fn;
        obj.that = this;
        obj.worker = worker;
        obj.args = data;
        obj.callbackId = myCallbackId;

        process.send( { 'yerba': obj } );
    }

    // empty function, fill it after it's defined
    function _yerbaWorker(){
        events.EventEmitter.call( this );

        this._initWorker();
    }

    util.inherits( _yerbaWorker, events.EventEmitter );

    _yerbaWorker.prototype = {
        ready: function ( fn ) {
            if ( !this._isReady )
                this._fireWhenReady = fn;
            else
                fn( this );
        },
        _isReady: false,
        _fireWhenReady: nullFunc,
        _triggers: {
            initialize: function () {
                this._isReady = true;

                this._fireWhenReady.call( this );

                this._fireWhenReady = nullFunc;
                /* this.su( 'brew', [ [ 1, 2, 3 ] ], function ( data ) {
                    // console.log( data );
                }); */
            }
        },
        _callbacks: {},
        _messageHandler: function ( msg ) {
            if ( msg.hasOwnProperty( 'yerba' ) ) {
                if ( msg.yerba.hasOwnProperty( 'action' ) ) {
                    if ( msg.yerba.action === 'callback' ) {
                        //console.log( msg.yerba.data );
                        if ( this._callbacks.hasOwnProperty( msg.yerba.data ) ) {
                            //$.extend( msg.yerba.that, _yerbaWorker.prototype );

                            //this._buildFn( yerba.prototype, msg.yerba.that, 'emit' );

                            this._callbacks[ msg.yerba.data ]( msg.yerba.that );

                            // tidy up - delete reference to callback
                            delete this._callbacks[ msg.yerba.data ];
                        }
                    } else if ( msg.yerba.action === 'trigger' && this._triggers.hasOwnProperty( msg.yerba.data ) ) {
                        this._triggers[ msg.yerba.data ].call( this );
                    }
                }

                if ( msg.yerba.hasOwnProperty( 'trigger' ) && yerbaTriggers.hasOwnProperty( msg.yerba.trigger ) ) {
                    yerbaTriggers[ msg.yerba.trigger ].apply( null, args );

                } else if ( msg.yerba.hasOwnProperty( 'su' ) ) {


                } else if ( msg.yerba.hasOwnProperty( 'fn' ) ) {
                    var args = msg.yerba.hasOwnProperty( 'args' ) ? msg.yerba.args : [];


                } else if ( msg.yerba.hasOwnProperty( 'yerba' ) ) {
                    // msg.yerba.yerba;

                }
            }
        },
        _buildFn: function ( obj, target, fn ) {
            for ( var key in obj ) {
                var currentKey = obj[ key ];

                if ( $.isFunction( currentKey ) ) {
                    var currentLength = currentKey.length;

                    target[ key ] = ( function () {
                        var currentKey = key,
                            ret = function () {
                                var argh = $.toArray( arguments ),
                                    lastArgh = argh[ argh.length - 1 ],
                                    arghLength = argh.length,
                                    targetLength = currentLength,
                                    arghDiff = targetLength - arghLength,
                                    done = nullFunc;

                                if ( arghDiff === -1 ) {
                                    if ( $.isFunction( lastArgh ) ) {
                                        done = argh.pop();

                                        //for ( var i = -2;i > arghDiff; --i )
                                        //    argh.push( null );

                                        //argh.push( done );
                                    }
                                }

                                target[ fn ]( currentKey, argh, done );

                                //this.su( key, argh, lastArgh );
                            };

                        return ret;
                    })();
                    //console.log( _yerbaWorker );
                }
            }
        },
        _initWorker: function () {
            var that = this;

            this._buildFn( yerba, that, 'su' );

            //console.log( this );

            //this._buildFn( yerba.prototype, this, 'emit' );

            process.on( 'message', function( msg ) {
                that._messageHandler( msg );
            });
        },
        genCallbackId: function () {
            var r = $.genId();

            while ( this._callbacks.hasOwnProperty( r ) )
                r = $.genId();

            return r;
        },
        su: function ( fn, data, done ) {
            suOrFn.call( this, 'su', this, fn, data, done );
        },
        emit: function ( fn, data, done ) {
            suOrFn.call( this, 'fn', this, fn, data, done );
        }
    };

    module.exports = _yerbaWorker;

})();
