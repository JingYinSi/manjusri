/**
 * Created by sony on 2016/10/13.
 */
var weixinConfigFactory = require('../modules/weixinconfig'),
    weixinServiceFactory = require('../modules/weixinfactory');

const configData = {
    appId: process.env.appId,
    appSecret: process.env.appSecret,
    mchId: process.env.mchId,
    mchKey: process.env.mchKey,
    apiBaseURL: "https://api.weixin.qq.com/sns/oauth2/",
    oauth2BaseURL: "https://open.weixin.qq.com/connect/oauth2/authorize",
    siteBaseUrl:process.env.siteBaseUrl,
    payServerIp: process.env.payServerIp,
    payNotifyUrl: process.env.payNotifyUrl
};

var weixinConfigObj = weixinConfigFactory(configData);

module.exports = {
    weixinConfig: weixinConfigObj,
    weixinService: weixinServiceFactory(weixinConfigObj)
};


