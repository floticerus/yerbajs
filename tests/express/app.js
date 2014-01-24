/**
 * Module dependencies.
 */
;( function () {
    var cluster = require( 'cluster' ),

        // always define yerba for all nodes, including master
        yerba = require( '../../lib/node/yerba-node' );
        //yerbaTestPlugin = require( '../../lib/node/yerba-example-plugin' )( yerba );

    if ( cluster.isMaster ) {
        // var yerbaTest = new yerba( [ 'yada', 'yada', { 'mixed': 'type' }, 5 ] );

        //yerbaTest.internalTest();

        for ( var i = 0; i < 4; i++ )
            cluster.fork();

        cluster.on( 'exit', function ( worker, code, signal ) {
            console.log( 'worker' + worker.process.pid + 'died' );
        });

        //var yerba1 = new yerba( [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ] ),
        //  yerba2 = new yerba( [ 'string', 45, { 'foo': 'bar' }, false, [ 'one', 'two' ] ] );


    } else {
        var express = require( 'express' ),
            routes = require( './routes' ),
            user = require( './routes/user' ),
            http = require( 'http' ),
            path = require( 'path' ),

            app = express();

        // all environments
        app.set( 'port', process.env.PORT || 3000 );
        app.set( 'views', path.join(__dirname, 'views' ) );
        app.set( 'view engine', 'ejs' );
        app.use( express.favicon() );
        app.use( express.logger('dev') );
        app.use( express.json() );
        app.use( express.urlencoded() );
        app.use( express.methodOverride() );
        app.use( app.router );
        app.use( require( 'stylus' ).middleware( path.join( __dirname, 'public' ) ) );
        app.use( express.static( path.join( __dirname, 'public' ) ) );
        app.use( '/lib', express.static( path.join( __dirname, '../../lib' ) ) );

        // development only
        if ( 'development' === app.get( 'env' ) )
            app.use(express.errorHandler());

        app.get('/', routes.index);
        app.get('/users', user.list);

        //yerba.brew('test', function (data) {
        //    console.log(data);
        //});

        // wait for yerba to be ready before firing anything
        yerba.ready( function () {
            yerba.brew( [ 'test' ], function ( instance ) {
                console.log( instance._yerbaId );
                //instance.add('added', function () {
                //    console.log( instance[ 1 ] );
                //});
            });
        });

        //setInterval( function () {
         //   console.log( yerba.yerbas() );
        //}, 1000 );

        http.createServer(app).listen(app.get('port'), function(){
            console.log('Express server listening on port ' + app.get('port'));
        });

    }
})();
