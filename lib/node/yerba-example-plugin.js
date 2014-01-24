// plugins can be structured however you want, this is just an example

( function () {
    var yerba, $;

    function plugin(){}

    plugin.prototype = {
        // initialize method
        _init: function () {
            // this.foo = 'bar';

            return this
                .setCustomMethods()
                .handleEvents();
        },

        // add some methods to yerba
        setCustomMethods: function () {
            // return if yerba isn't set
            if ( !yerba )
                return this;

            // overwriting built-in methods is possible but not recommended

            // used by the yerba object itself
            yerba.logMessage = function ( msg ) {
                console.log( 'yerba said: ' + msg );
            };

            // used by individual yerbas
            yerba.fn.logMessage = function ( msg ) {
                console.log( 'yerba item ' + this._id + ' said: ' + msg );
            };

            return this;
        },

        handleEvents: function () {
            // handle some events from yerba
            /* yerba.on( 'data', function ( data ) {
                console.log( 'yerba event said: ' + data );
            });

            yerba.emit( 'send', [ 1, 2, 3, 4, 5 ] ); */

            return this;
        }
    };

    module.exports = function ( activeYerba ) {
        // make sure yerba is set before loading the plugin, for now
        // i would like to be able to just require yerba and have it sync up
        yerba = activeYerba;

        // grab the (tiny) internal helper class used by yerba - type checks, extend, genID, toArray, etc
        // could easily use whatever library you want, or not
        $ = yerba._$;

        // return the new plugin. it doesn't have to be in this format, or even return anything
        return new plugin()._init();
    };
})();
