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

module.exports = function (ctx) {
    var pid = process.pid;
    logger.debug('The process no.' + pid + ' is running !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');

    app.set('views', ctx.views || path.join(__dirname, '../client/views'));
    app.use(morgan('combined'));
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

    if (ctx.env === 'development') {
        app.use(function (req, res, next) {
            if(req.url.indexOf('/jingyin/') >= 0) {
                var info = "用户";
                info += "正在访问：" + req.url + ", 进程号：" + process.pid;
                logger.debug(info);
            }
            next();
        });
    }
    ctx.connectDb();
    ctx.useSession(app);

    if (ctx.wechat) {
        app.use('/jingyin/wechat', wechat(ctx.wechat.token, ctx.wechat.post));
    }

    //TODO:需要拉出来
    var auth = ctx.auth.manjusri;
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
