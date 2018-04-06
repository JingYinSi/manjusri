/*require('dotenv').config();
const path = require('path'),
    restsDir = path.join(__dirname, './server/rests'),
    finelets = require('@finelets/hyper-rest'),
    moment = require('moment'),
    resourceDescriptors = finelets.rests.directoryResourceDescriptorsLoader.loadFrom(restsDir),
    resourceRegistry = finelets.rests.resourceRegistry,
    graph = require('./server/flow'),
    transitionsGraph = finelets.rests.baseTransitionGraph(graph, resourceRegistry),
    connectDb = finelets.db.mongoDb.connectMongoDb,
    sessionStore = finelets.session.mongoDb(1000 * 60 * 60 * 24), // set session for 1 day
    appBuilder = finelets.express.appBuilder;

resourceRegistry.setTransitionGraph(transitionsGraph);

const wechat = require('./server/wechat/wechat'),
    token = process.env.WECHAT_APP_TOKEN,
    wechatLib = require('wechat')(token, wechat);

const routes = require('./server/routes');

var log4js = require('log4js');
var logger = log4js.getLogger();
logger.level = 'debug';*/

var express = require('express');
var app = express();

app.get('/', function (req, res) {
    res.send('Hello World!');
});

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});

/*var app = function () {
    //配置view engine
    var viewEngineFactory = finelets.express.handlebarsFactory(
        //按缺省规约：
        // partials目录为path.join(__dirname, './client/views') + '/partials'
        // views文件扩展名为'.hbs'
        'hbs', path.join(__dirname, './client/views'),
        {
            helpers: {
                dateMMDD: function (timestamp) {
                    return moment(timestamp).format('MM-DD');
                },
                dateYYYYMMDD: function (timestamp) {
                    return moment(timestamp).format('YYYY-MM-DD');
                }
            }
        });

    var app = appBuilder
        .begin(__dirname)
        .setViewEngine(viewEngineFactory)
        .setResources(resourceRegistry, resourceDescriptors)
        .setWebRoot('/', './client/public')
        .setFavicon('client/public/images/icon1.jpg')
        .setSessionStore(sessionStore)
        .useMiddleware('/jingyin/wechat', wechatLib)
        .setRoutes(routes)
        .end();

    connectDb(function () {
        logger.info('connect mongodb success .......');
        var port = process.env.PORT || 922;
        var server = app.listen(port, function () {
            //var addr = server.address();
            const h = server.address().address
            const p = server.address().port
            logger.info('The server is running and listening at ' + h + ":" + p);
        });

        /!*var server = appBuilder.run(function () {
            var addr = server.address();
            logger.info('the server is running and listening at ' + addr.port);
        });*!/
    });
}();*/
