require('dotenv').config();
const path = require('path'), 
	appBuilder = require('@finelets/hyper-rest/express/AppBuilder').begin(__dirname),
	restDir = path.join(__dirname, './server/rests'),
	graph = require('./server/flow'),
	cors = require('cors'),
	rests = require('@finelets/hyper-rest/rests')(restDir, graph);

const logger = require('@finelets/hyper-rest/app/Logger'),
	moment = require('moment'),
	viewEngineFactory = require('@finelets/hyper-rest/express/HandlebarsFactory'),
	connectDb = require('@finelets/hyper-rest/db/mongoDb/ConnectMongoDb'),
	// session = require('express-session')
	sessionStore = require('@finelets/hyper-rest/session/MongoDbSessionStore')(1000 * 60 * 60 * 24);
	// sessionStore = require('./server/MongoDbSrssionStore')(1000 * 60 * 60 * 24);

const wechat = require('./server/wechat/wechat'),
	token = process.env.WECHAT_APP_TOKEN,
	auth = require('./server/auth'),
	wechatLib = require('wechat')(token, wechat);

// const routes = require('./server/routes');

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

var app = appBuilder.getApp()
app.use(cors())
// app.use('/jingyin/manjusri', auth)
// app.use(auth)
// app.use(session({secret: process.env.SESSION_SECRET, saveUninitialized: true,resave: true}));
appBuilder
	.setViewEngine(viewEngine)
	.setWebRoot('/', './client/public')
	.setFavicon('client/public/images/icon1.jpg')
	.setSessionStore(sessionStore)
	.useMiddleware('/jingyin/wechat', wechatLib)
	.useMiddleware('/', auth)
	.setResources(...rests)
	// .setRoutes(routes)
	.end();

connectDb(function() {
	logger.info('connect mongodb success .......');
	var server = appBuilder.run(function() {
		// appBuilder.setSessionStore(sessionStore)
		var addr = server.address();
		logger.info('the server is running and listening at ' + addr.port);
	});
});
