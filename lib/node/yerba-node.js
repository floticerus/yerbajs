( function () {
    var cluster = require( 'cluster' ),
        yerba;

    if ( cluster.isMaster ) {
        // LISTEN FOR MESSAGES FROM WORKERS, HANDLE EVERYTHING
        var y = require( './yerba-master' );
        
        yerba = new y();

    } else {
        // SEND MESSAGES TO MASTER
        var y = require( './yerba-worker' );

        yerba = new y();
    }

    module.exports = yerba;
})();
