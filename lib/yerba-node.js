( function () {
    var cluster = require( 'cluster' ),
    
        yerba = require( './yerba-src' ),
        $ = yerba._$,

        yerbaTestPlugin = require( './yerba-test-plugin' )( yerba );

    if ( cluster.isMaster ) {
        // LISTEN FOR MESSAGES FROM WORKERS, HANDLE EVERYTHING
    } else {
        // SEND MESSAGES TO MASTER
    }

    module.exports = yerba;
})();
