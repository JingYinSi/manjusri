var webboot = require('./modules/webboot'),
    route = require('./server/routes'),
    wechat = require('./server/wechat/wechat'),

    ctx = {
        port: 80,
        //views: __dirname + '/client/views',
        //'static': __dirname + '/client/public',
        env: 'development',
        secret: 'jingyinmanjusriBiz',
        mongodb: '121.41.93.210:17914/jingyin',
        wechat: {
            token: 'jingyinManjusri',
            post: wechat
        },
        route: route
    };

webboot(ctx);
