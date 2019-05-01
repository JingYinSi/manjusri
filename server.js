require('dotenv').config();
const path = require('path'), 
	appBuilder = require('@finelets/hyper-rest/express/AppBuilder').begin(__dirname),
	restDir = path.join(__dirname, './server/rests'),
	graph = require('./server/flow'),
	cors = require('cors'),
	rests = require('@finelets/hyper-rest/rests')(restDir, graph);

const logger = require('@finelets/hyper-rest/app/Logger'),
	connectDb = require('@finelets/hyper-rest/db/mongoDb/ConnectMongoDb'),
	wechat = require('./server/wechat/wechat'),
	auth = require('./server/auth'),
	wechatLib = require('wechat')(token, wechat);

let app = appBuilder.getApp()
app.use(cors())

appBuilder
	.setWebRoot('/', './client/public')
	.setFavicon('client/public/images/icon1.jpg')
	.useMiddleware('/jingyin/wechat', wechatLib)
	.useMiddleware('/jingyin/manjusri/wx', auth)
	.setResources(...rests)
	.end();

connectDb(function() {
	logger.info('connect mongodb success .......');
	var server = appBuilder.run(function() {
		var addr = server.address();
		logger.info('the server is running and listening at ' + addr.port);
	});
});
