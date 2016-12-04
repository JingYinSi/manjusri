/**
 * Created by sony on 2016/10/13.
 */
var weixinModule = require('../modules/weixin'),
    weixinConfigFactory = require('../modules/weixinconfig'),
    weixinServiceFactory = require('../modules/weixinfactory');

const configData = {
    appId: "wx76c06da9928cd6c3",
    appSecret: "f4d498d87cf8641b83671a533c3999ec",
    mchId: "1364986702",
    mchKey: "womendoushiwutaishanjingyinsidet",
    apiBaseURL: "https://api.weixin.qq.com/sns/oauth2/",
    oauth2BaseURL: "https://open.weixin.qq.com/connect/oauth2/authorize",
    payServerIp: '121.41.93.210',
    payNotifyUrl: 'http://jingyintemple.top/jingyin/manjusri/pay/notify'
}

var weixinConfigObj = weixinConfigFactory(configData);

module.exports = {
    weixin: weixinModule(configData),
    weixinConfig: weixinConfigObj,
    weixinService: weixinServiceFactory(weixinConfigObj)
}


