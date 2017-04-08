var express = require('express'),
    morgan = require('morgan'),
    bodyParser = require('body-parser'),
    xmlBodyParser = require('express-xml-bodyparser'),
    path = require('path'),

    exphbs = require('express-handlebars'),
    moment = require('moment'),
    errorHandler = require('errorhandler'),
    favicon = require('serve-favicon'),
    routes = require('../server/routes'),
    passport = require('passport'),
    app = express(),
    mongoose = require('mongoose'),
    redirects = require('../server/wechat/redirects');

var log4js = require('log4js');
log4js.configure("log4js.conf", {reloadSecs: 300});
var logger = log4js.getLogger();

module.exports = function (ctx) {
    app.set('views', ctx.views || path.join(__dirname, '../client/views'));
    app.use(morgan('dev'));
    app.use(bodyParser.urlencoded({
        'extended': true
    }));
    app.use(bodyParser.json());
    app.use(xmlBodyParser({
        explicitArray: false,
        normalize: false,
        normalizeTags: false,
        trim: true
    }));

    ctx.connectDb();
    ctx.useSession(app);
    ctx.userMiddlewares(app);
    routes.attachTo(app);

    app.use('/', express.static(ctx.static || path.join(__dirname, '../client/public')));
    app.use(favicon(path.join(__dirname, '../client/public/images/icon1.jpg')));
    if ('development' === app.get('env') || ctx.env) {
        app.use(errorHandler());
    }

    app.engine('hbs', exphbs.create({
        partialsDir: [path.join(__dirname, '../client/views/partials')],
        extname: '.hbs',
        helpers: {
            dateMMDD: function (timestamp) {
                return moment(timestamp).format('MM-DD');
            }
        }
    }).engine);
    app.set('view engine', 'hbs');

    var port = process.env.PORT || ctx.port || 3301;
    var server = app.listen(port, process.env.IP || "0.0.0.0", function () {
        var host = server.address().address;
        var port = server.address().port;

        console.log("Server is listening at http://%s:%s", host, port)
    });
};

//TODO:Template Caching
