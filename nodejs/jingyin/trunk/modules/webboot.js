var express = require('express'),
    os = require('os'),
    morgan = require('morgan'),
    bodyParser = require('body-parser'),
    xmlBodyParser = require('express-xml-bodyparser'),
    path = require('path'),
    wechat = require('wechat'),
    exphbs = require('express-handlebars'),
    moment = require('moment'),
    errorHandler = require('errorhandler'),
    session = require('express-session'),
    MongoDBStore = require('connect-mongodb-session')(session),
    favicon = require('serve-favicon'),
    router = express.Router(),
    passport = require('passport'),
    app = express(),
    mongoose = require('mongoose'),
    redirects = require('../server/wechat/redirects');

var log4js = require('log4js');
log4js.configure("log4js.conf", {reloadSecs: 300});
var logger = log4js.getLogger();

var auth = function (req, res, next) {
    var pid = process.pid;
    logger.debug('This request is processed by no.' + pid + ' !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    var sess = req.session;
    if (!sess.user) {
        logger.debug("begin login ..........................")
        req.session.redirectToUrl = req.originalUrl;
        return redirects.toLogin(req, res);
    }
    return next();
}

module.exports = function (ctx) {
    var pid = process.pid;
    logger.debug('The process no.' + pid + ' is running !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');

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


    var connStr = 'mongodb://' + ctx.mongodb;
    mongoose.Promise = global.Promise;
    mongoose.connect(connStr);
    mongoose.connection.on('open', function () {
        console.log('Mongoose:' + connStr + ' is connected!');
    });

    var store = new MongoDBStore(
        {
            uri: connStr,
            collection: 'sessions'
        });

    // Catch errors
    store.on('error', function (error) {
        assert.ifError(error);
        assert.ok(false);
    });

    // Use express session support since OAuth2orize requires it
    app.use(session({
        cookie: {maxAge: 1000 * 60 * 60 * 24 * 7},// 1 week
        secret: ctx.secret || 'super secret for session',
        saveUninitialized: false,
        resave: false,
        store: store
    }));

    if (ctx.wechat) {
        app.use('/jingyin/wechat', wechat(ctx.wechat.token, ctx.wechat.post));
    }

    //TODO:需要拉出来
    app.get('/jingyin/manjusri/lordvirtues', auth);
    app.get('/jingyin/manjusri/dailyvirtue', auth);
    app.get('/jingyin/manjusri/suixi', auth);
    app.get('/jingyin/manjusri/trans/:partId', auth);
    app.get('/jingyin/manjusri/lords/:openid/profile', auth);

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
/*
 Template Caching
 This view engine uses a smart template caching strategy. In development, templates will always be loaded from disk, i.e., no caching. In production, raw files and compiled Handlebars templates are aggressively cached.

 The easiest way to control template/view caching is through Express' view cache setting:

 app.enable('view cache');
 Express enables this setting by default when in production mode, i.e.:

 process.env.NODE_ENV === "production"
 */