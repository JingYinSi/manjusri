var express = require('express'),
    morgan = require('morgan'),
    bodyParser = require('body-parser'),
    xmlBodyParser = require('express-xml-bodyparser'),
    path = require('path'),
    wechat = require('wechat'),
    exphbs = require('express-handlebars'),
    moment = require('moment'),
    errorHandler = require('errorhandler'),
    session = require('express-session'),
    favicon = require('serve-favicon'),
    router = express.Router(),
    passport = require('passport'),
    app = express(),
    mongoose = require('mongoose');

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

    // Use express session support since OAuth2orize requires it
    app.use(session({
        secret: ctx.secret || 'super secret for OAuth2orize',
        saveUninitialized: true,
        resave: true
    }));

    if(ctx.wechat){
        app.use('/jingyin/wechat', wechat(ctx.wechat.token, ctx.wechat.post));
    }

    ctx.route(router);
    app.use(router);
    app.use('/', express.static(ctx.static || path.join(__dirname, '../client/public')));
    //app.use(favicon('/images/icon1.jpg'));
    if ('development' === app.get('env') || ctx.env) {
        app.use(errorHandler());
    }

    app.engine('hbs', exphbs.create({
        partialsDir: [path.join(__dirname, '../client/views/partials')],
        extname: '.hbs',
        helpers:{
            dateMMDD:function(timestamp){
                var m = moment(timestamp);
                return m.month() + '/' + m.day();
            }
        }
    }).engine);
    app.set('view engine', 'hbs');
    var connStr = 'mongodb://' + ctx.mongodb;
    mongoose.Promise = global.Promise;
    mongoose.connect(connStr);
    mongoose.connection.on('open', function () {
        console.log('Mongoose:' + connStr + ' is connected!');
    });
    var port = process.env.PORT || ctx.port || 3301;
    var server = app.listen(port, process.env.IP || "0.0.0.0", function () {
        var host = server.address().address;
        var port = server.address().port;

        console.log("Server is listening at http://%s:%s", host, port)
    });
};

//TODO:Template Caching
/*
 Template Caching
 This view engine uses a smart template caching strategy. In development, templates will always be loaded from disk, i.e., no caching. In production, raw files and compiled Handlebars templates are aggressively cached.

 The easiest way to control template/view caching is through Express' view cache setting:

 app.enable('view cache');
 Express enables this setting by default when in production mode, i.e.:

 process.env.NODE_ENV === "production"
 */