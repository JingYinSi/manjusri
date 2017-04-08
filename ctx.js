/**
 * Created by clx on 2017/4/8.
 */
const route = require('./server/routes'),
    wechat = require('./server/wechat/wechat');

module.exports = {
    port: 80,
    env: 'development',
    secret: 'jingyinmanjusriBiz',
    mongodb: 'shitongming:jIngyIn228793@121.41.93.210:17915/jingyin',
    wechat: {
        token: 'jingyinManjusri',
        post: wechat
    },
    route: route,
}
