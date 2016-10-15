var express = require('express'),
    morgan = require('morgan'),
    bodyParser = require('body-parser'),
    path = require('path'),
    exphbs = require('express-handlebars'),
    errorHandler = require('errorhandler'),
    session = require('express-session'),
    router = express.Router(),
    passport = require('passport'),
    app = express(),
    mongoose = require('mongoose');

module.exports = function(ctx) {
    app.set('views', ctx.views || path.join(__dirname, '../client/views'));
    app.use(morgan('dev'));
    app.use(bodyParser.urlencoded({
        'extended': true
    }));
    app.use(bodyParser.json());

    // Use express session support since OAuth2orize requires it
    app.use(session({
        secret: ctx.secret || 'super secret for OAuth2orize',
        saveUninitialized: true,
        resave: true
    }));

    ctx.route(router);
    app.use(router);
    app.use('/public/', express.static(ctx.static || path.join(__dirname, '../client/public')));

    if ('development' === app.get('env') || ctx.env) {
        app.use(errorHandler());
    }

    app.engine('hbs', exphbs.create().engine);
    app.set('view engine', 'hbs');
    var connStr = 'mongodb://' + ctx.mongodb;
    mongoose.Promise = global.Promise;
    mongoose.connect(connStr);
    mongoose.connection.on('open', function() {
        console.log('Mongoose:' + connStr + ' is connected!');
    });
    var port = process.env.PORT || ctx.port || 3301;
    var server = app.listen(port, process.env.IP || "0.0.0.0", function() {
        var host = server.address().address;
        var port = server.address().port;

        console.log("Server is listening at http://%s:%s", host, port)
    });
};
