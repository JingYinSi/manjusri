/**
 * Created by sony on 2016/9/18.
 */
var path = require('path'),
    routes = require('./routes'),
    exphbs = require('express-handlebars'),
    express = require('express'),
    bodyParser = require('body-parser'),
    multer = require('multer'),
    cookieParser = require('cookie-parser'),
    morgan = require('morgan'),
    methodOverride = require('method-override'),
    errorHandler = require('errorhandler'),
    moment = require('moment');

module.exports = function (app) {
    app.use(morgan('dev'));
    app.use(bodyParser.urlencoded({'extended': true}));
    app.use(bodyParser.json());
    app.use(multer({ dest: path.join(__dirname, 'public/upload/temp')}).single('file'));
    app.use(methodOverride());
    app.use(cookieParser('some-secret-value-here'));
    routes(app);
    app.use('/public/', express.static(path.join(__dirname, '../public')));

    if ('development' === app.get('env')) {
        app.use(errorHandler());
    }
    /*app.engine('handlebars', exphbs.create({
        defaultLayout: 'man',
        layoutsDir: app.get('views') + '/layouts',
        partialsDir: [app.get('views') + '/partials'],
        helpers: {
            timeago: function (timestamp) {
                return moment(timestamp).startOf('minute').fromNow();
            }
        }
    }).engine);*/
    app.engine('handlebars', exphbs.create({
        defaultLayout: 'manjusri',
        layoutsDir: app.get('views') + '/layouts',
        helpers: {
            timeago: function (timestamp) {
                return moment(timestamp).startOf('minute').fromNow();
            }
        }
    }).engine);
    app.set('view engine', 'handlebars')
    return app;
};