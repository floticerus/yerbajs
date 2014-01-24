;(function () {
    var util = require( 'util' ),
        events = require( 'events' ),
        cluster = require( 'cluster' ),

        yerba = require( '../yerba-src' ),
        $ = yerba._$;

    function returnErr( err ){
        return err;
    }

    function _yerbaMaster() {
        events.EventEmitter.call( this );

        this._initMaster();
    }

    util.inherits( _yerbaMaster, events.EventEmitter );

    _yerbaMaster.prototype._initMaster = function () {
        var that = this;

        cluster
            /* .on( 'fork', function ( worker ) {
                console.log( 'worker forked: ' + worker.id );
            })
            .on( 'online', function ( worker ) {
                console.log( 'worker online: ' + worker.id );
            }) */
            .on( 'listening', function ( worker ) {
                console.log( 'worker listening: ' + worker.id );

                that.sendTriggerToWorker( worker, 'initialize' );

                worker.on( 'message', function ( msg ) {
                    if ( msg && msg.hasOwnProperty( 'yerba' ) ) {
                        var y = msg.yerba,
                            done = y.hasOwnProperty( 'done' ) && $.isFunction( y.done ) ? y.done : returnErr,
                            ret;

                        if ( y.hasOwnProperty( 'su' ) ) {
                            ret = that._methodHandler( worker, y.worker, yerba, yerba, y.su, y.args, y.callbackId );
                        }
                        else if ( y.hasOwnProperty( 'fn' ) ) {
                            //var newThat = Object.create( y.that );

                            //toYerba( newThat );
                            //console.log(y.that);
                            ret = that._methodHandler( worker, y.worker, yerba.prototype, y.that, y.fn, y.args, y.callbackId );
                        }

                        that.sendToWorker( worker, { 'yerba': ret } );
                    }
                });
            });
    };

    _yerbaMaster.prototype._methodHandler = function ( worker, yerbaWorker, obj, that, methodName, args, callbackId ) {
        if ( obj.hasOwnProperty( methodName ) && $.isFunction( obj[ methodName ] ) ) {
            //console.log(that);
            this.sendCallbackToWorker( worker, obj[ methodName ].apply( that, args ), callbackId );
        }
    };

    _yerbaMaster.prototype.sendToWorker = function ( worker, data ) {
        worker.send({ 'yerba': data } );
    };

    _yerbaMaster.prototype.sendActionToWorker = function ( worker, that, action, data ) {
        this.sendToWorker( worker, {  'action': action, 'data': data, 'that': that } );
    };

    _yerbaMaster.prototype.sendCallbackToWorker = function( worker, that, callbackId ) {
        this.sendActionToWorker( worker, that, 'callback', callbackId );
    };

    _yerbaMaster.prototype.sendTriggerToWorker = function ( worker, trigger ) {
        this.sendActionToWorker( worker, null, 'trigger', trigger );
    };

    module.exports = _yerbaMaster;

})();
