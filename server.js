require('dotenv').config();
const logger = require('@finelets/hyper-rest/app/Logger'),
	path = require('path'),
	moment = require('moment'),
	restsDir = path.join(__dirname, './server/rests'),
	resourceDescriptorLoader = require('@finelets/hyper-rest/rests/DirectoryResourceDescriptorsLoader')(restsDir),
	resourceDescriptors = resourceDescriptorLoader.loadAll(),
	resourceRegistry = require('@finelets/hyper-rest/rests/ResourceRegistry'),
	graph = require('./server/flow'),
	transitionsGraph = require('@finelets/hyper-rest/rests/BaseTransitionGraph')(graph, resourceRegistry),
    viewEngineFactory = require('@finelets/hyper-rest/express/HandlebarsFactory'),
    connectDb = require('@finelets/hyper-rest/db/mongoDb/ConnectMongoDb'),
	sessionStore = require('@finelets/hyper-rest/session/MongoDbSessionStore')(1000 * 60 * 60 * 24), // set session for 1 day
	appBuilder = require('@finelets/hyper-rest/express/AppBuilder').begin(__dirname);

resourceRegistry.setTransitionGraph(transitionsGraph);

const wechat = require('./server/wechat/wechat'),
	token = process.env.WECHAT_APP_TOKEN,
	wechatLib = require('wechat')(token, wechat);

const routes = require('./server/routes');

//配置view engine
const viewEngine = viewEngineFactory(
	//按缺省规约：
	// partials目录为path.join(__dirname, './client/views') + '/partials'
	// views文件扩展名为'.hbs'
	'hbs',
	path.join(__dirname, './client/views'),
	{
		helpers: {
			dateMMDD: function(timestamp) {
				return moment(timestamp).format('MM-DD');
			},
			dateYYYYMMDD: function(timestamp) {
				return moment(timestamp).format('YYYY-MM-DD');
			}
		}
	}
);

appBuilder
	.setViewEngine(viewEngine)
	.setResources(resourceRegistry, resourceDescriptors)
	.setWebRoot('/', './client/public')
	.setFavicon('client/public/images/icon1.jpg')
	.setSessionStore(sessionStore)
	.useMiddleware('/jingyin/wechat', wechatLib)
	.setRoutes(routes)
	.end();

connectDb(function() {
	logger.info('connect mongodb success .......');
	var server = appBuilder.run(function() {
		var addr = server.address();
		logger.info('the server is running and listening at ' + addr.port);
	});
});
