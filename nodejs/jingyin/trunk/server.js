var webboot = require('./modules/webboot'),
    route = require('./server/routes'),
    ctx = {
        port: 80,
        //views: __dirname + '/client/views',
        //'static': __dirname + '/client/public',
        env: 'development',
        secret: 'jingyinmanjusriBiz',
        mongodb: '121.41.93.210:27017/jingyin',
        route: route.initRoutes
    };

webboot(ctx);
